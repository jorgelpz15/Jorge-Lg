import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Si falta el archivo .env con las llaves de Firebase, evitamos que la app
// truene con pantalla en blanco: en vez de eso, App.jsx muestra un aviso.
export const configuracionValida = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = configuracionValida ? initializeApp(firebaseConfig) : null;
export const auth = configuracionValida ? getAuth(app) : null;
export const db = configuracionValida ? getFirestore(app) : null;

// Cada celular obtiene un usuario anónimo estable (su "identidad" de jugador).
export function esperarMiUid() {
  return new Promise((resolve, reject) => {
    if (!configuracionValida) { reject(new Error("FIREBASE_NO_CONFIGURADO")); return; }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user.uid);
      }
    }, reject);
    signInAnonymously(auth).catch(reject);
  });
}
