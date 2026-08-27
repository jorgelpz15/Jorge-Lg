// Lógica de sala para "Ponte Pedo". Igual que Dados, es una herramienta
// compartida (no competitiva): cualquiera en la sala saca una carta y todos
// ven la misma al instante. El mazo es un mazo real de 52 cartas + 2 jokers,
// sin repetir hasta que se agota (igual que barajar un mazo físico) —
// cuando se acaba, se vuelve a barajar el descarte.
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp, deleteField,
} from "firebase/firestore";
import { db } from "../firebase.js";

const PALOS = ["♠️", "♥️", "♦️", "♣️"];
const VALORES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Reglas según lo que juega el dueño con sus amigos — pueden variar mucho de
// un grupo a otro, estas son las suyas.
export const REGLAS = {
  A: { emoji: "📜", nombre: "Regla", texto: "Inventa una regla nueva que todos deben seguir el resto del juego. Quien la rompa, toma." },
  2: { emoji: "📖", nombre: "Historia", texto: "Entre todos arman un cuento, una palabra a la vez por turnos. Quien se traba, toma." },
  3: { emoji: "🗯️", nombre: "Caricachupas", texto: "Elijan un tema y vayan diciendo ejemplos por turnos. Quien se tarde o no sepa, toma." },
  4: { emoji: "🤨", nombre: "Discrepo", texto: "Di una palabra; el siguiente dice una relacionada, y así sucesivamente. Si alguien no cree que se relaciona, grita \"¡Discrepo!\" y se argumenta por qué sí o por qué no." },
  5: { emoji: "🌊", nombre: "Cascada", texto: "Todos empiezan a tomar en cadena. Nadie para hasta que para la persona anterior a él." },
  6: { emoji: "🙅", nombre: "Nunca nunca", texto: "Digan \"nunca nunca he...\" — quien sí lo haya hecho, toma." },
  7: { emoji: "👏", nombre: "Siete", texto: "Cuenten en voz alta. Al llegar a 7, sus múltiplos, o cualquier número que contenga un 7, aplaudan en vez de decirlo." },
  8: { emoji: "🌍", nombre: "Capitales", texto: "Como Caricachupas, pero nombrando capitales de países." },
  9: { emoji: "🌟", nombre: "Famosos", texto: "Nombren famosos: el siguiente dice uno que empiece con la última letra del apellido anterior (o del nombre completo si es de una sola palabra)." },
  10: { emoji: "🚗", nombre: "Ni de pedo", texto: "Di \"yo conozco 10 [algo]\" y el siguiente sube el número. Si alguien no te cree, dice \"¡Ni de pedo!\" y tienes que nombrar esa cantidad." },
  J: { emoji: "☝️", nombre: "Poner el dedo", texto: "En cualquier momento, pon tu dedo índice en la mesa. El último en imitarte, toma." },
  Q: { emoji: "🫡", nombre: "Manda", texto: "Ordena a alguien que tome algo o que le sirvan otra bebida." },
  K: { emoji: "❓", nombre: "Preguntas", texto: "Encadenen preguntas sin responder ninguna con algo que no sea otra pregunta. Quien conteste, toma." },
  JOKER: { emoji: "🃏", nombre: "Todos toman", texto: "Sin condición, todos toman." },
};

// Exportado por la misma razón que mazoNuevo (ver abajo).
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Exportado para el modo "Jugar solo" (PantallaPontePedoSolo), que arma y
// maneja su propio mazo en memoria local, sin sala de Firestore.
export function mazoNuevo() {
  const cartas = [];
  for (const valor of VALORES) {
    for (const palo of PALOS) cartas.push({ valor, palo });
  }
  cartas.push({ valor: "JOKER", palo: "🃏" }, { valor: "JOKER", palo: "🃏" });
  return shuffle(cartas);
}

function salaRef(codigo) {
  return doc(db, "salasPontePedo", codigo);
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
    mazo: mazoNuevo(), descarte: [], cartaActual: null, reglaActiva: "",
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

// Como en Dados, no hay "partida en curso" que se pueda romper, así que
// salir de la sala siempre es seguro.
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

export async function sacarCarta(codigo, uid) {
  const ref = salaRef(codigo);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sala = snap.data();
    let mazo = [...sala.mazo];
    let descarte = sala.cartaActual ? [...sala.descarte, sala.cartaActual] : [...sala.descarte];
    if (mazo.length === 0) {
      mazo = shuffle(descarte);
      descarte = [];
    }
    const carta = mazo.pop();
    tx.update(ref, {
      mazo, descarte,
      cartaActual: { valor: carta.valor, palo: carta.palo, sacadaPor: uid, en: serverTimestamp() },
    });
  });
}

export async function establecerRegla(codigo, texto) {
  await updateDoc(salaRef(codigo), { reglaActiva: texto.trim() });
}

// Por si quieren empezar de cero sin salir de la sala (ej. terminó la
// botella y arrancan otra ronda del juego).
export async function reiniciarMazo(codigo) {
  await updateDoc(salaRef(codigo), { mazo: mazoNuevo(), descarte: [], cartaActual: null, reglaActiva: "" });
}
