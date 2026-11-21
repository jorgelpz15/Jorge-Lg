import { useEffect, useState } from "react";
import { S } from "../styles.js";
import { escucharSala, latirPresencia } from "./salaPontePedo.js";
import LobbyPontePedo from "./LobbyPontePedo.jsx";
import PantallaPontePedo from "./PantallaPontePedo.jsx";
import PantallaPontePedoSolo from "./PantallaPontePedoSolo.jsx";
import CargandoDado from "../CargandoDado.jsx";
import { useLatido } from "../shared/useLatido.js";

const CLAVE_LOCAL = "pontepedo_sesion";

export default function PontePedoApp({ uid, onVolverAlMenu, codigoInicial }) {
  const [codigo, setCodigo] = useState(() => {
    // Un link de invitación manda sobre una sesión guardada vieja.
    if (codigoInicial) return null;
    try {
      const guardado = localStorage.getItem(CLAVE_LOCAL);
      return guardado ? JSON.parse(guardado).codigo || null : null;
    } catch { return null; }
  });
  const [sala, setSala] = useState(null);
  const [modoSolo, setModoSolo] = useState(false);

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

  if (modoSolo) {
    return <PantallaPontePedoSolo onSalir={() => setModoSolo(false)} />;
  }

  if (!codigo) {
    return (
      <LobbyPontePedo uid={uid} onEntrar={handleEntrar} onJugarSolo={() => setModoSolo(true)}
        onVolverAlMenu={onVolverAlMenu} codigoInicial={codigoInicial} />
    );
  }

  if (!sala) {
    return (
      <div style={S.page}>
        <CargandoDado texto="Entrando a la sala…" onVolver={onVolverAlMenu} />
      </div>
    );
  }

  return <PantallaPontePedo sala={sala} uid={uid} codigo={codigo} onSalir={handleSalir} />;
}
