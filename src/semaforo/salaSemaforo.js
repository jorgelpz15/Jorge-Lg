// Lógica de sala para "Semáforo". Mismo patrón que salaRebanar.js, en su
// propia colección (salasSemaforo) para no mezclar modelos de datos.
//
// Cómo funciona una ronda: se encienden 5 luces rojas, una por segundo (como
// la salida real de F1); después de una espera aleatoria (0.2 a 3 segundos)
// se apagan todas de golpe — ahí hay que tocar la pantalla lo más rápido
// posible. Tocar ANTES de que se apaguen es "salida en falso" y se pierde la
// ronda automáticamente.
//
// La sincronización usa la hora del servidor (`horaInicio`, un
// serverTimestamp) más una demora aleatoria fija para esa ronda
// (`demoraMs`), calculados una sola vez y guardados en la sala — así todos
// los celulares programan la misma secuencia de luces a partir del mismo
// instante. Puede haber pequeñas diferencias de milisegundos entre
// celulares por la latencia normal de red (no es un cronómetro de
// laboratorio, es un juego para jugar con amigos).
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp, deleteField,
} from "firebase/firestore";
import { db } from "../firebase.js";

const OPCIONES_RONDAS = [3, 5, 10];
const TOTAL_RONDAS_POR_DEFECTO = 3;
const NUM_LUCES = 5;
const MS_ENTRE_LUCES = 1000;
const DEMORA_MIN_MS = 200;
const DEMORA_MAX_MS = 3000;
const PENALIZACION_FALSO_MS = 5000; // "peor tiempo posible" para una salida en falso

function salaRef(codigo) {
  return doc(db, "salasSemaforo", codigo);
}

function generarCodigo() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function jugadorNuevo(nombre) {
  return { nombre: nombre.trim(), rondasGanadas: 0, tiempoTotalMs: 0, visto: serverTimestamp() };
}

function demoraAleatoria() {
  return DEMORA_MIN_MS + Math.floor(Math.random() * (DEMORA_MAX_MS - DEMORA_MIN_MS));
}

export async function crearSala(nombre, totalRondas, uid) {
  let codigo;
  for (let intento = 0; intento < 5; intento++) {
    codigo = generarCodigo();
    const snap = await getDoc(salaRef(codigo));
    if (!snap.exists()) break;
  }
  await setDoc(salaRef(codigo), {
    codigo, creadaEn: serverTimestamp(), fase: "espera", anfitrion: uid,
    totalRondas: OPCIONES_RONDAS.includes(totalRondas) ? totalRondas : TOTAL_RONDAS_POR_DEFECTO,
    jugadores: { [uid]: jugadorNuevo(nombre) },
    orden: [], ronda: 0, horaInicio: null, demoraMs: 0, reacciones: {}, ultimaRonda: null, salaNueva: null,
  });
  return codigo;
}

// Misma revancha con un toque que en A Rebanar / CAH.
export async function jugarOtraVez(codigoViejo, uid, nombre, totalRondas) {
  const nuevoCodigo = await crearSala(nombre, totalRondas, uid);
  await updateDoc(salaRef(codigoViejo), { salaNueva: nuevoCodigo });
  return nuevoCodigo;
}

export async function unirseSala(codigo, nombre, uid) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("SALA_NO_EXISTE");
    const sala = snap.data();
    const jugadores = sala.jugadores || {};
    if (jugadores[uid]) return;
    if (sala.fase !== "espera") throw new Error("SALA_YA_EMPEZO");
    if (Object.keys(jugadores).length >= 8) throw new Error("SALA_LLENA");
    const nombreExiste = Object.values(jugadores).some((j) => j.nombre.toLowerCase() === nombre.trim().toLowerCase());
    if (nombreExiste) throw new Error("NOMBRE_REPETIDO");
    tx.update(ref, { [`jugadores.${uid}`]: jugadorNuevo(nombre) });
  });
  return codigo;
}

export async function salirDeSalaEnEspera(codigo, uid) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const sala = snap.data();
    if (sala.fase !== "espera") return;
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

export async function iniciarJuego(codigo) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "espera") return;
    const orden = Object.keys(sala.jugadores);
    tx.update(ref, {
      orden, ronda: 1, horaInicio: serverTimestamp(), demoraMs: demoraAleatoria(),
      reacciones: {}, fase: "jugando", ultimaRonda: null,
    });
  });
}

// `reaccionMs` es el tiempo entre que se apagaron las luces y el toque,
// medido en el propio celular (mismo reloj para las dos marcas de tiempo,
// así no importan diferencias de reloj entre celulares). `falso: true`
// si tocó antes de que se apagaran las luces.
export async function enviarReaccion(codigo, uid, { falso, reaccionMs }) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "jugando") return;
    if (sala.reacciones[uid]) return;

    const reacciones = {
      ...sala.reacciones,
      [uid]: falso ? { falso: true, reaccionMs: PENALIZACION_FALSO_MS } : { falso: false, reaccionMs },
    };
    const cambios = { reacciones };

    if (sala.orden.every((u) => reacciones[u])) {
      const validos = sala.orden.filter((u) => !reacciones[u].falso);
      const tiempoMin = validos.length ? Math.min(...validos.map((u) => reacciones[u].reaccionMs)) : null;
      const ganadores = validos.filter((u) => reacciones[u].reaccionMs === tiempoMin);
      const jugadores = { ...sala.jugadores };
      sala.orden.forEach((u) => (jugadores[u] = { ...jugadores[u], tiempoTotalMs: (jugadores[u].tiempoTotalMs || 0) + reacciones[u].reaccionMs }));
      ganadores.forEach((u) => (jugadores[u].rondasGanadas = (jugadores[u].rondasGanadas || 0) + 1));
      cambios.jugadores = jugadores;
      cambios.ultimaRonda = { ganadores, tabla: Object.fromEntries(sala.orden.map((u) => [u, reacciones[u]])) };
      cambios.fase = "revelando";
    }
    tx.update(ref, cambios);
  });
}

export async function avanzar(codigo) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "revelando") return;
    if (sala.ronda >= (sala.totalRondas || TOTAL_RONDAS_POR_DEFECTO)) {
      tx.update(ref, { fase: "fin" });
      return;
    }
    tx.update(ref, {
      ronda: sala.ronda + 1, horaInicio: serverTimestamp(), demoraMs: demoraAleatoria(),
      reacciones: {}, fase: "jugando",
    });
  });
}

export { OPCIONES_RONDAS, NUM_LUCES, MS_ENTRE_LUCES, PENALIZACION_FALSO_MS };
