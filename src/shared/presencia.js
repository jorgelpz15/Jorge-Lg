// Presencia compartida por los 6 juegos. Cada celular manda un latido cada
// LATIDO_MS (y se pausa con la pantalla apagada o la pestaña oculta, ver
// useLatido); si pasa más de MARGEN_DESCONEXION_MS sin latido, se muestra
// como desconectado. 60 s / 150 s bajan ~3x las lecturas de Firestore frente
// a los 20 s / 45 s anteriores (cada latido se reenvía a todos los listeners).
export const LATIDO_MS = 60000;
export const MARGEN_DESCONEXION_MS = 150000;
// Para armar una revancha solo se conservan jugadores con latido reciente.
export const MARGEN_REVANCHA_MS = 100000;

export function estaConectado(visto, ahora, margen = MARGEN_DESCONEXION_MS) {
  if (!visto) return true;
  const ms = typeof visto.toMillis === "function" ? visto.toMillis() : 0;
  return ahora - ms < margen;
}
