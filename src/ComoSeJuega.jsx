import { useState } from "react";

// Tarjeta descartable de "cómo se juega" — no modal, porque explicar la
// mecánica no necesita interrumpir ni proteger foco (ver impeccable
// craft-floor.md). Se muestra una sola vez por juego por celular, en la
// sala de espera antes de la primera partida; después queda descartada
// para siempre (localStorage), igual que el resto de la sesión guardada
// de cada juego.
export default function ComoSeJuega({ storageKey, texto }) {
  const [visto, setVisto] = useState(() => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  });

  if (visto) return null;

  function cerrar() {
    try { localStorage.setItem(storageKey, "1"); } catch { /* sin storage, no pasa nada grave */ }
    setVisto(true);
  }

  return (
    <div style={{ background: "#1a1000", border: "1px solid #ffd700", borderRadius: 12, padding: "12px 14px", marginBottom: 20, width: "100%", maxWidth: 380, boxSizing: "border-box" }}>
      <p style={{ color: "#ffd700", fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 6px" }}>📖 Cómo se juega</p>
      <p style={{ color: "#fff", fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>{texto}</p>
      <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 11, textDecoration: "underline", cursor: "pointer", padding: 0 }} onClick={cerrar}>
        Entendido, no mostrar de nuevo
      </button>
    </div>
  );
}
