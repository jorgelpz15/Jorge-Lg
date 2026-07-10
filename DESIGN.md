---
name: Cartas Contra la Humanidad — Edición México
description: Juego de fiesta multijugador, cada quien desde su propio celular
colors:
  oro-casino: "#ffd700"
  negro-medianoche: "#0a0a0a"
  negro-absoluto: "#000000"
  carbon: "#111111"
  grafito: "#1a1a1a"
  borde-grafito: "#333333"
  borde-carbon: "#222222"
  blanco-carta: "#ffffff"
  texto-principal: "#ffffff"
  texto-secundario: "#888888"
  texto-terciario: "#7a7a7a"
  verde-confirmado: "#4caf50"
  rojo-alarma: "#ff4444"
  ambar-tequila: "#ff8800"
  naranja-racha: "#ff6b35"
typography:
  display:
    fontFamily: "'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(28px, 8vw, 42px)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "3px"
  headline:
    fontFamily: "'Helvetica Neue', Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: 1.3
  title:
    fontFamily: "'Helvetica Neue', Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 900
    lineHeight: 1.3
  body:
    fontFamily: "'Helvetica Neue', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
  label:
    fontFamily: "'Helvetica Neue', Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "2px"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  xxl: "20px"
  pill: "100px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.oro-casino}"
    textColor: "#000000"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  button-primary-hover:
    backgroundColor: "#e6c200"
  button-secondary:
    backgroundColor: "{colors.blanco-carta}"
    textColor: "#000000"
    rounded: "{rounded.lg}"
    padding: "15px 20px"
  button-ghost:
    backgroundColor: "{colors.grafito}"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.lg}"
    padding: "14px"
  card-surface:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.xxl}"
    padding: "36px 20px"
  chip:
    backgroundColor: "{colors.grafito}"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  input-field:
    backgroundColor: "{colors.grafito}"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.md}"
    padding: "13px 14px"
---

# Design System: Cartas Contra la Humanidad — Edición México

## 1. Overview

**Creative North Star: "El Casino Clandestino"**

