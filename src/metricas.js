import { doc, updateDoc, setDoc, increment } from "firebase/firestore";
import { db, auth, configuracionValida } from "./firebase.js";

// Cuenta (sin datos personales) cuántas veces se toca el enlace de WhatsApp del pie.
// Nunca estorba: si falla, el enlace abre igual. Se lee en la consola de Firebase: metricas/whatsapp.
export function contarClicWhatsApp() {
  if (!configuracionValida || !auth.currentUser) return;
  const ref = doc(db, "metricas", "whatsapp");
  // Si el documento aún no existe, las reglas responden "permission-denied" (no "not-found"):
  // en ese caso se crea con 1. Si ya existía, la creación se rechaza y no pasa nada.
  updateDoc(ref, { clics: increment(1) }).catch(() => setDoc(ref, { clics: 1 }).catch(() => {}));
}
