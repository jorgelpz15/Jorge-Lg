// Presencia compartida: si el jugador no ha mandado un heartbeat en los
// últimos 45s, se considera desconectado. Usado por Rocola; los otros 5
// juegos del hub tienen su propia copia idéntica (ver
// PATHFINDER-2026-09-09/02-duplication-report.md, item 1) — no se tocan en
// este plan.
export const MARGEN_DESCONEXION_MS = 45000;

export function estaConectado(visto, ahora) {
  if (!visto) return true;
  const ms = typeof visto.toMillis === "function" ? visto.toMillis() : 0;
  return ahora - ms < MARGEN_DESCONEXION_MS;
}
