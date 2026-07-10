// Toda la lógica de la sala multijugador: crear, unirse, jugar una ronda,
// votar, repartir shots... Cada función escribe en Firestore y todos los
// celulares conectados reciben el cambio vía onSnapshot (ver escucharSala).
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp, deleteField,
} from "firebase/firestore";
import { db } from "./firebase";
import { WHITE_CARDS, BLACK_CARDS, STARTER_CHALLENGES, getPunishment, shuffle } from "./gameData";

const MANO_INICIAL = 10;

function salaRef(codigo) {
  return doc(db, "salas", codigo);
}

function generarCodigo() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function crearSala(nombre, shotsParaDesbloquear, uid) {
  let codigo;
  // Reintenta si por mala suerte el código ya existe.
  for (let intento = 0; intento < 5; intento++) {
    codigo = generarCodigo();
    const snap = await getDoc(salaRef(codigo));
    if (!snap.exists()) break;
  }
  const sala = {
    codigo,
    creadaEn: serverTimestamp(),
    fase: "espera",
    anfitrion: uid,
    config: { shotsParaDesbloquear },
    jugadores: {
      [uid]: jugadorNuevo(nombre),
    },
    orden: [],
    mazoBlanco: [],
    mazoNegro: [],
    cartaNegra: null,
    esRondaDorada: false,
    ronda: 0,
    retoInicial: "",
    respuestas: {},
    revSubs: [],
    revIdx: 0,
    votos: {},
    ultimaRonda: null,
    shotActivo: null,
  };
  await setDoc(salaRef(codigo), sala);
  return codigo;
}

export async function unirseSala(codigo, nombre, uid) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("SALA_NO_EXISTE");
    const sala = snap.data();
    const jugadores = sala.jugadores || {};
    if (jugadores[uid]) return; // ya estaba adentro (reconexión), sin importar la fase
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

// Solo se puede quitar limpiamente a alguien de la sala mientras se está en
// la sala de espera (antes de repartir cartas). Con el juego ya empezado no
// hay una forma segura de sacarlo sin romper el orden/las respuestas de la
// ronda en curso, así que ahí el jugador solo cierra su propia sesión local
// (ver onSalir en App.jsx) y puede volver a entrar con el mismo código.
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

function jugadorNuevo(nombre) {
  return {
    nombre: nombre.trim(),
    estrellas: 0,
    mano: [],
    votosTotales: 0,
    shotsRecibidos: 0,
    shotsDisponibles: 0,
    hitoShotsPrevio: 0,
    racha: 0,
    segundosBebidos: 0,
    shotsEnviados: {},
    visto: serverTimestamp(),
  };
}

// Firestore no tiene "onDisconnect" como Realtime Database, así que cada
// celular avisa "sigo aquí" cada cierto tiempo mientras está en una sala.
export async function latirPresencia(codigo, uid) {
  await updateDoc(salaRef(codigo), { [`jugadores.${uid}.visto`]: serverTimestamp() });
}

export function escucharSala(codigo, onCambio, onError) {
  return onSnapshot(
    salaRef(codigo),
    (snap) => onCambio(snap.exists() ? snap.data() : null),
    onError
  );
}

// -------------------- Empezar el juego --------------------

export async function iniciarEleccionDeInicio(codigo) {
  const reto = STARTER_CHALLENGES[Math.floor(Math.random() * STARTER_CHALLENGES.length)];
  await updateDoc(salaRef(codigo), { fase: "inicio", retoInicial: reto });
}

export async function elegirQuienEmpieza(codigo, uidElegido) {
  // Transacción: si dos jugadores tocan "¡SOY YO!" casi al mismo tiempo,
  // solo el primero en llegar arranca el juego; el segundo no hace nada.
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "inicio") return;

    const uids = Object.keys(sala.jugadores);
    const i = uids.indexOf(uidElegido);
    const orden = [...uids.slice(i), ...uids.slice(0, i)];
    const mazoBlanco = shuffle(WHITE_CARDS);
    const mazoNegro = shuffle(BLACK_CARDS);

    const jugadoresActualizados = {};
    let cursor = 0;
    orden.forEach((uid) => {
      jugadoresActualizados[uid] = {
        ...sala.jugadores[uid],
        mano: mazoBlanco.slice(cursor, cursor + MANO_INICIAL),
      };
      cursor += MANO_INICIAL;
    });

    tx.update(ref, {
      orden,
      jugadores: jugadoresActualizados,
      mazoBlanco: mazoBlanco.slice(cursor),
      mazoNegro: mazoNegro.slice(1),
      cartaNegra: mazoNegro[0],
      esRondaDorada: false,
      ronda: 1,
      respuestas: {},
      fase: "jugando",
      // Con exactamente 2 jugadores no hay votación real posible (el único
      // voto disponible sería siempre para el otro), así que el juego pasa
      // a "modo libre": solo se revela y se ríe, sin puntos ni votos.
      modoLibre: orden.length === 2,
    });
  });
}

