import { useEffect, useState } from "react";
import { S } from "../styles.js";
import { escucharSala, latirPresencia } from "./salaDados.js";
import LobbyDados from "./LobbyDados.jsx";
import PantallaDados from "./PantallaDados.jsx";
import CargandoDado from "../CargandoDado.jsx";
import { useLatido } from "../shared/useLatido.js";

const CLAVE_LOCAL = "dados_sesion";

export default function DadosApp({ uid, onVolverAlMenu, codigoInicial }) {
  const [codigo, setCodigo] = useState(() => {
    // Un link de invitación manda sobre una sesión guardada vieja.
    if (codigoInicial) return null;
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

  if (!codigo) {
    return <LobbyDados uid={uid} onEntrar={handleEntrar} onVolverAlMenu={onVolverAlMenu} codigoInicial={codigoInicial} />;
  }

  if (!sala) {
    return (
      <div style={S.page}>
        <CargandoDado texto="Entrando a la sala…" onVolver={onVolverAlMenu} />
      </div>
    );
  }

  return <PantallaDados sala={sala} uid={uid} codigo={codigo} onSalir={handleSalir} />;
}
