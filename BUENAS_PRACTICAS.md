# Buenas prácticas — Juegos con Amigos

Este archivo junta las lecciones y patrones que hemos ido encontrando al construir
los juegos de este hub (CAH, A Rebanar, y los que sigan). La idea es que cuando
se arme un juego nuevo, o se le agregue algo a uno existente, se revise esta
lista primero — para no repetir el mismo bug dos veces, y para copiar las
mejoras de un juego a los demás.

## Reglas técnicas de Firestore

- **No se permiten arrays anidados** (un array cuyos elementos son arrays,
  como `[[x,y],[x,y]]`). Si un dato tiene esa forma, convertirlo a un array de
  objetos (`[{x,y},{x,y}]`) antes de guardarlo, y convertirlo de vuelta al
  leerlo. Nos pasó dos veces (en CAH con las respuestas reveladas, y en A
  Rebanar con los puntos de las figuras) — mismo bug, mismo arreglo.
- Las reglas de seguridad (`firestore.rules`) por ahora solo validan que
  `request.auth != null` y que el código de sala tenga el formato correcto
  (4 dígitos). No restringen que un jugador solo pueda escribir sus propios
  campos — cualquier usuario autenticado puede escribir cualquier campo de
  cualquier sala. Está bien para un juego de fiesta con amigos, pero si algún
  día esto se abre al público habría que endurecerlo.
- **Cada juego nuevo necesita su propia colección, y su propio bloque en
  `firestore.rules`** (`match /nombreColeccion/{codigo} {...}`) — y ese
  archivo se despliega APARTE del código con
  `firebase deploy --only firestore:rules`. Un push a GitHub jamás lo
  despliega solo. Se nos olvidó al agregar Semáforo y la sala no se podía
  crear ("No se pudo crear la sala") hasta que se corrió ese comando —
  revisarlo antes de probar un juego nuevo, no después de que falle.

## Patrón: sesión guardada en el celular (`localStorage`)

Cada juego guarda `{codigo}` en `localStorage` (p. ej. `cah_sesion`,
`rebanar_sesion`) para que si cierras y reabres el navegador, vuelvas
directo a tu sala en vez de tener que escribir el código de nuevo.

**Efecto secundario a tener en cuenta:** si un jugador llega a la pantalla
de "fin" y NO toca explícitamente "Salir de la sala"/"Salir a inicio", su
sesión sigue apuntando a esa sala ya terminada. La próxima vez que abra el
juego, va a seguir viendo el marcador de la partida vieja — no es un bug de
datos, es que literalmente sigue en la sala vieja. Esto se sintió como "no se
reinicia el conteo" pero en realidad es "nunca salí de la sala anterior".

## Patrón: "Jugar otra vez" con un clic (agregado primero en A Rebanar)

Para resolver lo anterior sin depender de que todos se acuerden de salir:

1. En la sala vieja, agregar un campo `salaNueva: null` desde que se crea.
2. Una función `jugarOtraVez(codigoViejo, uid, nombre, ...configDelJuego)` que:
   - Crea una sala nueva (reutilizando la función normal de crear sala).
   - Le escribe `salaNueva: <códigoNuevo>` a la sala VIEJA.
3. En la pantalla de "fin", si `sala.salaNueva` ya tiene valor, mostrar un
   botón "Unirme a la revancha (código)" en vez de "Jugar otra vez" — así,
   en cuanto CUALQUIER jugador arma la revancha, a todos los demás (que
   siguen viendo la sala vieja por el listener de Firestore) les aparece el
   botón automáticamente, sin compartir el código a mano.
4. El botón, al tocarlo, llama a la función normal de unirse a sala (con el
   nombre que ya tenía el jugador) y navega a la sala nueva.

