# Rocola — diseño

Sexto juego del hub "Juegos con Amigos". Inspirado en Hitster (adivinar el año de una
canción), pero sin línea de tiempo ni integración real de streaming — cada quien
adivina un año en privado y gana quien se acerca más, igual que ya funciona A
Rebanar.

## Resumen del juego

1. Cada ronda, un jugador distinto es el DJ (rota automáticamente, cada quien en su
   propio celular — no hace falta dispositivo fijo).
2. El DJ elige una era (80s / 90s / 2000s / Hoy). La app le sugiere una canción al
   azar de nuestro banco curado (con año ya verificado por nosotros) y un link de
   búsqueda directa en Spotify. El DJ la pone en voz alta desde su propio Spotify/
   YouTube/bocina — la app nunca reproduce audio.
3. El DJ toca "Ya la puse". Todos los demás (no el DJ) ven un slider y adivinan el
   año en privado.
4. Cuando todos adivinaron, se revela: canción real, año real, y quién quedó más
   cerca gana la ronda (empates permitidos).
5. Rota el DJ, siguiente ronda (3/5/10 configurable). Al final: ranking + revancha
   (mismo patrón que los otros 5 juegos).

## Por qué no hay línea de tiempo ni el DJ escribe el año

Decisión explícita en el brainstorming: en vez de una línea de tiempo (compartida o
por jugador) donde alguien coloca la canción y se revela si quedó bien, se optó por
el modelo de "adivina un número, gana el más cercano" — igual a como ya funciona A
Rebanar (adivinar un porcentaje). Esto simplifica mucho la construcción (sin drag,
sin geometría, sin SVG) y reutiliza un patrón ya probado del hub.

Además, en vez de que el DJ escriba el año real a mano (frágil — depende de que lo
sepa o no se equivoque/haga trampa), la app ya lo sabe de antemano porque viene de
nuestro propio banco curado de canciones con año verificado. El DJ solo elige una
canción sugerida y la pone — no teclea nada.

## Arquitectura

**Se construye primero la infraestructura compartida propuesta en
`PATHFINDER-2026-09-09/03-unified-proposal.md`, y Rocola es el primer juego que la
usa desde el día uno** (en vez de copiar el esqueleto `*App.jsx` por sexta vez, que
es justo la duplicación #1 que encontró el pathfinder):

- `src/shared/presencia.js` — `estaConectado`, `MARGEN_DESCONEXION_MS`.
- `src/shared/salaComun.js` — `generarCodigoUnico(salaRef)`,
  `latirPresenciaComun(ref, uid)`, `quitarJugadorTx(tx, ref, sala, uid, { requiereFase })`.
- `src/shared/useSalaSession.js` — hook `{ codigo, sala, handleEntrar, handleSalir }`
  que reemplaza el bloque de sesión/localStorage/heartbeat repetido en los otros 5
  `*App.jsx`.
- `src/shared/ConfirmarSalidaDialog.jsx` — diálogo "¿Salir de la sala?" compartido.

**Los otros 5 juegos NO se tocan en esta tanda** — se quedan con su código actual;
la migración a la infraestructura compartida es trabajo aparte, ya identificado en
`04-handoff-prompts.md`.

### Archivos nuevos de Rocola (siguen el patrón de A Rebanar)

- `src/rocola/RocolaApp.jsx` — usa `useSalaSession`, delgado.
- `src/rocola/LobbyRocola.jsx` — crear/unirse, mismo patrón que los otros lobbies.
- `src/rocola/JuegoRocola.jsx` — pantallas por fase.
- `src/rocola/salaRocola.js` — lógica de Firestore (colección `salasRocola`).
- `src/rocola/canciones.js` — banco curado de canciones por era (dato estático,
  como `gameData.js` de CAH).

## Modelo de datos (`salasRocola/{codigo}`)

```js
{
  codigo, creadaEn, anfitrion,
  jugadores: { [uid]: { nombre, visto, rondasGanadas, errorTotal } },
  orden: [uid, ...],           // orden de turno, define quién es DJ cada ronda
  ronda: 1,
  totalRondas: 5,              // 3 / 5 / 10, elegido al crear sala
  fase: "espera" | "jugando" | "revelando" | "fin",
  cancionActual: { titulo, artista, anioReal, era } | null,
  respuestas: { [uid]: anioAdivinado },   // no incluye al DJ
  ultimaRonda: { ganadores: [uid,...], tabla: { [uid]: { adivinado, error } } },
  cancionesUsadas: ["era:titulo", ...],   // evita repetir sugerencia en la misma partida
  salaNueva: null,
}
```

**DJ derivado, no guardado aparte:** `djActual = orden[(ronda - 1) % orden.length]`.
Evita un campo redundante que se pueda desincronizar.

**Ocultar el año real hasta revelar:** igual que el resto del hub (p. ej. las manos
de CAH), el documento completo es legible por cualquier autenticado, pero la UI
simplemente no le muestra `cancionActual.anioReal` a nadie que no sea el DJ hasta
`fase === "revelando"`. Mismo modelo de confianza ya aceptado en todo el proyecto
(reglas de Firestore permisivas, juego privado entre amigos).

## Flujo por fase

**`espera`** — igual que los otros 5: código de sala, lista de jugadores,
`ComoSeJuega`, elegir `totalRondas` al crear, botón "¡ARMAR JUEGO!" (mínimo 2
jugadores, sin modo libre especial — con 2 jugadores ya hay 1 DJ + 1 adivinador, que
sigue siendo útil aunque trivialmente "gane" quien adivina).

**`jugando`** — dos vistas según el uid:
- **Si `uid === djActual` y `cancionActual` es `null`:** pantalla "Elige una era"
  (80s/90s/2000s/Hoy) → la app sugiere una canción al azar del banco (sin repetir
  canciones ya usadas en esta sala) → muestra título+artista (NO el año) + botón
  "🔎 Buscarla en Spotify" (`https://open.spotify.com/search/<titulo query>`,
  se abre en pestaña nueva) + botón "🎵 Otra sugerencia" (por si no la conocen) +
  botón "Ya la puse" → escribe `cancionActual` completo (incluyendo `anioReal`) en
  Firestore vía `runTransaction`, sin cambiar de fase.
- **Si `uid === djActual` y `cancionActual` ya tiene valor:** pantalla "Esperando a
  que todos adivinen…" (igual al patrón "ya envié, esperando a los demás" del resto
  del hub).
