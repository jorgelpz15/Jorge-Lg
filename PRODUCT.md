# Product

## Register

product

## Users

Jorge y su grupo de amigos (3 a 8 personas), jugando en persona durante una
reunión o fiesta — cada quien desde su propio celular en vez de pasar uno
solo. Contexto típico: de noche, ambiente relajado, probablemente con tragos
de por medio, poca luz. Necesitan armar una partida rápido (crear o unirse a
una sala con un código de 4 dígitos) y que el juego se sienta fluido en el
celular sin instalar nada ni crear cuentas.

## Product Purpose

Una versión multijugador de "Cartas Contra la Humanidad — Edición México":
cada jugador ve su propia mano y toma sus decisiones desde su teléfono,
sincronizado en tiempo real con los demás (Firebase Firestore + auth
anónima). Reemplaza el modelo original de "pasar un solo celular". Éxito =
un grupo de amigos arma una sala en segundos, juega varias rondas sin
fricción técnica, y nadie se queda "atorado" en una pantalla si pierde
conexión o reabre el link.

## Brand Personality

Irreverente, oscuro y premium. El tono del contenido (las cartas) es humor
negro sin filtro — "un juego horrible para gente horrible" — pero la
interfaz en sí se ve cuidada y de lujo, no cutre ni infantil: negro profundo
con acentos dorados, tipografía fuerte, tarjetas que imitan cartas físicas.
El juego SÍ debe sentirse vivo: se dan la bienvenida animaciones y
microinteracciones lúdicas (selección de cartas, revelaciones, victorias) —
no es una app seria que deba sentirse quieta.

## Anti-references

Nada que se vea o se sienta como una app corporativa / dashboard SaaS
limpio — esto no es una herramienta de productividad, es un juego de fiesta
para adultos. Evitar también estética infantil o colores pastel/suaves.

## Design Principles

- **Cada celular es privado, todo lo demás es compartido.** La mano de cada
  jugador y sus decisiones en curso son solo suyas; el resto (carta negra,
  revelaciones, marcador) se sincroniza igual para todos en tiempo real.
- **Nunca dejar a nadie atorado.** Si alguien pierde conexión, reabre el
  link, o quiere salirse, siempre debe haber una salida clara (reconexión
  por código, botón de salir con confirmación) — el celular de nadie es un
  punto único de falla para el resto del grupo.
- **Lujo oscuro, no minimalismo corporativo.** Negro + dorado, contraste
  fuerte, tipografía con peso — la interfaz comunica "premium" incluso
  cuando el contenido es crudo o vulgar.
- **El juego se siente, no solo se lee.** Motion y microinteracciones son
  parte del diseño (selección de carta, revelación, ronda ganada), siempre
  con alternativa para `prefers-reduced-motion`.
- **Cero fricción de entrada.** Sin instalar nada, sin crear cuenta visible
  (auth anónima detrás de cámaras) — un código de 4 dígitos y un nombre
  bastan para unirse.

## Accessibility & Inclusion

Sin requisito formal de WCAG, pero el contraste y la legibilidad importan en
serio porque se juega de noche, con poca luz, y probablemente con una copa
encima: texto siempre legible sobre el fondo oscuro, tamaños de toque
grandes en botones y cartas, nunca depender solo del color para transmitir
un estado (usar también texto/iconos, como ya se hace con "conectado" ●
vs "desconectado").
