import { lazy, Suspense, useEffect, useState } from "react";
import { esperarMiUid, configuracionValida } from "./firebase";
import { escucharSala, latirPresencia } from "./sala";
import { S } from "./styles";
import SelectorJuegos from "./SelectorJuegos";
import CargandoDado from "./CargandoDado";
import { useLatido } from "./shared/useLatido.js";

// Cada juego se descarga solo cuando alguien lo elige: el menú abre con una
// fracción del código (y los mazos de CAH no viajan si juegas otra cosa).
const Lobby = lazy(() => import("./Lobby"));
const Game = lazy(() => import("./Game"));
const RebanarApp = lazy(() => import("./rebanar/RebanarApp.jsx"));
const SemaforoApp = lazy(() => import("./semaforo/SemaforoApp.jsx"));
const DadosApp = lazy(() => import("./dados/DadosApp.jsx"));
const PontePedoApp = lazy(() => import("./pontepedo/PontePedoApp.jsx"));
const RocolaApp = lazy(() => import("./rocola/RocolaApp.jsx"));

function Cargando({ onVolver }) {
  return <div style={S.page}><CargandoDado onVolver={onVolver} /></div>;
}

const CLAVE_LOCAL = "cah_sesion";

const JUEGOS_VALIDOS = ["cah", "rebanar", "semaforo", "dados", "pontepedo", "rocola"];

// Un link de invitación trae el juego (?juego=rebanar) y el código
// (?codigo=1234). Los links viejos sin "juego" son siempre de CAH, para no
// romper invitaciones ya mandadas antes de que existieran los otros juegos.
function leerInvitacionDeUrl() {
  const params = new URLSearchParams(location.search);
  const codigo = params.get("codigo");
  if (!codigo || !/^\d{4}$/.test(codigo)) return { codigo: null, juego: null };
  const juego = params.get("juego");
  return { codigo, juego: JUEGOS_VALIDOS.includes(juego) ? juego : "cah" };
}

export default function App() {
  const [uid, setUid] = useState(null);
  const [codigo, setCodigo] = useState(null);
  const [sala, setSala] = useState(null);
  const [errorSala, setErrorSala] = useState(null);
  const [invitacion] = useState(leerInvitacionDeUrl);
  const codigoInicial = invitacion.codigo;
  // Un link de invitación salta directo a ese juego sin pasar por el menú.
  const [juego, setJuego] = useState(invitacion.juego);

  useEffect(() => {
    if (!configuracionValida) return;
    esperarMiUid().catch(() => { setErrorSala("No se pudo conectar. Revisa tu señal e intenta de nuevo."); return null; }).then((u) => {
      if (!u) return;
      setUid(u);
      // Un link de invitación (?codigo=1234) manda sobre una sesión guardada vieja.
      if (codigoInicial) {
        history.replaceState(null, "", location.pathname);
        return;
      }
      const guardado = localStorage.getItem(CLAVE_LOCAL);
      if (guardado) {
        try {
          const { codigo: codigoGuardado } = JSON.parse(guardado);
          if (codigoGuardado) { setJuego("cah"); setCodigo(codigoGuardado); }
        } catch { /* ignorar sesión corrupta */ }
      }
    });
  }, []);

  useEffect(() => {
    if (!codigo || !uid) return;
    const unsub = escucharSala(
      codigo,
      (data) => {
        if (!data || !data.jugadores[uid]) {
          // La sala ya no existe o no pertenecemos a ella: volver al inicio.
          localStorage.removeItem(CLAVE_LOCAL);
          setCodigo(null);
          setSala(null);
          return;
        }
        setSala(data);
      },
      () => setErrorSala("Se perdió la conexión con la sala.")
    );
    return unsub;
  }, [codigo, uid]);

  // Avisa "sigo aquí" cada 20s mientras el celular está dentro de una sala,
  // para que los demás vean quién sigue conectado en la sala de espera.
  useLatido(Boolean(codigo && uid && sala), () => latirPresencia(codigo, uid));

  function handleEntrar(codigoNuevo) {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ codigo: codigoNuevo }));
    setCodigo(codigoNuevo);
  }

  function handleSalir() {
    localStorage.removeItem(CLAVE_LOCAL);
    setCodigo(null);
    setSala(null);
  }

  function handleVolverAlMenu() {
    localStorage.removeItem(CLAVE_LOCAL);
    setCodigo(null);
    setSala(null);
    setJuego(null);
  }

  if (!configuracionValida) {
    return (
      <div style={S.page}>
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚙️</div>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>Falta configurar Firebase</h2>
          <p style={{ color: "#999", fontSize: 13, lineHeight: 1.5 }}>
            Copia <code style={{ color: "#ffd700" }}>.env.example</code> a <code style={{ color: "#ffd700" }}>.env</code> y
            llénalo con las llaves de tu proyecto de Firebase antes de jugar.
          </p>
        </div>
      </div>
    );
  }

  if (errorSala) {
    return (
      <div style={S.page}>
        <div style={S.card} role="alert">
          <div style={{ fontSize: 44, marginBottom: 8 }}>📡</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>Sin conexión</h2>
          <p style={{ color: "#999", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>{errorSala}</p>
          <button style={S.btn} onClick={() => location.reload()}>Reintentar</button>
          <button style={{ ...S.navBtn, width: "100%", marginTop: 10 }}
            onClick={() => { setErrorSala(null); handleVolverAlMenu(); }}>← Volver al menú</button>
        </div>
      </div>
    );
  }

  if (!uid) {
    return (
      <div style={S.page}>
        <CargandoDado />
      </div>
    );
  }

  if (!juego) {
    return <SelectorJuegos onElegir={setJuego} />;
  }

  if (juego === "rebanar") {
    return <Suspense fallback={<Cargando onVolver={() => setJuego(null)} />}><RebanarApp uid={uid} onVolverAlMenu={() => setJuego(null)} codigoInicial={codigoInicial} /></Suspense>;
  }

  if (juego === "semaforo") {
    return <Suspense fallback={<Cargando onVolver={() => setJuego(null)} />}><SemaforoApp uid={uid} onVolverAlMenu={() => setJuego(null)} codigoInicial={codigoInicial} /></Suspense>;
  }

  if (juego === "dados") {
    return <Suspense fallback={<Cargando onVolver={() => setJuego(null)} />}><DadosApp uid={uid} onVolverAlMenu={() => setJuego(null)} codigoInicial={codigoInicial} /></Suspense>;
  }

  if (juego === "pontepedo") {
    return <Suspense fallback={<Cargando onVolver={() => setJuego(null)} />}><PontePedoApp uid={uid} onVolverAlMenu={() => setJuego(null)} codigoInicial={codigoInicial} /></Suspense>;
  }

  if (juego === "rocola") {
    return <Suspense fallback={<Cargando onVolver={() => setJuego(null)} />}><RocolaApp uid={uid} onVolverAlMenu={() => setJuego(null)} codigoInicial={codigoInicial} /></Suspense>;
  }

  if (!codigo) {
    return <Suspense fallback={<Cargando onVolver={handleVolverAlMenu} />}><Lobby uid={uid} onEntrar={handleEntrar} codigoInicial={codigoInicial} onVolverAlMenu={handleVolverAlMenu} /></Suspense>;
  }

  if (!sala) {
    return (
      <div style={S.page}>
        <CargandoDado texto="Entrando a la sala…" onVolver={handleVolverAlMenu} />
      </div>
    );
  }

  return <Suspense fallback={<Cargando onVolver={handleVolverAlMenu} />}><Game sala={sala} uid={uid} codigo={codigo} onSalir={handleSalir} /></Suspense>;
}
