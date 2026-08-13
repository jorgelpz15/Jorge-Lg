// Lógica de sala para "Dados". A diferencia de los otros juegos, esto no es
// competitivo — es una herramienta compartida: cualquiera en la sala tira
// los dados y todos ven el mismo resultado al instante en su pantalla. No
// hay rondas, ganador, ni fase "fin" — por eso tampoco tiene "jugar otra
// vez" (no hace falta, la sala sigue viva para seguir tirando).
import {
  doc, updateDoc, onSnapshot, runTransaction, serverTimestamp, deleteField, getDoc, setDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";

const MIN_DADOS = 1;
const MAX_DADOS = 10;
const NUM_DADOS_POR_DEFECTO = 2;

function salaRef(codigo) {
  return doc(db, "salasDados", codigo);
}

function generarCodigo() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function jugadorNuevo(nombre) {
  return { nombre: nombre.trim(), visto: serverTimestamp() };
}

export async function crearSala(nombre, uid) {
  let codigo;
  for (let intento = 0; intento < 5; intento++) {
    codigo = generarCodigo();
    const snap = await getDoc(salaRef(codigo));
    if (!snap.exists()) break;
  }
  await setDoc(salaRef(codigo), {
    codigo, creadaEn: serverTimestamp(), anfitrion: uid,
    jugadores: { [uid]: jugadorNuevo(nombre) },
    numDados: NUM_DADOS_POR_DEFECTO, ultimoTiro: null,
  });
  return codigo;
}

export async function unirseSala(codigo, nombre, uid) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("SALA_NO_EXISTE");
    const sala = snap.data();
    const jugadores = sala.jugadores || {};
    if (jugadores[uid]) return;
    if (Object.keys(jugadores).length >= 12) throw new Error("SALA_LLENA");
    const nombreExiste = Object.values(jugadores).some((j) => j.nombre.toLowerCase() === nombre.trim().toLowerCase());
    if (nombreExiste) throw new Error("NOMBRE_REPETIDO");
    tx.update(ref, { [`jugadores.${uid}`]: jugadorNuevo(nombre) });
  });
  return codigo;
}

// No hay "partida en curso" que se pueda romper aquí, así que a diferencia
// de los otros juegos, salir de la sala siempre es seguro.
export async function salirDeSala(codigo, uid) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const sala = snap.data();
    const cambios = { [`jugadores.${uid}`]: deleteField() };
    if (sala.anfitrion === uid) {
      const restante = Object.keys(sala.jugadores).find((u) => u !== uid);
      if (restante) cambios.anfitrion = restante;
    }
    tx.update(ref, cambios);
  });
}

export async function latirPresencia(codigo, uid) {
  await updateDoc(salaRef(codigo), { [`jugadores.${uid}.visto`]: serverTimestamp() });
}

export function escucharSala(codigo, onCambio, onError) {
  return onSnapshot(salaRef(codigo), (snap) => onCambio(snap.exists() ? snap.data() : null), onError);
}

// Transacción (no un simple updateDoc con el valor calculado en el celular)
// para que varios toques rápidos de +/- no se pisen entre sí: cada uno lee
// el número más reciente directo del servidor antes de sumar/restar.
export async function ajustarNumDados(codigo, delta) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    const n = Math.min(MAX_DADOS, Math.max(MIN_DADOS, sala.numDados + delta));
    tx.update(ref, { numDados: n });
  });
}

export async function tirarDados(codigo, uid, numDados) {
  const n = Math.min(MAX_DADOS, Math.max(MIN_DADOS, Math.round(numDados)));
  const valores = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
  const suma = valores.reduce((a, b) => a + b, 0);
  await updateDoc(salaRef(codigo), {
    numDados: n,
    ultimoTiro: { valores, suma, tiradoPor: uid, en: serverTimestamp() },
  });
}

export { MIN_DADOS, MAX_DADOS };
