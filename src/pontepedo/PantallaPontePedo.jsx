import { useEffect, useState } from "react";
import { S } from "../styles.js";
import { sacarCarta, establecerRegla, reiniciarMazo, salirDeSala, REGLAS } from "./salaPontePedo.js";
import ModalReglas from "./ModalReglas.jsx";

const MARGEN_DESCONEXION_MS = 45000;

function estaConectado(visto, ahora) {
  if (!visto) return true;
  const ms = typeof visto.toMillis === "function" ? visto.toMillis() : 0;
  return ahora - ms < MARGEN_DESCONEXION_MS;
}

function colorPalo(palo) {
  return palo === "♥️" || palo === "♦️" ? "#ff4444" : "#222";
}

export default function PantallaPontePedo({ sala, uid, codigo, onSalir }) {
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);
  const [editandoRegla, setEditandoRegla] = useState(false);
  const [reglaInput, setReglaInput] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const [verReglas, setVerReglas] = useState(false);
  const [sacando, setSacando] = useState(false);
  const entradas = Object.entries(sala.jugadores);
  const yo = sala.jugadores[uid];
  const carta = sala.cartaActual;
  const info = carta ? REGLAS[carta.valor] : null;

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  async function confirmarSalir() {
    await salirDeSala(codigo, uid);
    onSalir();
  }

  async function copiarInvitacion() {
    const link = `${location.origin}/?juego=pontepedo&codigo=${sala.codigo}`;
    const texto = `¡Únete a mi partida de Ponte Pedo! ${link} (código: ${sala.codigo})`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el navegador no dio permiso de portapapeles, no pasa nada grave */ }
  }

  function abrirEditorRegla() {
    setReglaInput(sala.reglaActiva || "");
    setEditandoRegla(true);
  }

  async function guardarRegla() {
    await establecerRegla(codigo, reglaInput);
    setEditandoRegla(false);
  }

  // Evita que un doble-toque accidental (fácil de noche, con poca luz o
  // unos tragos encima) queme dos cartas de un jalón.
  async function handleSacarCarta() {
    if (sacando) return;
    setSacando(true);
    try {
      await sacarCarta(codigo, uid);
    } finally {
      setSacando(false);
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

  if (verReglas) {
    return <ModalReglas onCerrar={() => setVerReglas(false)} />;
  }

  if (confirmarReinicio) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🔄</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>¿Barajar todo de nuevo?</h2>
          <p style={{ color: "#999", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>Se arma un mazo nuevo desde cero y se borra la regla activa.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnSm, flex: 1, background: "#333", color: "#aaa" }} onClick={() => setConfirmarReinicio(false)}>Cancelar</button>
            <button style={{ ...S.btnSm, flex: 1, background: "#ffd700", color: "#000" }} onClick={async () => { await reiniciarMazo(codigo); setConfirmarReinicio(false); }}>Sí, barajar</button>
          </div>
        </div>
      </div>
    );
  }

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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", margin: "0 0 14px", maxWidth: 380 }}>
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
      <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 11, textDecoration: "underline", cursor: "pointer", alignSelf: "center", marginBottom: 4 }}
        onClick={() => setVerReglas(true)}>📋 Ver todas las reglas</button>

      {editandoRegla ? (
        <div style={{ background: "#1a1000", border: "1px solid #ffd700", borderRadius: 12, padding: "10px 14px", marginBottom: 14, width: "100%", maxWidth: 380, boxSizing: "border-box" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input style={{ ...S.input, flex: 1, fontSize: 13 }} value={reglaInput} autoFocus maxLength={80}
              placeholder="Ej. nadie puede decir nombres" onChange={(e) => setReglaInput(e.target.value)} />
            <button style={{ ...S.scoreBtn, width: 44 }} onClick={guardarRegla}>✓</button>
          </div>
        </div>
      ) : sala.reglaActiva ? (
        <div style={{ background: "#1a1000", border: "1px solid #ffd700", borderRadius: 12, padding: "10px 14px", marginBottom: 14, width: "100%", maxWidth: 380, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#ffd700", fontWeight: 800, flexShrink: 0 }}>📜 REGLA</span>
          <span style={{ fontSize: 13, color: "#fff", flex: 1 }}>{sala.reglaActiva}</span>
          <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 11, textDecoration: "underline", cursor: "pointer", flexShrink: 0 }} onClick={abrirEditorRegla}>editar</button>
        </div>
      ) : (
        <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 11, textDecoration: "underline", cursor: "pointer", marginBottom: 14 }} onClick={abrirEditorRegla}>
          + escribir la regla activa
        </button>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, width: "100%" }}>
        {carta ? (
          <div key={`${carta.en?.seconds ?? ""}-${carta.en?.nanoseconds ?? ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div className="pop-in" style={{ width: 130, height: 182, borderRadius: 14, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: colorPalo(carta.palo), lineHeight: 1 }}>
                {carta.valor === "JOKER" ? "🃏" : carta.valor}
              </span>
              {carta.valor !== "JOKER" && <span style={{ fontSize: 32, color: colorPalo(carta.palo) }}>{carta.palo}</span>}
            </div>
            <div className="fade-rise" style={{ textAlign: "center", maxWidth: 340 }}>
              <p style={{ color: "#ffd700", fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>{info.emoji} {info.nombre}</p>
              <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{info.texto}</p>
            </div>
            <p style={{ color: "#7a7a7a", fontSize: 11, margin: 0 }}>Sacó {sala.jugadores[carta.sacadaPor]?.nombre || "alguien"}</p>
          </div>
        ) : (
          <p style={{ color: "#7a7a7a", fontSize: 14, textAlign: "center" }}>Nadie ha sacado carta todavía</p>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
        <p style={{ color: "#7a7a7a", fontSize: 11, textAlign: "center", margin: "0 0 10px" }}>Quedan {sala.mazo.length} cartas en el mazo</p>
        <button style={{ ...S.btnGold, opacity: sacando ? 0.6 : 1 }} disabled={sacando} onClick={handleSacarCarta}>
          {sacando ? "SACANDO…" : "🃏 SACAR CARTA"}
        </button>
        <div style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 14, marginTop: 18 }}>
          <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 12, textDecoration: "underline", cursor: "pointer" }} onClick={() => setConfirmarReinicio(true)}>Barajar de nuevo</button>
          <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 12, textDecoration: "underline", cursor: "pointer" }} onClick={() => setConfirmarSalida(true)}>Salir de la sala</button>
        </div>
      </div>
    </div>
  );
}
