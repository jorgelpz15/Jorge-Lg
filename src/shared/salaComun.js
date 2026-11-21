import { getDoc, runTransaction, serverTimestamp, deleteField } from "firebase/firestore";
import { db } from "../firebase.js";
import { estaConectado, MARGEN_REVANCHA_MS } from "./presencia.js";

// generarCodigoUnico/latirPresenciaComun/quitarJugadorTx: extraídos del
// pathfinder (PATHFINDER-2026-09-09/03-unified-proposal.md, sección 2).
// Cada juego pasa su propio `salaRef(codigo) => DocumentReference` para
// mantener su propia colección de Firestore.
export async function generarCodigoUnico(salaRef) {
  let codigo;
  for (let intento = 0; intento < 5; intento++) {
    codigo = String(Math.floor(1000 + Math.random() * 9000));
    const snap = await getDoc(salaRef(codigo));
    if (!snap.exists()) break;
  }
  return codigo;
}

export async function latirPresenciaComun(ref, uid) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const sala = snap.data();
    if (!sala.jugadores?.[uid]) return;
    tx.update(ref, { [`jugadores.${uid}.visto`]: serverTimestamp() });
  });
}

export function quitarJugadorTx(tx, ref, sala, uid, { requiereFase } = {}) {
  if (requiereFase && sala.fase !== requiereFase) return;
  const cambios = { [`jugadores.${uid}`]: deleteField() };
  if (sala.anfitrion === uid) {
    const restante = Object.keys(sala.jugadores).find((u) => u !== uid);
    if (restante) cambios.anfitrion = restante;
  }
  tx.update(ref, cambios);
}

// Salir de verdad de la sala desde la espera o la pantalla final (p. ej.
// "Salir a inicio"), para no dejar un jugador fantasma en la revancha. A media
// partida NO: ahí el uid sigue en `orden` y la ronda esperaría a quien se fue,
// así que se ignora (el jugador solo cierra su sesión local y puede volver).
export async function salirDeSalaComun(ref, uid) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const sala = snap.data();
    if (sala.fase !== "espera" && sala.fase !== "fin") return;
    if (!sala.jugadores?.[uid]) return;
    quitarJugadorTx(tx, ref, sala, uid);
  });
}

// Revancha en la misma sala: solo siguen quienes tienen latido reciente (más
// quien la pidió), y el anfitrión pasa a quien la pidió si el suyo ya no está.
export function jugadoresParaRevancha(sala, uid, ahora = Date.now()) {
  const jugadores = {};
  for (const [u, j] of Object.entries(sala.jugadores)) {
    if (u === uid || (j.nombre && estaConectado(j.visto, ahora, MARGEN_REVANCHA_MS))) jugadores[u] = j;
  }
  const anfitrion = jugadores[sala.anfitrion] ? sala.anfitrion : uid;
  return { jugadores, anfitrion };
}
