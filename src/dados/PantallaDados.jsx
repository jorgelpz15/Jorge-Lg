import { useEffect, useState } from "react";
import { S } from "../styles.js";
import { ajustarNumDados, tirarDados, salirDeSala, MIN_DADOS, MAX_DADOS } from "./salaDados.js";

const MARGEN_DESCONEXION_MS = 45000;

function estaConectado(visto, ahora) {
  if (!visto) return true;
  const ms = typeof visto.toMillis === "function" ? visto.toMillis() : 0;
  return ahora - ms < MARGEN_DESCONEXION_MS;
}

// Posiciones de los puntos en una cuadrícula 3x3, como un dado de verdad.
const PUNTOS_POR_VALOR = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
};

function Dado({ valor, tamano = 64 }) {
  const puntos = PUNTOS_POR_VALOR[valor] || [];
  return (
    <div
      className="dado-pop"
      style={{
        width: tamano, height: tamano, borderRadius: tamano * 0.18, background: "#fff",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr",
        padding: tamano * 0.12, boxShadow: "0 3px 10px rgba(0,0,0,0.4)", flexShrink: 0,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const fila = Math.floor(i / 3) + 1, col = (i % 3) + 1;
        const activo = puntos.some(([f, c]) => f === fila && c === col);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {activo && <div style={{ width: "60%", height: "60%", borderRadius: "50%", background: "#111" }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function PantallaDados({ sala, uid, codigo, onSalir }) {
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const [tirando, setTirando] = useState(false);
  const entradas = Object.entries(sala.jugadores);
  const yo = sala.jugadores[uid];

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  async function confirmarSalir() {
    await salirDeSala(codigo, uid);
    onSalir();
  }

  async function copiarInvitacion() {
    const link = `${location.origin}/?juego=dados&codigo=${sala.codigo}`;
    const texto = `¡Únete a mi partida de Dados! ${link} (código: ${sala.codigo})`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el navegador no dio permiso de portapapeles, no pasa nada grave */ }
  }

  // Evita que un doble-toque accidental (de noche, con poca luz o unos
  // tragos encima) dispare dos tiradas de un jalón — mismo candado que ya
  // tienen CAH y Ponte Pedo.
  async function handleTirar() {
    if (tirando) return;
    setTirando(true);
    try {
      await tirarDados(codigo, uid, sala.numDados);
    } finally {
      setTirando(false);
    }
  }

  if (confirmarSalida) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🚪</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>¿Salir de la sala?</h2>
          <p style={{ color: "#999", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>Puedes volver a entrar después con el mismo código.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnSm, flex: 1, background: "#333", color: "#aaa" }} onClick={() => setConfirmarSalida(false)}>Seguir aquí</button>
            <button style={{ ...S.btnSm, flex: 1, background: "#ff4444", color: "#fff" }} onClick={confirmarSalir}>Sí, salir</button>
          </div>
        </div>
      </div>
    );
  }

  const tiro = sala.ultimoTiro;

  return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 380, margin: "0 auto 4px" }}>
        <span style={{ background: "#222", color: "#888", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>Sala {sala.codigo}</span>
        <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>{yo.nombre}</span>
      </div>
      <button style={{ ...S.btnSm, alignSelf: "center", background: "#1a1a1a", color: "#ffd700", border: "1px solid #333", margin: "10px 0" }}
        onClick={copiarInvitacion}><span key={copiado} className="fade-rise">{copiado ? "¡Copiado! ✓" : "📋 Copiar invitación"}</span></button>
      <p style={{ color: "#7a7a7a", fontSize: 11, textAlign: "center", margin: "0 0 8px" }}>
        Jugadores ({entradas.filter(([, j]) => estaConectado(j.visto, ahora)).length}/{entradas.length} conectados)
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", margin: "0 0 24px", maxWidth: 380 }}>
        {entradas.map(([u, j]) => {
          const online = estaConectado(j.visto, ahora);
          return (
            <span key={u} style={{ ...S.chip, opacity: online ? 0.85 : 0.4 }}>
              <span style={{ color: online ? "#4caf50" : "#7a7a7a" }}>●</span> {j.nombre}{u === sala.anfitrion && " 👑"}
              {!online && <span style={{ color: "#7a7a7a", fontSize: 10 }}> · desconectado</span>}
            </span>
          );
        })}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, width: "100%" }}>
        {tiro ? (
          <>
            <div key={tiro.en?.seconds ?? tiro.valores.join("-")} style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 380 }}>
              {tiro.valores.map((v, i) => <Dado key={i} valor={v} />)}
            </div>
            <p style={{ color: "#ffd700", fontSize: 22, fontWeight: 900, margin: 0 }}>Suma: {tiro.suma}</p>
            <p style={{ color: "#7a7a7a", fontSize: 12, margin: 0 }}>Tiró {sala.jugadores[tiro.tiradoPor]?.nombre || "alguien"}</p>
          </>
        ) : (
          <p style={{ color: "#7a7a7a", fontSize: 14, textAlign: "center" }}>Nadie ha tirado los dados todavía</p>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
          <button style={{ ...S.scoreBtn, width: 40, height: 40 }} disabled={sala.numDados <= MIN_DADOS}
            onClick={() => ajustarNumDados(codigo, -1)}>−</button>
          <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, minWidth: 90, textAlign: "center" }}>{sala.numDados} dado{sala.numDados > 1 ? "s" : ""}</span>
          <button style={{ ...S.scoreBtn, width: 40, height: 40 }} disabled={sala.numDados >= MAX_DADOS}
            onClick={() => ajustarNumDados(codigo, 1)}>+</button>
        </div>
        <button style={{ ...S.btnGold, opacity: tirando ? 0.6 : 1 }} disabled={tirando} onClick={handleTirar}>
          {tirando ? "TIRANDO…" : "🎲 TIRAR DADOS"}
        </button>
        <div style={{ textAlign: "center" }}>
          <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 12, textDecoration: "underline", cursor: "pointer", marginTop: 18 }}
            onClick={() => setConfirmarSalida(true)}>Salir de la sala</button>
        </div>
      </div>
    </div>
  );
}
