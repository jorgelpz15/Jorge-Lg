import { useEffect, useState } from "react";
import { esperarMiUid, configuracionValida } from "./firebase";
import { escucharSala, latirPresencia } from "./sala";
import { S } from "./styles";
import Lobby from "./Lobby";
import Game from "./Game";

const CLAVE_LOCAL = "cah_sesion";
const LATIDO_MS = 20000;

function leerCodigoDeUrl() {
  const codigo = new URLSearchParams(location.search).get("codigo");
  return codigo && /^\d{4}$/.test(codigo) ? codigo : null;
}

export default function App() {
  const [uid, setUid] = useState(null);
  const [codigo, setCodigo] = useState(null);
  const [sala, setSala] = useState(null);
  const [errorSala, setErrorSala] = useState(null);
  const [codigoInicial] = useState(leerCodigoDeUrl);

  useEffect(() => {
    if (!configuracionValida) return;
    esperarMiUid().then((u) => {
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
          if (codigoGuardado) setCodigo(codigoGuardado);
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
  useEffect(() => {
    if (!codigo || !uid || !sala) return;
    const t = setInterval(() => latirPresencia(codigo, uid), LATIDO_MS);
    return () => clearInterval(t);
  }, [codigo, uid, sala != null]);

  function handleEntrar(codigoNuevo) {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ codigo: codigoNuevo }));
    setCodigo(codigoNuevo);
  }

  function handleSalir() {
    localStorage.removeItem(CLAVE_LOCAL);
    setCodigo(null);
    setSala(null);
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

  if (!uid) {
    return (
      <div style={S.page}>
        <p style={{ color: "#7a7a7a", fontSize: 13 }}>Cargando…</p>
      </div>
    );
  }

  if (!codigo) {
    return <Lobby uid={uid} onEntrar={handleEntrar} codigoInicial={codigoInicial} />;
  }

  if (!sala) {
    return (
      <div style={S.page}>
        <p style={{ color: "#7a7a7a", fontSize: 13 }}>Entrando a la sala…</p>
      </div>
    );
  }

  return <Game sala={sala} uid={uid} codigo={codigo} onSalir={handleSalir} />;
}
