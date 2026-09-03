# Cartas Contra la Humanidad — Edición México (hub "Juegos con Amigos")

## Qué es esto

Hub de juegos de fiesta multijugador para grupos de amigos (3-8 personas)
jugando en persona, cada quien desde su propio celular. Juegos actuales: CAH,
A Rebanar, Semáforo, Dados, Ponte Pedo. Sin instalar nada, sin crear cuenta
visible — un código de sala de 4 dígitos y un nombre bastan para unirse.
Contexto de uso real: de noche, poca luz, probablemente con tragos de por
medio — la legibilidad y la ausencia de fricción importan en serio.

Ver [PRODUCT.md](PRODUCT.md) para producto/audiencia completo y
[DESIGN.md](DESIGN.md) para el sistema de diseño completo (colores,
tipografía, componentes). Este archivo es el resumen operativo — no lo
reemplaza.

## Stack

- React 18 + Vite, sin TypeScript
- Firebase Firestore (datos en tiempo real) + Auth anónima
- `npm run dev` / `npm run build` / `npm run preview`
- Deploy: Cloudflare Pages (`cartas-cah-mx.pages.dev`); Firebase solo se usa
  para Firestore/Auth (proyecto `cartas-cah-mx`), `firebase.json` no tiene
  bloque de `hosting`

## Skills a usar

- Para cualquier trabajo con Firestore (queries, reglas de seguridad,
  transacciones, seeding, modelado de datos) usar la skill
  `firebase-firestore`.

## Reglas técnicas que SIEMPRE hay que respetar

- **No arrays anidados en Firestore** (`[[x,y],[x,y]]`). Convertir a array de
  objetos (`[{x,y},{x,y}]`) antes de guardar, y de vuelta al leer.
- **Toda colección nueva (`salasXxx`) necesita su bloque en
  `firestore.rules`, Y ese archivo se despliega APARTE del código**:
  `firebase deploy --only firestore:rules --project cartas-cah-mx`. Un push a
  GitHub nunca lo despliega solo. Desplegar las reglas ANTES de probar un
  juego nuevo en el navegador, no después de que falle con "No se pudo crear
  la sala".
- **Contadores/valores compartidos que varios jugadores pueden tocar rápido
  (+/-, etc.) → usar `runTransaction`**, nunca `updateDoc` con el valor que
  ya tenía React en pantalla (se "comen" toques por lecturas obsoletas).
- **Sesión guardada en `localStorage`** (`{juego}_sesion`) para volver directo
  a la sala al reabrir. Si un jugador no toca "Salir" al terminar, su sesión
  sigue apuntando a la sala vieja — comportamiento esperado, no bug.
- **Patrón "Jugar otra vez" / revancha**: función `jugarOtraVez(...)` crea
  sala nueva y escribe `salaNueva: <código>` en la sala vieja; todos los que
  siguen viendo la sala vieja (listener de Firestore) ven aparecer solos el
  botón "Unirme a la revancha".
- **Versión visible en pantalla** (`__APP_VERSION__` desde `package.json`,
  inyectado por `vite.config.js`) — subir el número antes de cada
  build/deploy para confirmar en el celular real que cargó la versión nueva.
- Reglas de seguridad actuales solo validan `request.auth != null` y formato
  de código de sala — cualquier autenticado puede escribir cualquier campo.
  Aceptable para juego privado entre amigos; endurecer si esto se abre al
  público.

## Antes de dar algo por terminado

- Probar sincronización multijugador real con scripts temporales en
  `scripts/` que copien la lógica real de `sala.js` (no reimplementarla de
  memoria), hablando con el Firebase real del proyecto. Borrar scripts y
  salas de prueba al terminar (`firebase firestore:delete "coleccion/codigo"
  --force`).
- Revisar `ls -la` antes de `git add` — a veces aparecen archivos vacíos con
  nombres raros (quirk del entorno, no del proyecto); borrarlos antes de
  comitear.
- Verificar el deploy en vivo contra el bundle real, no solo confiar en que
  el build local pasó.
- Ver [BUENAS_PRACTICAS.md](BUENAS_PRACTICAS.md) para el detalle completo de
  bugs ya encontrados y cómo se resolvieron (mínimos con valores de
  penalización, juegos sensibles al tiempo, etc.) antes de tocar algo
  parecido.

## Diseño — resumen (detalle completo en DESIGN.md)

**Norte creativo: "El Casino Clandestino".** Irreverente, oscuro, premium —
nunca estética de app corporativa/SaaS ni colores pastel/infantiles.

- Un solo acento: Oro de Casino `#ffd700` sobre escala de negros
  (`#0a0a0a` fondo, `#111` superficie, `#1a1a1a` segunda superficie).
- Una sola familia tipográfica: Helvetica Neue, peso 700-900, jerarquía por
  tamaño/peso/letter-spacing, nunca mezclando fuentes.
- Sombras tipo resplandor difuso ("cartas flotando en la oscuridad"), nunca
  relieve duro tipo Material.
- Colores de estado (verde/rojo/ámbar/naranja) solo para feedback de juego,
  nunca decorativos.
- Motion y microinteracciones son parte del diseño (no opcional), siempre con
  alternativa `prefers-reduced-motion`.
- Nunca dejar a nadie "atorado" en una pantalla — siempre salida clara.
