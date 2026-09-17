import { getDoc, updateDoc, serverTimestamp, deleteField } from "firebase/firestore";

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
  await updateDoc(ref, { [`jugadores.${uid}.visto`]: serverTimestamp() });
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
