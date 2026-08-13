// Catálogo de figuras para "A Rebanar". Cada figura es un polígono cerrado
// en un lienzo de 300x300, armado con un radio distinto por ángulo para que
// se vea irregular (como un filete de verdad) y no un círculo perfecto —
// eso es justo lo que hace que "a ojo" sea difícil acertar el corte.
const LADO = 300;
const CENTRO = [150, 150];

function crearBlob(radios) {
  const n = radios.length;
  const puntos = [];
  for (let i = 0; i < n; i++) {
    const angulo = (i / n) * Math.PI * 2;
    const r = radios[i];
    puntos.push([
      CENTRO[0] + Math.cos(angulo) * r,
      CENTRO[1] + Math.sin(angulo) * r,
    ]);
  }
  return puntos;
}

export const FIGURAS = [
  {
    id: "filete",
    emoji: "🥩",
    nombre: "el filete",
    puntos: crearBlob([90, 100, 70, 60, 85, 110, 95, 75, 65, 90, 105, 80]),
  },
  {
    id: "pizza",
    emoji: "🍕",
    nombre: "la pizza",
    puntos: crearBlob([100, 95, 100, 98, 102, 96, 100, 99, 101, 97, 100, 98]),
  },
  {
    id: "pastel",
    emoji: "🎂",
    nombre: "el pastel",
    puntos: crearBlob([70, 105, 75, 100, 72, 108, 68, 102, 74, 106, 70, 100]),
  },
  {
    id: "aguacate",
    emoji: "🥑",
    nombre: "el aguacate",
    puntos: crearBlob([60, 75, 95, 110, 100, 85, 65, 55, 70, 90, 105, 95]),
  },
  {
    id: "nube",
    emoji: "☁️",
    nombre: "la nube",
    puntos: crearBlob([80, 110, 65, 100, 115, 70, 90, 105, 60, 95, 110, 75]),
  },
  {
    id: "galleta",
    emoji: "🍪",
    nombre: "la galleta",
    puntos: crearBlob([95, 88, 98, 85, 100, 90, 93, 97, 86, 99, 89, 96]),
  },
];

// Qué tan disparejo debe quedar el corte, siempre expresado como el % del
// lado MÁS GRANDE (0.5 = mitad y mitad, 0.7 = un lado con 70%).
export const OBJETIVOS = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75];

export function figuraAleatoria() {
  return FIGURAS[Math.floor(Math.random() * FIGURAS.length)];
}

export function objetivoAleatorio() {
  return OBJETIVOS[Math.floor(Math.random() * OBJETIVOS.length)];
}

export const LIENZO = LADO;

// Firestore no permite arrays anidados (un array de arrays), así que los
// puntos [x,y] se guardan como objetos {x,y} y se convierten de vuelta al
// leerlos. El resto del código (geometría, SVG) siempre trabaja con [x,y].
export function puntosAFirestore(puntos) {
  return puntos.map(([x, y]) => ({ x, y }));
}

export function puntosDesdeFirestore(puntos) {
  return puntos.map((p) => [p.x, p.y]);
}