// -------------------- Turno de juego --------------------

function reponerMazoBlanco(mazoBlanco, necesarias, cartasEnUso) {
  if (mazoBlanco.length >= necesarias) return mazoBlanco;
  const enUso = new Set(cartasEnUso);
  const disponibles = WHITE_CARDS.filter((c) => !enUso.has(c));
  return [...mazoBlanco, ...shuffle(disponibles)];
}

export async function enviarRespuesta(codigo, uid, cartas) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "jugando") return;
    if (sala.respuestas[uid]) return; // ya había enviado

    const pick = sala.cartaNegra.pick;
    const jugador = sala.jugadores[uid];
    const manoRestante = jugador.mano.filter((c) => !cartas.includes(c));

    const cartasEnUso = [
      ...Object.values(sala.jugadores).flatMap((j) => j.mano),
      ...Object.values(sala.respuestas).flat(),
      cartas,
    ].flat();
    const mazoBlanco = reponerMazoBlanco(sala.mazoBlanco, pick, cartasEnUso);
    const robadas = mazoBlanco.slice(0, pick);

    const respuestas = { ...sala.respuestas, [uid]: cartas };
    const jugadores = {
      ...sala.jugadores,
      [uid]: { ...jugador, mano: [...manoRestante, ...robadas] },
    };

    const todosListos = sala.orden.every((u) => respuestas[u]);
    const cambios = {
      respuestas,
      jugadores,
      mazoBlanco: mazoBlanco.slice(pick),
    };
    if (todosListos) {
      // Firestore no permite arrays anidados (un array de arrays), por eso
      // cada respuesta se guarda como objeto {uid, cartas} y no como tupla.
      cambios.revSubs = shuffle(Object.entries(respuestas)).map(([u, c]) => ({ uid: u, cartas: c }));
      cambios.revIdx = 0;
      cambios.fase = "revelando";
    }
    tx.update(ref, cambios);
  });
}

export async function cambiarMano(codigo, sala, uid) {
  const jugador = sala.jugadores[uid];
  let mazo = shuffle([...sala.mazoBlanco, ...jugador.mano]);
  const manoNueva = mazo.slice(0, MANO_INICIAL);
  const restante = mazo.slice(MANO_INICIAL);
  await updateDoc(salaRef(codigo), {
    mazoBlanco: restante,
    [`jugadores.${uid}.mano`]: manoNueva,
    [`jugadores.${uid}.estrellas`]: (jugador.estrellas || 0) - 1,
  });
}

// -------------------- Revelación --------------------

export async function avanzarRevelacion(codigo, revIdx) {
  await updateDoc(salaRef(codigo), { revIdx });
}

export async function iniciarVotacion(codigo) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "revelando") return;
    tx.update(ref, { fase: "votando", votos: {} });
  });
}

// Modo libre (2 jugadores): de la revelación se salta directo a una carta
// nueva, sin pasar por votación, puntaje, shots ni castigos.
export async function otraRondaLibre(codigo) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "revelando" || !sala.modoLibre) return;
    let mazoNegro = sala.mazoNegro;
    if (!mazoNegro.length) mazoNegro = shuffle(BLACK_CARDS);
    tx.update(ref, {
      mazoNegro: mazoNegro.slice(1),
      cartaNegra: mazoNegro[0],
      ronda: sala.ronda + 1,
      respuestas: {},
      fase: "jugando",
    });
  });
}

// -------------------- Votación y resultados --------------------

export async function votar(codigo, uid, uidVotado) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "votando") return;
    if (sala.votos[uid]) return;
    if (uidVotado === uid) return;

    const votos = { ...sala.votos, [uid]: uidVotado };
    const cambios = { votos };

    if (sala.orden.every((u) => votos[u])) {
      Object.assign(cambios, calcularResultadoRonda(sala, votos));
    }
    tx.update(ref, cambios);
  });
}

