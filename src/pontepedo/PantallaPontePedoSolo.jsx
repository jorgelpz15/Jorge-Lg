import { useState } from "react";
import { S } from "../styles.js";
import { REGLAS, mazoNuevo, shuffle } from "./salaPontePedo.js";

// Modo "un solo dispositivo": todo vive en memoria local (sin sala, sin
// Firestore, sin internet). Pensado para pasar un solo celular/iPad entre
// el grupo en vez de que cada uno se conecte con su propio código de sala.
function colorPalo(palo) {
  return palo === "♥️" || palo === "♦️" ? "#ff4444" : "#222";
}

export default function PantallaPontePedoSolo({ onSalir }) {
  const [mazo, setMazo] = useState(() => mazoNuevo());
  const [descarte, setDescarte] = useState([]);
  const [cartaActual, setCartaActual] = useState(null);
  const [reglaActiva, setReglaActiva] = useState("");
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);
  const [editandoRegla, setEditandoRegla] = useState(false);
  const [reglaInput, setReglaInput] = useState("");
  const [tick, setTick] = useState(0);

  const info = cartaActual ? REGLAS[cartaActual.valor] : null;

  function sacarCarta() {
    let m = [...mazo];
    let d = cartaActual ? [...descarte, cartaActual] : [...descarte];
    if (m.length === 0) {
      m = shuffle(d);
      d = [];
    }
    const carta = m.pop();
    setMazo(m);
    setDescarte(d);
    setCartaActual(carta);
    setTick((t) => t + 1);
  }

  function reiniciar() {
    setMazo(mazoNuevo());
    setDescarte([]);
    setCartaActual(null);
    setReglaActiva("");
    setConfirmarReinicio(false);
  }

  function abrirEditorRegla() {
    setReglaInput(reglaActiva);
    setEditandoRegla(true);
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
            <button style={{ ...S.btnSm, flex: 1, background: "#ffd700", color: "#000" }} onClick={reiniciar}>Sí, barajar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 380, margin: "0 auto 4px" }}>
        <span style={{ background: "#222", color: "#888", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>🍻 Modo solo</span>
        <span style={{ fontSize: 12, color: "#7a7a7a", fontWeight: 700 }}>Pásense el celular</span>
      </div>

      {editandoRegla ? (
        <div style={{ background: "#1a1000", border: "1px solid #ffd700", borderRadius: 12, padding: "10px 14px", margin: "10px 0 14px", width: "100%", maxWidth: 380, boxSizing: "border-box" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input style={{ ...S.input, flex: 1, fontSize: 13 }} value={reglaInput} autoFocus maxLength={80}
              placeholder="Ej. nadie puede decir nombres" onChange={(e) => setReglaInput(e.target.value)} />
            <button style={{ ...S.scoreBtn, width: 44 }} onClick={() => { setReglaActiva(reglaInput.trim()); setEditandoRegla(false); }}>✓</button>
          </div>
        </div>
      ) : reglaActiva ? (
        <div style={{ background: "#1a1000", border: "1px solid #ffd700", borderRadius: 12, padding: "10px 14px", margin: "10px 0 14px", width: "100%", maxWidth: 380, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#ffd700", fontWeight: 800, flexShrink: 0 }}>📜 REGLA</span>
          <span style={{ fontSize: 13, color: "#fff", flex: 1 }}>{reglaActiva}</span>
          <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 11, textDecoration: "underline", cursor: "pointer", flexShrink: 0 }} onClick={abrirEditorRegla}>editar</button>
        </div>
      ) : (
        <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 11, textDecoration: "underline", cursor: "pointer", margin: "10px 0 14px" }} onClick={abrirEditorRegla}>
          + escribir la regla activa
        </button>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, width: "100%" }}>
        {cartaActual ? (
          <div key={tick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div className="pop-in" style={{ width: 130, height: 182, borderRadius: 14, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: colorPalo(cartaActual.palo), lineHeight: 1 }}>
                {cartaActual.valor === "JOKER" ? "🃏" : cartaActual.valor}
              </span>
              {cartaActual.valor !== "JOKER" && <span style={{ fontSize: 32, color: colorPalo(cartaActual.palo) }}>{cartaActual.palo}</span>}
            </div>
            <div className="fade-rise" style={{ textAlign: "center", maxWidth: 340 }}>
              <p style={{ color: "#ffd700", fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>{info.emoji} {info.nombre}</p>
              <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{info.texto}</p>
            </div>
          </div>
        ) : (
          <p style={{ color: "#7a7a7a", fontSize: 14, textAlign: "center" }}>Nadie ha sacado carta todavía</p>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
        <p style={{ color: "#7a7a7a", fontSize: 11, textAlign: "center", margin: "0 0 10px" }}>Quedan {mazo.length} cartas en el mazo</p>
        <button style={S.btnGold} onClick={sacarCarta}>🃏 SACAR CARTA</button>
        <div style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 14, marginTop: 18 }}>
          <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 12, textDecoration: "underline", cursor: "pointer" }} onClick={() => setConfirmarReinicio(true)}>Barajar de nuevo</button>
          <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 12, textDecoration: "underline", cursor: "pointer" }} onClick={onSalir}>← Menú</button>
        </div>
      </div>
    </div>
  );
}
