// Panel privado de contadores: `npm run metricas`. Lee metricas/* con tu sesión de la CLI de Firebase
// (firebase login). Nada de esto es accesible desde la app pública: las reglas niegan las lecturas.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROYECTO = "cartas-cah-mx";
const URL_BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents/metricas`;
const NOMBRES = {
  whatsapp: "Toques al WhatsApp del pie",
  salas_cah: "Salas creadas · Cartas Contra la Humanidad",
  salas_rebanar: "Salas creadas · A Rebanar",
  salas_semaforo: "Salas creadas · Semáforo",
  salas_dados: "Salas creadas · Dados",
  salas_pontepedo: "Salas creadas · Ponte Pedo",
  salas_rocola: "Salas creadas · Rocola",
};

function token() {
  const ruta = join(homedir(), ".config", "configstore", "firebase-tools.json");
  return JSON.parse(readFileSync(ruta, "utf8")).tokens.access_token;
}

async function leer() {
  const r = await fetch(URL_BASE, { headers: { Authorization: `Bearer ${token()}` } });
  if (r.status === 401 || r.status === 403) return { vencido: true };
  if (!r.ok) throw new Error(`Firestore respondió ${r.status}`);
  return r.json();
}

let datos = await leer();
if (datos.vencido) {
  // Un comando de solo lectura de la CLI renueva el token vencido.
  try { execSync(`firebase projects:list --json`, { stdio: "ignore" }); } catch { /* se reintenta abajo */ }
  datos = await leer();
  if (datos.vencido) { console.error("Sesión vencida: corre `firebase login --reauth` y vuelve a intentar."); process.exit(1); }
}

const valores = {};
for (const d of datos.documents || []) valores[d.name.split("/").pop()] = Number(d.fields?.clics?.integerValue || 0);
console.log("\nContadores de Juegos con Amigos\n");
for (const [id, nombre] of Object.entries(NOMBRES)) console.log(`${String(valores[id] ?? 0).padStart(6)}  ${nombre}`);
const totalSalas = Object.entries(valores).filter(([k]) => k.startsWith("salas_")).reduce((s, [, v]) => s + v, 0);
console.log(`${String(totalSalas).padStart(6)}  Salas creadas en total\n`);