function calcularResultadoRonda(sala, votos) {
  const tabla = {};
  sala.orden.forEach((u) => (tabla[u] = 0));
  Object.values(votos).forEach((v) => (tabla[v] = (tabla[v] || 0) + 1));

  let max = 0, ganadores = [], min = Infinity, perdedores = [];
  Object.entries(tabla).forEach(([u, c]) => {
    if (c > max) { max = c; ganadores = [u]; } else if (c === max) ganadores.push(u);
    if (c < min) { min = c; perdedores = [u]; } else if (c === min) perdedores.push(u);
  });

  const puntos = sala.esRondaDorada ? 2 : 1;
  const jugadores = { ...sala.jugadores };
  sala.orden.forEach((u) => (jugadores[u] = { ...jugadores[u] }));

  ganadores.forEach((u) => (jugadores[u].estrellas = (jugadores[u].estrellas || 0) + puntos));
  sala.orden.forEach((u) => {
    if (ganadores.includes(u)) {
      jugadores[u].racha = (jugadores[u].racha || 0) + 1;
      if (jugadores[u].racha === 3) {
        jugadores[u].estrellas += 1;
        jugadores[u].racha = 0;
      }
    } else {
      jugadores[u].racha = 0;
    }
  });
  Object.entries(tabla).forEach(([u, c]) => {
    jugadores[u].votosTotales = (jugadores[u].votosTotales || 0) + c;
  });

  const umbral = sala.config.shotsParaDesbloquear;
  sala.orden.forEach((u) => {
    const hitoNuevo = Math.floor(jugadores[u].estrellas / umbral);
    const hitoPrevio = jugadores[u].hitoShotsPrevio || 0;
    if (hitoNuevo > hitoPrevio) {
      jugadores[u].shotsDisponibles = (jugadores[u].shotsDisponibles || 0) + (hitoNuevo - hitoPrevio);
      jugadores[u].hitoShotsPrevio = hitoNuevo;
    }
  });

  let ultimaRonda = { tabla, ganadores, castigoQuien: null, castigoTexto: null };
  if (min === 0 && perdedores.length > 0 && perdedores.length < sala.orden.length) {
    const infortunado = perdedores[Math.floor(Math.random() * perdedores.length)];
    const p = getPunishment(sala.ronda);
    jugadores[infortunado].segundosBebidos = (jugadores[infortunado].segundosBebidos || 0) + p.secs;
    ultimaRonda.castigoQuien = infortunado;
    ultimaRonda.castigoTexto = p.text;
  }

  return { jugadores, ultimaRonda, fase: "resultados" };
}

// -------------------- Shots --------------------

export async function enviarShot(codigo, sala, de, para) {
  const jDe = sala.jugadores[de];
  const jPara = sala.jugadores[para];
  await updateDoc(salaRef(codigo), {
    [`jugadores.${de}.shotsDisponibles`]: Math.max(0, (jDe.shotsDisponibles || 0) - 1),
    [`jugadores.${de}.shotsEnviados.${para}`]: (jDe.shotsEnviados?.[para] || 0) + 1,
    [`jugadores.${para}.shotsRecibidos`]: (jPara.shotsRecibidos || 0) + 1,
    [`jugadores.${para}.segundosBebidos`]: (jPara.segundosBebidos || 0) + 5,
    shotActivo: { de, para },
  });
}

export async function cerrarShotActivo(codigo) {
  await updateDoc(salaRef(codigo), { shotActivo: null });
}

// -------------------- Siguiente ronda / fin --------------------

export async function siguienteRonda(codigo) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    if (sala.fase !== "resultados") return;
    let mazoNegro = sala.mazoNegro;
    if (!mazoNegro.length) mazoNegro = shuffle(BLACK_CARDS);
    const ronda = sala.ronda + 1;
    tx.update(ref, {
      mazoNegro: mazoNegro.slice(1),
      cartaNegra: mazoNegro[0],
      ronda,
      esRondaDorada: ronda % 5 === 0,
      respuestas: {},
      fase: "jugando",
    });
  });
}

export async function terminarJuego(codigo) {
  await updateDoc(salaRef(codigo), { fase: "fin" });
}
