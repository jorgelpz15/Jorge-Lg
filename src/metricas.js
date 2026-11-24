import { doc, updateDoc, setDoc, increment } from "firebase/firestore";
import { db, auth, configuracionValida } from "./firebase.js";

// Contadores anónimos (solo un número, sin datos personales) en Firestore: metricas/<id>.
// Nunca estorban: si fallan, la app sigue igual. Se leen en privado con `npm run metricas`.
function contar(id) {
  // Fuera del navegador (scripts de prueba en Node) no se cuenta, para no ensuciar las cifras.
  if (typeof window === "undefined" || !configuracionValida || !auth.currentUser) return;
  const ref = doc(db, "metricas", id);
  // Si el documento aún no existe, las reglas responden "permission-denied" (no "not-found"):
  // en ese caso se crea con 1. Si ya existía, la creación se rechaza y no pasa nada.
  updateDoc(ref, { clics: increment(1) }).catch(() => setDoc(ref, { clics: 1 }).catch(() => {}));
}

export const JUEGOS_METRICA = ["cah", "rebanar", "semaforo", "dados", "pontepedo", "rocola"];

export function contarClicWhatsApp() { contar("whatsapp"); }

export function contarSalaCreada(juego) {
  if (JUEGOS_METRICA.includes(juego)) contar(`salas_${juego}`);
}