**Ya portado a CAH también** (13-ago-2026): mismo patrón, mismos nombres de
función (`jugarOtraVez`, botón "🔁 Jugar otra vez" / "🔁 Unirme a la
revancha"). La revancha repite automáticamente el idioma y el umbral de
shots de la sala vieja (decisión: no preguntar de nuevo, un clic y ya).

## Patrón: número de versión visible

`vite.config.js` inyecta `__APP_VERSION__` desde `package.json` en el build.
Cada juego lo muestra chiquito en pantalla (`v1.6.0`) para poder confirmar de
un vistazo, en el celular real, que ya cargó la versión nueva y no una vieja
en caché. Subir el número en `package.json` antes de cada build/deploy.

## Metodología de pruebas antes de dar algo por terminado

- Para probar sincronización multijugador de verdad (no solo con una
  pestaña), usar scripts temporales de Node en `scripts/` que copian
  literalmente la lógica real de `sala.js`/`salaRebanar.js` (no reimplementarla
  de memoria) y hablan directo con el Firebase real del proyecto.
- Siempre borrar esos scripts y las salas de prueba en Firestore al terminar
  (`firebase firestore:delete "coleccion/codigo" --force`).
- Antes de cualquier `git add`, revisar `ls -la` — en este entorno aparecen de
  vez en cuando archivos vacíos con nombres raros (fragmentos de código, como
  `(jugadores[u].rondasGanadas` o `{`). Son un quirk del entorno, no del
  proyecto — borrarlos antes de comitear.
- Verificar el deploy en vivo revisando el bundle real
  (`curl .../assets/index-HASH.js | grep "texto único de la funcionalidad"`),
  no solo confiar en que el build local pasó.

## Ideas de UI que valió la pena aplicar

- Mostrar el desglose completo de un resultado partido en dos (ej. "51% –
  49%"), no solo un lado — se entiende de un vistazo sin tener que calcular
  el otro número mentalmente.

## Cuidado con "valores de penalización" mezclados en un mínimo/máximo

En Semáforo, una salida en falso se guarda con un tiempo de penalización fijo
(5000ms) para que cuente como "el peor tiempo posible" al sumar el total de
la partida. Bug real que encontramos: si se calcula el ganador de la ronda
con `Math.min(...todos los tiempos)` ANTES de quitar a los que salieron en
falso, ese valor de penalización puede terminar siendo "más bajo" que una
reacción válida pero lenta — y entonces nadie gana la ronda por error (ni
siquiera el que sí reaccionó bien). La regla: primero filtrar los válidos,
LUEGO calcular el mínimo/ganador solo entre esos. Cualquier juego futuro que
mezcle "un valor normal" con "un valor de penalización/sentinela" en la misma
lista debe filtrar antes de comparar, no comparar y filtrar después.

## Botones de +/- que ajustan un número compartido: usar transacción

En Dados, el selector de "cuántos dados" (+/-) al principio hacía
`updateDoc(ref, { numDados: sala.numDados + 1 })` usando el valor que React
ya tenía en pantalla. Si alguien toca +/- varias veces rápido, cada toque
puede leer el MISMO valor viejo (porque todavía no llegó la confirmación del
toque anterior) y el número no sube lo que debería — se "comen" toques.
Arreglo: usar `runTransaction` para leer el valor más reciente directo del
servidor en el momento de escribir, no el que ya tenía guardado el celular.
Aplica a cualquier +/- o contador compartido entre varios jugadores.

## Juegos sensibles al tiempo (reacción, cronómetros)

Semáforo sincroniza la secuencia de luces con un `serverTimestamp()` +
una demora aleatoria guardados una sola vez en la sala, y cada celular
programa su propia animación a partir de esa hora. El tiempo de reacción se
mide con el reloj del PROPIO celular (toque menos apagón, mismo reloj para
las dos marcas), así que no importan diferencias de reloj entre celulares.
Lo que sí puede variar un poco entre celulares es el momento exacto en que
CADA UNO recibe el aviso de Firestore de que empezó la ronda (la típica
latencia de red) — para un juego casual entre amigos es una diferencia de
milisegundos, aceptable; no vale la pena construir sincronización de reloj
tipo NTP para esto.
