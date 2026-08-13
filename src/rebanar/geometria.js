// Matemática pura para "A Rebanar": área de un polígono y cuánto queda de
// cada lado al partirlo con una línea recta. Sin dependencias, para poder
// probarla sola con casos conocidos antes de conectarla a la UI.

// Área de un polígono (fórmula de Gauss/shoelace). Puntos: [[x,y], ...]
export function area(poligono) {
  let suma = 0;
  const n = poligono.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = poligono[i];
    const [x2, y2] = poligono[(i + 1) % n];
    suma += x1 * y2 - x2 * y1;
  }
  return Math.abs(suma) / 2;
}

// De qué lado de la línea a→b cae el punto p (producto cruz). Positivo,
// negativo o cero (sobre la línea).
function lado(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

// Recorta un polígono contra el semiplano de la línea a→b (algoritmo de
// Sutherland-Hodgman). `quedarseSiPositivo` decide qué mitad se conserva.
function recortarPorLado(poligono, a, b, quedarseSiPositivo) {
  const salida = [];
  const n = poligono.length;
  if (n === 0) return salida;
  for (let i = 0; i < n; i++) {
    const actual = poligono[i];
    const siguiente = poligono[(i + 1) % n];
    const signoActual = lado(actual, a, b);
    const signoSiguiente = lado(siguiente, a, b);
    const actualDentro = quedarseSiPositivo ? signoActual >= 0 : signoActual <= 0;
    const siguienteDentro = quedarseSiPositivo ? signoSiguiente >= 0 : signoSiguiente <= 0;
    if (actualDentro) salida.push(actual);
    if (actualDentro !== siguienteDentro) {
      const t = signoActual / (signoActual - signoSiguiente);
      salida.push([
        actual[0] + t * (siguiente[0] - actual[0]),
        actual[1] + t * (siguiente[1] - actual[1]),
      ]);
    }
  }
  return salida;
}

// Fracción (0 a 1) del área que queda del lado "positivo" de la línea a→b.
export function fraccionLadoPositivo(poligono, a, b) {
  const total = area(poligono);
  if (total === 0) return 0;
  return area(recortarPorLado(poligono, a, b, true)) / total;
}

// Qué tan parejo/disparejo quedó el corte, sin importar de qué lado quedó
// la parte más grande: 0.5 = mitad y mitad, 0.7 = un lado con 70%.
export function fraccionLadoMayor(poligono, a, b) {
  const p = fraccionLadoPositivo(poligono, a, b);
  return Math.max(p, 1 - p);
}

// Extiende el segmento a→b (el gesto del jugador, que puede ser corto y
// quedar dentro de la figura) a una línea que cruce todo el lienzo, para
// que el corte siempre parta la figura de lado a lado como un cuchillo real.
export function extenderLinea(a, b, tamanoLienzo) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return [a, [a[0], a[1] + 1]];
  const largo = Math.max(tamanoLienzo * 4, 1000);
  const mag = Math.hypot(dx, dy);
  const ux = dx / mag, uy = dy / mag;
  return [
    [a[0] - ux * largo, a[1] - uy * largo],
    [b[0] + ux * largo, b[1] + uy * largo],
  ];
}
