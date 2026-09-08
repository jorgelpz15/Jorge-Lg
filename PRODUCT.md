# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jorge y su grupo de amigos (3 a 8 personas por sala, hasta 12 en los juegos
sin turnos), jugando en persona durante una reunión o fiesta — cada quien
desde su propio celular en vez de pasar uno solo (o, en Ponte Pedo, un solo
celular/tablet pasado entre el grupo si así lo prefieren). Contexto típico:
de noche, ambiente relajado, probablemente con tragos de por medio, poca
luz. Necesitan armar una partida rápido (crear o unirse a una sala con un
código de 4 dígitos) y que el juego se sienta fluido en el celular sin
instalar nada ni crear cuentas.

## Product Purpose

**"Juegos con Amigos"**: un hub de juegos de fiesta multijugador, cada uno
con su propia mecánica pero la misma columna vertebral técnica — Firebase
Firestore en tiempo real + auth anónima, código de sala de 4 dígitos, sin
cuentas. Juegos actuales:

- **Cartas Contra la Humanidad — Edición México**: versión multijugador del
  juego de cartas; cada jugador ve su propia mano y vota por la mejor
  combinación. Reemplaza el modelo original de "pasar un solo celular".
- **A Rebanar**: cortar una figura lo más cerca posible de un porcentaje
  objetivo.
- **Semáforo**: reacción tipo salida de F1 — tocar en cuanto se apagan las
  luces, sin adelantarse.
- **Dados**: tirar hasta 10 dados y ver el mismo resultado al instante —
  herramienta compartida, no competitiva, para apoyar otros juegos de mesa.
- **Ponte Pedo**: sacar una carta con un reto (regla, cascada, nunca nunca…)
  — incluye modo "Jugar solo" 100% local para pasar un solo dispositivo.

Éxito = un grupo de amigos arma una sala en segundos en cualquiera de los 5
juegos, juega varias rondas sin fricción técnica, y nadie se queda
"atorado" en una pantalla si pierde conexión o reabre el link.

## Positioning

A diferencia de una app de juegos de mesa genérica o de pasar un solo
celular entre el grupo, cada quien participa desde su propio dispositivo,
sincronizado en tiempo real, sin crear cuenta ni instalar nada — un código
de 4 dígitos y un nombre bastan. Ningún juego del hub depende de conexión
persistente perfecta: cualquiera puede perder señal, recargar, o volver a
entrar con el mismo código sin romper la partida para el resto del grupo.

## Operating Context

Se juega en persona, en grupo, casi siempre de noche y en un ambiente
social relajado (reunión, fiesta), con el celular de cada quien como
interfaz principal — mobile-first estricto, todo con el pulgar. Es común
que haya poca luz y que los jugadores hayan bebido. Ponte Pedo además
contempla el escenario de un solo dispositivo (celular o tablet) rolado
entre el grupo en vez de que cada quien tenga el suyo.

## Capabilities and Constraints

- Tiempo real vía Firebase Firestore; identidad de jugador = usuario
  anónimo de Firebase Auth (`esperarMiUid`), sin registro visible.
- Las reglas de seguridad de Firestore (`firestore.rules`) solo validan
  `request.auth != null` y el formato de código de 4 dígitos — cualquier
  autenticado puede escribir cualquier campo de cualquier sala. Decisión
  deliberada por ser un juego privado entre amigos; habría que endurecerlas
  si el proyecto se abriera al público.
- El tope de jugadores por sala difiere sin explicarse al usuario: 8 para
  CAH/A Rebanar/Semáforo (juegos con concepto de turno/fase "jugando"), 12
  para Dados/Ponte Pedo (herramientas compartidas sin turnos). Constatado
  como hueco de comunicación pendiente, no como error.
- Deploy en Cloudflare Pages (`cartas-cah-mx.pages.dev`); Firebase se usa
  solo para Firestore/Auth, no para hosting.
- Sin requisito formal de WCAG, pero el contraste real (≥4.5:1 para texto
  informativo) es un piso no negociable dado el contexto de noche/poca luz
  (ver `DESIGN.md`).

## Brand Commitments

Nombre del hub: "Juegos con Amigos". Juego insignia: "Cartas Contra la
Humanidad — Edición México". El contenido de las cartas es humor negro sin
filtro ("un juego horrible para gente horrible"), pero la interfaz en sí se
ve cuidada y de lujo, nunca cutre ni infantil — negro profundo con acentos
dorados, tipografía fuerte. Ver `DESIGN.md` para el sistema visual completo
("El Casino Clandestino").

## Evidence on Hand

Ninguna — proyecto personal sin casos de estudio, testimonios, prensa, ni
métricas externas que preservar. No fabricar ninguno en trabajo futuro.

## Product Principles

- **Cada celular es privado, todo lo demás es compartido.** La mano/las
  decisiones en curso de cada jugador son solo suyas; el resto (carta
  negra, revelaciones, marcador, resultado del tiro) se sincroniza igual
  para todos en tiempo real.
- **Nunca dejar a nadie atorado.** Perder conexión, reabrir el link, o
  querer salirse siempre tiene una salida clara — el celular de nadie es un
  punto único de falla para el resto del grupo.
- **Cero fricción de entrada.** Sin instalar nada, sin crear cuenta visible
  — un código de 4 dígitos y un nombre bastan para unirse a cualquiera de
  los 5 juegos.
- **El juego se siente, no solo se lee.** El motion y las microinteracciones
  son parte de la experiencia (selección, revelaciones, victorias), no un
  extra opcional.
- **Resolver una noche de grupo, no una partida perfecta.** El objetivo es
  que el grupo pueda encadenar rondas y hasta cambiar de juego sin fricción
  técnica — no maximizar la profundidad de un solo juego.

## Accessibility & Inclusion

Sin requisito formal de WCAG, pero el contraste y la legibilidad importan
en serio porque se juega de noche, con poca luz, y probablemente con una
copa encima: texto siempre legible sobre el fondo oscuro, tamaños de toque
grandes en botones y cartas, nunca depender solo del color para transmitir
un estado (usar también texto/iconos, como ya se hace con "conectado" ●
vs "· desconectado" en los 5 juegos).