Un cuarto trasero de apuestas al que solo entran los amigos: oscuridad total,
un único destello de oro, y cartas físicas que se sienten reales bajo el
pulgar. La personalidad del sistema es irreverente, oscura y de lujo — el
contenido del juego es humor negro sin filtro ("un juego horrible para gente
horrible"), pero la interfaz nunca se ve barata ni infantil. Rechaza
explícitamente cualquier estética de app corporativa o dashboard SaaS
limpio: nada de tarjetas grises intercambiables, nada de azules
"confiables", nada de colores pastel. El movimiento y las microinteracciones
son bienvenidos y esperados — esto es un juego, no una herramienta seria; se
siente vivo, no una pantalla quieta.

**Key Characteristics:**
- Fondo negro casi absoluto con un solo acento dorado que hace todo el trabajo de jerarquía
- Cartas de juego que imitan objetos físicos reales (blancas sólidas, negras con borde)
- Profundidad por sombras suaves tipo resplandor — "cartas flotando en la oscuridad" — no cajas planas ni relieves duros
- Tipografía única (Helvetica Neue), sin mezclar familias; el peso y el tamaño cargan toda la jerarquía
- Mobile-first estricto: todo se juega con el pulgar, de noche, en una sola mano

## 2. Colors

Paleta restringida a propósito: un solo acento dorado sobre una escala de
negros, con colores de estado (verde, rojo, ámbar) reservados exclusivamente
para retroalimentación del juego, nunca decorativos.

### Primary
- **Oro de Casino** (#ffd700): el único acento de marca. Botones principales de acción (confirmar, votar, armar juego), cartas resaltadas dentro del texto de la carta negra, el código de sala, bordes de "ronda dorada". Aparece en menos del 10% de cualquier pantalla — su escasez es lo que lo hace sentir valioso.

### Neutral
- **Negro Medianoche** (#0a0a0a): fondo base de toda página (`S.page`).
- **Negro Absoluto** (#000000): fondo de la carta negra en juego y del `<body>` global — el "vacío" detrás de todo.
- **Carbón** (#111111): superficie elevada — tarjetas (`S.card`), chips, cajas de código, contenedores de resultados.
- **Grafito** (#1a1a1a): segunda superficie elevada — inputs, botones fantasma, chips de nombres de jugador.
- **Borde Grafito** (#333333) / **Borde Carbón** (#222222): únicos bordes permitidos; nunca un borde de color salvo dorado o rojo de alarma.
- **Blanco Carta** (#ffffff): el color de las cartas blancas físicas y del texto sobre superficies claras.
- **Texto Principal** (#ffffff), **Texto Secundario** (#888888), **Texto Terciario** (#7a7a7a): escala de legibilidad de 3 pasos, las tres validadas en ≥4.5:1 de contraste sobre Negro Medianoche — a mayor jerarquía, más blanco. (La versión original tenía 5 pasos con tonos hasta #444444; se consolidó a 3 en la pasada de `/impeccable polish` porque los dos tonos más oscuros no pasaban el contraste mínimo para texto informativo real.)

### Named Rules
**La Regla del Oro Escaso.** El dorado es el único acento de marca en todo el sistema. Si una pantalla necesita un segundo color para llamar la atención, es una señal de que la jerarquía está mal resuelta — no se agrega un segundo acento, se ajusta el tamaño o el peso.

**La Regla del Color de Estado.** Verde (#4caf50), rojo (#ff4444), ámbar (#ff8800) y naranja (#ff6b35) existen únicamente para comunicar estado del juego (confirmado, error/castigo, segundos bebidos, racha). Nunca se usan de forma decorativa ni en marca.

## 3. Typography

**Display/Body Font:** 'Helvetica Neue', Arial, sans-serif (una sola familia en todo el sistema)

**Character:** Una sola tipografía humanista sans-serif cargada casi siempre en peso 700–900. No hay pareja de fuentes que gestionar — el contraste de jerarquía viene enteramente de tamaño, peso y letter-spacing, nunca de mezclar familias.

### Hierarchy
- **Display** (900, `clamp(28px, 8vw, 42px)`, 1.1): título del splash ("CARTAS / HUMANIDAD") y el código de sala de 4 dígitos — los dos momentos que deben sentirse como titulares.
- **Headline** (900, 20px, 1.3): títulos de pantalla ("¿Quién empieza?", "Respuestas", nombre del ganador de ronda).
- **Title** (900, 16px, 1.3): nombre del jugador activo en el header de juego, nombres en botones de selección.
- **Body** (700, 14px, 1.4): texto de cartas blancas y negras, contenido principal interactivo. Las cartas nunca exceden ~40 caracteres por línea visible en el ancho de una carta móvil.
- **Label** (700, 12px, letter-spacing 2px, mayúsculas): etiquetas de contexto ("CÓDIGO DE LA SALA", "ELIGE 2", estados de conexión).

### Named Rules
**La Regla de una Sola Familia.** Nunca se introduce una segunda familia tipográfica. Toda variación de énfasis se logra con peso (700 vs 900), tamaño, o letter-spacing — nunca cambiando de fuente.

## 4. Elevation

El sistema se mueve de un plano completamente flat a sombras reales tipo
resplandor: "cartas flotando en la oscuridad". La profundidad no viene de
relieve físico duro (nada de sombras tipo Material con esquina definida),
sino de un resplandor suave y difuso que separa cada superficie del negro
absoluto detrás de ella. El dorado, cuando aparece como resplandor, refuerza
que ese elemento es el foco de atención (seleccionado, activo, ganador).

### Shadow Vocabulary
- **Resplandor Ambiental** (`box-shadow: 0 12px 32px rgba(0,0,0,0.55)`): eleva tarjetas y superficies de contenido (`S.card`, caja de código, chips agrupados) sobre el fondo negro. Uso por defecto en cualquier superficie de Carbón (#111) o más clara.
- **Resplandor Dorado** (`box-shadow: 0 0 20px rgba(255,215,0,0.35)`): reservado para el elemento seleccionado o activo — una carta blanca elegida, el botón principal en su estado de reposo. Combina con el anillo existente (`0 0 0 3px rgba(255,215,0,0.3)`) en cartas seleccionadas.
- **Resplandor de Botón** (`box-shadow: 0 6px 20px rgba(0,0,0,0.4)`): botones primarios y dorados en reposo; sube a `0 8px 28px rgba(0,0,0,0.5)` en hover/press para sensación de flotar más cerca.
- **Resplandor de Alarma** (`box-shadow: 0 0 16px rgba(255,68,68,0.25)`): cajas de error y el botón "FIN" — la única vez que el resplandor no es dorado ni neutro.

### Named Rules
**La Regla del Resplandor, no el Relieve.** Ninguna sombra tiene una esquina dura ni una dirección de luz "de escritorio" (nada de `2px 2px 4px`). Todas son difusas, centradas o casi centradas, y grandes en blur — el efecto es de luz ambiental, no de un objeto físico pesado apoyado en una mesa.

## 5. Components

### Buttons
- **Shape:** esquinas de 12px (`{rounded.lg}`) en botones principales; 10px en botones pequeños/fantasma.
- **Primary (dorado):** fondo Oro de Casino, texto negro, mayúsculas, peso 900, `Resplandor de Botón`. Es el único botón que debe combinarse con `Resplandor Dorado` cuando representa la acción principal de la pantalla (confirmar, votar, armar juego).
- **Secondary (blanco):** mismo tratamiento que el primario pero fondo blanco — usado quando el dorado ya está ocupado por otro elemento en la misma pantalla (p. ej. splash "JUGAR").
- **Ghost:** fondo Grafito, texto blanco, borde sutil — acciones secundarias (volver, cancelar, guardar para después).
- **Hover / Focus:** `transform: scale(0.97)` al presionar (ya global vía `button:active`); se añade la intensificación del `Resplandor de Botón` en hover.

### Chips
- **Style:** fondo Grafito, borde 1px Borde Grafito, `rounded: 100px` (píldora completa), `Resplandor Ambiental` suave.
- **State:** opacidad reducida (0.5) + etiqueta "desconectado" para jugadores sin actividad reciente; punto de color (verde `#4caf50` / gris `#666`) antes del nombre.

### Cards / Containers
- **Corner Style:** 20px (`S.card`, contenedor de pantallas centradas tipo "¿Quién empieza?").
- **Background:** Carbón (#111) sobre Negro Medianoche (#0a0a0a).
- **Shadow Strategy:** `Resplandor Ambiental` por defecto; la carta negra en juego usa fondo Negro Absoluto con borde en vez de sombra, porque vive dentro de una superficie ya elevada.
- **Border:** 1px Borde Carbón (#222) en tarjetas de contenido; 2px Borde Grafito (#333) en la carta negra y en inputs.
- **Internal Padding:** 36px 20px en tarjetas centradas; 12–14px en tarjetas de lista (scoreboard, "quién jugó qué").

### Inputs / Fields
- **Style:** fondo Grafito, borde 2px Borde Grafito, esquinas 10px, texto blanco, placeholder Texto Apagado (#555).
- **Focus:** el navegador no añade anillo custom todavía — pendiente añadir un `Resplandor Dorado` sutil al enfocar (ver Do's abajo).

### Cartas de Juego (Signature Component)
El componente más distintivo del sistema: una carta blanca física (#fff,
texto negro, 10px de radio) que al seleccionarse se vuelve dorada con un
número de orden superpuesto y el `Resplandor Dorado` + anillo. La carta
negra (la pregunta) vive en un contenedor negro absoluto con borde grafito
de 2px, y se vuelve gradiente negro-a-dorado sutil más borde dorado sólido
en "Ronda Dorada".

## 6. Do's and Don'ts

### Do:
- **Do** usar el Oro de Casino (#ffd700) como el único acento de marca — cualquier segundo color decorativo rompe la Regla del Oro Escaso.
- **Do** aplicar el `Resplandor Ambiental` (sombra difusa, sin esquina dura) a toda superficie de Carbón o más clara que flote sobre el fondo.
- **Do** mantener toda la interfaz en una sola familia tipográfica (Helvetica Neue), variando peso/tamaño/letter-spacing para jerarquía.
- **Do** dar siempre una salida visible en pantallas de espera (no dejar a nadie "atorado" — botón de salir, reconexión por código).
- **Do** dar movimiento y personalidad a selección de cartas, revelaciones y victorias — el juego debe sentirse vivo, no una pantalla quieta. Siempre con alternativa para `prefers-reduced-motion`.
- **Do** usar Texto Terciario (#7a7a7a) como el gris más oscuro permitido para cualquier texto que el jugador necesite leer — es el piso de contraste real (≥4.5:1), no un mínimo aspiracional.
- **Do** poner un `<label>` visible sobre cada input, nunca depender solo del placeholder para explicar qué va ahí.

### Don't:
- **Don't** usar tarjetas grises intercambiables ni la estética de dashboard SaaS/corporativo — este es un juego de fiesta para adultos, no una herramienta de productividad.
- **Don't** usar colores pastel ni estética infantil en ningún estado de la interfaz.
- **Don't** usar sombras con esquina dura o dirección de luz "de escritorio" (`2px 2px 4px`) — todas las sombras son resplandores difusos y centrados, nunca relieve físico pesado.
- **Don't** introducir un segundo acento de marca junto al dorado — los colores de estado (verde/rojo/ámbar/naranja) son solo para retroalimentación de juego, nunca decorativos.
- **Don't** mezclar una segunda familia tipográfica bajo ningún pretexto de "variedad".
