import { useEffect, useState } from "react";
import { S } from "../styles.js";
import { escucharSala, latirPresencia } from "./salaDados.js";
import LobbyDados from "./LobbyDados.jsx";
import PantallaDados from "./PantallaDados.jsx";

const CLAVE_LOCAL = "dados_sesion";
const LATIDO_MS = 20000;

export default function DadosApp({ uid, onVolverAlMenu }) {
  const [codigo, setCodigo] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_LOCAL);
      return guardado ? JSON.parse(guardado).codigo || null : null;
    } catch { return null; }
  });
  const [sala, setSala] = useState(null);

  useEffect(() => {
    if (!codigo) return;
    const unsub = escucharSala(codigo, (data) => {
      if (!data || !data.jugadores[uid]) {
        localStorage.removeItem(CLAVE_LOCAL);
        setCodigo(null);
        setSala(null);
        return;
      }
      setSala(data);
    });
    return unsub;
  }, [codigo, uid]);

  useEffect(() => {
    if (!codigo || !sala) return;
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

  if (!codigo) {
    return <LobbyDados uid={uid} onEntrar={handleEntrar} onVolverAlMenu={onVolverAlMenu} />;
  }

  if (!sala) {
    return (
      <div style={S.page}>
        <p style={{ color: "#7a7a7a", fontSize: 13 }}>Entrando a la sala…</p>
      </div>
    );
  }

  return <PantallaDados sala={sala} uid={uid} codigo={codigo} onSalir={handleSalir} />;
}
