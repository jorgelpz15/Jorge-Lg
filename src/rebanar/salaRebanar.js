// Lógica de sala para "A Rebanar". Usa el mismo proyecto de Firebase que
// CAH pero una colección separada (salasRebanar) para no mezclar los
// modelos de datos de los dos juegos.
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp, deleteField,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { figuraAleatoria, objetivoAleatorio, puntosAFirestore, puntosDesdeFirestore } from "./figuras.js";
import { fraccionLadoMayor, extenderLinea } from "./geometria.js";

const OPCIONES_RONDAS = [3, 5, 10];
const TOTAL_RONDAS_POR_DEFECTO = 3;

function salaRef(codigo) {
  return doc(db, "salasRebanar", codigo);
}

function generarCodigo() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function jugadorNuevo(nombre) {
  return { nombre: nombre.trim(), rondasGanadas: 0, errorTotal: 0, visto: serverTimestamp() };
}

function nuevaFigura() {
  const f = figuraAleatoria();
  return { id: f.id, emoji: f.emoji, nombre: f.nombre, puntos: puntosAFirestore(f.puntos), objetivo: objetivoAleatorio() };
}

export async function crearSala(nombre, dificultad, totalRondas, uid) {
  let codigo;
  for (let intento = 0; intento < 5; intento++) {
    codigo = generarCodigo();
    const snap = await getDoc(salaRef(codigo));
    if (!snap.exists()) break;
  }
  await setDoc(salaRef(codigo), {
    codigo, creadaEn: serverTimestamp(), fase: "espera", anfitrion: uid,
    dificultad: dificultad === "linea" ? "linea" : "deslizar",
    totalRondas: OPCIONES_RONDAS.includes(totalRondas) ? totalRondas : TOTAL_RONDAS_POR_DEFECTO,
    jugadores: { [uid]: jugadorNuevo(nombre) },
    orden: [], ronda: 0, figuraActual: null, cortes: {}, ultimaRonda: null, salaNueva: null,
  });
  return codigo;
}

// Desde la pantalla de fin, cualquiera puede armar una revancha con un solo
// toque: crea una sala nueva (misma dificultad y mismo número de rondas) y
// avisa en la sala vieja para que a los demás (que siguen viendo la
// pantalla de resultados) les aparezca el botón para unirse, sin tener que
// compartir el código a mano otra vez.
export async function jugarOtraVez(codigoViejo, uid, nombre, dificultad, totalRondas) {
  const nuevoCodigo = await crearSala(nombre, dificultad, totalRondas, uid);
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
      orden, ronda: 1, figuraActual: nuevaFigura(), cortes: {}, fase: "jugando", ultimaRonda: null,
    });
  });
}

// `a` y `b` son los dos puntos (en el lienzo de 300x300) que definen el
// gesto del jugador; se extienden a una línea completa antes de medir.
export async function enviarCorte(codigo, uid, a, b) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "jugando") return;
    if (sala.cortes[uid]) return;

    const [ea, eb] = extenderLinea(a, b, 300);
    const puntosFigura = puntosDesdeFirestore(sala.figuraActual.puntos);
    const logrado = fraccionLadoMayor(puntosFigura, ea, eb);
    const error = Math.abs(logrado - sala.figuraActual.objetivo);
    const cortes = { ...sala.cortes, [uid]: { a, b, logrado, error } };
    const cambios = { cortes };

    if (sala.orden.every((u) => cortes[u])) {
      const errorMin = Math.min(...sala.orden.map((u) => cortes[u].error));
      const ganadores = sala.orden.filter((u) => Math.abs(cortes[u].error - errorMin) < 1e-9);
      const jugadores = { ...sala.jugadores };
      sala.orden.forEach((u) => (jugadores[u] = { ...jugadores[u], errorTotal: (jugadores[u].errorTotal || 0) + cortes[u].error }));
      ganadores.forEach((u) => (jugadores[u].rondasGanadas = (jugadores[u].rondasGanadas || 0) + 1));
      cambios.jugadores = jugadores;
      cambios.ultimaRonda = { ganadores, tabla: Object.fromEntries(sala.orden.map((u) => [u, cortes[u]])) };
      cambios.fase = "revelando";
    }
    tx.update(ref, cambios);
  });
}

// De la revelación se pasa a la siguiente ronda, o al final si ya se
// jugaron todas las rondas configuradas para esta sala.
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
      ronda: sala.ronda + 1, figuraActual: nuevaFigura(), cortes: {}, fase: "jugando",
    });
  });
}

export { OPCIONES_RONDAS };
