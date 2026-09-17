import { useEffect, useState } from "react";

// Reemplaza el bloque de sesión/localStorage/heartbeat que los otros 5
// *App.jsx del hub repiten casi línea por línea (ver
// PATHFINDER-2026-09-09/02-duplication-report.md, item 6). Rocola es el
// primer juego que lo usa; los otros 5 no se tocan en este plan.
export function useSalaSession({ claveLocal, escucharSala, latirPresencia, uid, codigoInicial }) {
  const [codigo, setCodigo] = useState(() => {
    if (codigoInicial) return null;
    try {
      const guardado = localStorage.getItem(claveLocal);
      return guardado ? JSON.parse(guardado).codigo || null : null;
    } catch { return null; }
  });
  const [sala, setSala] = useState(null);

  useEffect(() => {
    if (!codigo || !uid) return;
    const unsub = escucharSala(codigo, (data) => {
      if (!data || !data.jugadores[uid]) {
        localStorage.removeItem(claveLocal);
        setCodigo(null);
        setSala(null);
        return;
      }
      setSala(data);
    });
    return unsub;
  }, [codigo, uid]);

  // El `sala != null` en las dependencias es intencional: re-arma el
  // intervalo cuando `sala` pasa de null a con-valor, no en cada cambio de
  // contenido de `sala` (igual que en los otros 5 juegos).
  useEffect(() => {
    if (!codigo || !sala) return;
    const t = setInterval(() => latirPresencia(codigo, uid), 20000);
    return () => clearInterval(t);
  }, [codigo, uid, sala != null]);

  function handleEntrar(codigoNuevo) {
    localStorage.setItem(claveLocal, JSON.stringify({ codigo: codigoNuevo }));
    setCodigo(codigoNuevo);
  }

  function handleSalir() {
    localStorage.removeItem(claveLocal);
    setCodigo(null);
    setSala(null);
  }

  return { codigo, sala, handleEntrar, handleSalir };
}