- **Si `uid !== djActual` y `cancionActual` es `null`:** "Esperando a que
  `<nombre del DJ>` elija una canción…".
- **Si `uid !== djActual` y `cancionActual` tiene valor y el jugador ya
  adivinó:** "Ya enviaste tu año, esperando a los demás…".
- **Si `uid !== djActual`, `cancionActual` tiene valor, y no ha adivinado:**
  slider de año (rango `1960`–año actual, calculado con `new Date().getFullYear()`)
  + botón "Confirmar adivinanza" → `enviarRespuesta(codigo, uid, anioAdivinado)`
  (`runTransaction`; si todos los que no son DJ ya respondieron, calcula
  `errorMin`/`ganadores`, actualiza `rondasGanadas`/`errorTotal`, arma
  `ultimaRonda`, pasa a `fase: "revelando"`).

**`revelando`** — muestra título+artista+año real, tabla de adivinanzas ordenada por
cercanía, gente que ganó destacada. Botón "Siguiente ronda →" (`avanzar`,
`runTransaction`: si `ronda >= totalRondas` → `fase: "fin"`; si no, `ronda++`,
resetea `cancionActual: null` y `respuestas: {}`, vuelve a `fase: "jugando"` — el
nuevo DJ ya queda determinado solo por la fórmula de `orden`/`ronda`).

**`fin`** — ranking por `rondasGanadas` (empate: menor `errorTotal`), "Jugar otra
vez"/"Unirme a la revancha" (mismo patrón `jugarOtraVez` que los otros 5 juegos).

## Banco de canciones (`src/rocola/canciones.js`)

Dato estático, igual que `gameData.js`. Estructura:

```js
export const CANCIONES = {
  "80s":   [{ titulo, artista, anio }, ...],
  "90s":   [...],
  "2000s": [...],
  "hoy":   [...], // 2010-presente
};
```

**Regla de clasificación: cada canción va en la era de su año real de
lanzamiento, no de cuándo se volvió popular o se hizo conocida.** Adivinar
correctamente ese desfase (una canción que "se siente" de otra época) es justo
parte de la gracia del juego — no hay que suavizarlo agrupando por vibra.

**Set inicial propuesto para tu revisión antes de cargarlo** (mezcla de éxitos en
inglés y latinos/mexicanos, pensando en tu grupo — ajusta lo que no cuadre; años de
mejor esfuerzo, vale la pena que confirmes los que más te importen):

