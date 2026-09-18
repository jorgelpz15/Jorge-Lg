import {
  doc, setDoc, onSnapshot, runTransaction, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { generarCodigoUnico, latirPresenciaComun, quitarJugadorTx } from "../shared/salaComun.js";
import { CANCIONES } from "./canciones.js";

export const OPCIONES_RONDAS = [3, 5, 10];
export const ERAS = ["80s", "90s", "2000s", "hoy"];

function salaRef(codigo) {
  return doc(db, "salasRocola", codigo);
}

function jugadorNuevo(nombre) {
  return {
    nombre: nombre.trim(), visto: serverTimestamp(),
    rondasGanadas: 0, errorTotal: 0,
  };
}

export async function crearSala(nombre, totalRondas, uid) {
  const codigo = await generarCodigoUnico(salaRef);
  await setDoc(salaRef(codigo), {
    codigo, creadaEn: serverTimestamp(), anfitrion: uid,
    jugadores: { [uid]: jugadorNuevo(nombre) },
    orden: [], ronda: 0, totalRondas, fase: "espera",
    cancionActual: null, respuestas: {}, ultimaRonda: null,
    cancionesUsadas: [], salaNueva: null,
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
    if (sala.fase !== "espera") throw new Error("SALA_YA_EMPEZO");
    if (Object.keys(jugadores).length >= 8) throw new Error("SALA_LLENA");
    const nombreExiste = Object.values(jugadores).some(
      (j) => j.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );
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
    quitarJugadorTx(tx, ref, snap.data(), uid, { requiereFase: "espera" });
  });
}

export async function latirPresencia(codigo, uid) {
  await latirPresenciaComun(salaRef(codigo), uid);
}

export function escucharSala(codigo, onCambio, onError) {
  return onSnapshot(
    salaRef(codigo),
    (snap) => onCambio(snap.exists() ? snap.data() : null),
    onError
  );
}

export async function iniciarJuego(codigo) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "espera") return;
    if (Object.keys(sala.jugadores).length < 2) return;
    tx.update(ref, {
      orden: Object.keys(sala.jugadores),
      ronda: 1, fase: "jugando", cancionActual: null, respuestas: {},
    });
  });
}

// DJ derivado del orden de turno — no se guarda aparte para que nunca se
// pueda desincronizar de `ronda`/`orden`.
export function djDeRonda(orden, ronda) {
  return orden[(ronda - 1) % orden.length];
}

// Elige una canción al azar del banco para esa era, evitando repetir una ya
// usada en esta partida si hay opciones sin usar.
export function sugerirCancion(era, cancionesUsadas) {
  const banco = CANCIONES[era] || [];
  const usadas = new Set(cancionesUsadas);
  const disponibles = banco.filter((c) => !usadas.has(`${era}:${c.titulo}`));
  const pool = disponibles.length > 0 ? disponibles : banco;
  if (pool.length === 0) return null;
  const elegida = pool[Math.floor(Math.random() * pool.length)];
  return { ...elegida, era };
}

export async function confirmarCancion(codigo, cancion) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "jugando" || sala.cancionActual) return;
    tx.update(ref, {
      cancionActual: { titulo: cancion.titulo, artista: cancion.artista, anioReal: cancion.anio, era: cancion.era },
      cancionesUsadas: [...(sala.cancionesUsadas || []), `${cancion.era}:${cancion.titulo}`],
    });
  });
}

export async function enviarRespuesta(codigo, uid, anioAdivinado) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "jugando" || !sala.cancionActual) return;
    const djActual = djDeRonda(sala.orden, sala.ronda);
    if (uid === djActual || sala.respuestas[uid]) return;

    const respuestas = { ...sala.respuestas, [uid]: anioAdivinado };
    const cambios = { respuestas };

    const faltantes = sala.orden.filter((u) => u !== djActual && !respuestas[u]);
    if (faltantes.length === 0) {
      const anioReal = sala.cancionActual.anioReal;
      const tabla = {};
      sala.orden.forEach((u) => {
        if (u === djActual) return;
        const adivinado = respuestas[u];
        tabla[u] = { adivinado, error: Math.abs(adivinado - anioReal) };
      });
      let errorMin = Infinity;
      Object.values(tabla).forEach((t) => { if (t.error < errorMin) errorMin = t.error; });
      const ganadores = Object.keys(tabla).filter((u) => tabla[u].error === errorMin);

      const jugadores = { ...sala.jugadores };
      sala.orden.forEach((u) => { jugadores[u] = { ...jugadores[u] }; });
      ganadores.forEach((u) => { jugadores[u].rondasGanadas = (jugadores[u].rondasGanadas || 0) + 1; });
      Object.keys(tabla).forEach((u) => { jugadores[u].errorTotal = (jugadores[u].errorTotal || 0) + tabla[u].error; });

      cambios.jugadores = jugadores;
      cambios.ultimaRonda = { ganadores, tabla };
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
    if (sala.ronda >= sala.totalRondas) {
      tx.update(ref, { fase: "fin" });
      return;
    }
    tx.update(ref, {
      ronda: sala.ronda + 1, cancionActual: null, respuestas: {}, fase: "jugando",
    });
  });
}

export async function jugarOtraVez(codigoViejo, uid, nombre, totalRondas) {
  const nuevoCodigo = await crearSala(nombre, totalRondas, uid);
  await updateDoc(salaRef(codigoViejo), { salaNueva: nuevoCodigo });
  return nuevoCodigo;
}