- **80s:** Billie Jean (MJ, 1983) · Sweet Child O' Mine (GNR, 1987) · Livin' on a
  Prayer (Bon Jovi, 1986) · Take on Me (a-ha, 1985) · Thriller (MJ, 1982) · Total
  Eclipse of the Heart (Bonnie Tyler, 1983) · Africa (Toto, 1982) · Querida (Juan
  Gabriel, 1984) · Amor Eterno (Juan Gabriel, 1984) · La Bamba (Los Lobos, 1987) ·
  La Incondicional (Luis Miguel, 1988)
- **90s:** Smells Like Teen Spirit (Nirvana, 1991) · Wonderwall (Oasis, 1995) · …Baby
  One More Time (Britney Spears, 1998) · Livin' la Vida Loca (Ricky Martin, 1999) ·
  My Heart Will Go On (Celine Dion, 1997) · Macarena (Los Del Río, 1996) · Como la
  Flor (Selena, 1992) · Rayando el Sol (Maná, 1990) · Genie in a Bottle (Christina
  Aguilera, 1999)
- **2000s:** Hey Ya! (OutKast, 2003) · Crazy in Love (Beyoncé, 2003) · Hips Don't
  Lie (Shakira, 2006) · Toxic (Britney Spears, 2003) · Poker Face (Lady Gaga, 2008)
  · Since U Been Gone (Kelly Clarkson, 2004) · Sálvame (RBD, 2005) · Ni Una Sola
  Palabra (Paulina Rubio, 2000) · Umbrella (Rihanna, 2007) · Bad Romance (Lady Gaga,
  2009)
- **hoy:** Uptown Funk (Bruno Mars, 2014) · Despacito (Luis Fonsi, 2017) · Shape of
  You (Ed Sheeran, 2017) · Blinding Lights (The Weeknd, 2019) · Bad Guy (Billie
  Eilish, 2019) · As It Was (Harry Styles, 2022) · Tití Me Preguntó (Bad Bunny,
  2022) · Ella Baila Sola (Peso Pluma, 2023) · Flowers (Miley Cyrus, 2023) ·
  Anti-Hero (Taylor Swift, 2022)

**No cargar este set hasta que Jorge lo revise y ajuste.**

## Componentes reutilizados sin cambio

`S` (styles.js), `MENSAJES_ERROR_TURNO` (mensajesError.js — Rocola tiene fase, mismo
grupo que CAH/Semáforo/A Rebanar), `ComoSeJuega`, `useSalaSession` /
`ConfirmarSalidaDialog` / `presencia.js` / `salaComun.js` (nuevos, compartidos).

## Manejo de errores / bordes

- DJ se desconecta antes de elegir canción: mismo comportamiento aceptado del resto
  del hub (el juego espera; el DJ puede reconectar con el código). No se agrega un
  mecanismo especial para saltarse un DJ ausente en este MVP.
- Canción sugerida repetida: se filtra contra las ya usadas en `sala.cancionesUsadas`
  (array de `"era:titulo"` o similar) dentro de la misma partida; si se agota una
  era, se permite repetir (aviso "ya no hay canciones nuevas de esta era, se puede
  repetir").
- Botón "🔎 Buscarla en Spotify" abre `open.spotify.com/search/...` en pestaña
  nueva — no requiere cuenta de Spotify Premium de la app (la cuenta la usa quien
  la abre en su propio celular).

## Pruebas antes de dar por terminado

Mismo patrón que el resto del hub: probar sincronización real con un script
temporal de Node (copiando la lógica real de `salaRocola.js`, no reimplementada),
simulando 2+ jugadores contra el Firebase real; borrar sala de prueba y script al
terminar. Verificar visualmente cada fase en el navegador (incluyendo el turno de
DJ rotando correctamente entre rondas).

## Alcance explícitamente fuera de este MVP

- Integración real con la API de Spotify (reproducción, autenticación) — se
  descartó desde el brainstorming por licencias/complejidad.
- Línea de tiempo (compartida o individual) — se descartó a favor de "adivina un
  número".
- Editor de canciones desde la UI (agregar/quitar canciones del banco) — el banco
  vive en código (`canciones.js`), se edita ahí si se quiere ampliar.
- Migración de los otros 5 juegos a la infraestructura compartida — trabajo aparte
  (ver `PATHFINDER-2026-09-09/04-handoff-prompts.md`).
