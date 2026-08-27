import { S } from "../styles.js";
import { REGLAS } from "./salaPontePedo.js";

// Referencia rápida de las 14 cartas — útil sobre todo para quien juega por
// primera vez con este grupo y no se sabe las reglas de memoria todavía.
const ORDEN = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "JOKER"];

export default function ModalReglas({ onCerrar }) {
  return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 4px" }}>📋 Las reglas</h2>
      <p style={{ color: "#7a7a7a", fontSize: 12, textAlign: "center", margin: "0 0 18px" }}>Qué le toca a cada carta</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 380, margin: "0 auto", overflowY: "auto" }}>
        {ORDEN.map((valor) => {
          const r = REGLAS[valor];
          return (
            <div key={valor} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#111", border: "1px solid #222", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 20px rgba(0,0,0,0.35)" }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#ffd700", minWidth: 30 }}>{valor === "JOKER" ? "🃏" : valor}</span>
              <div>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 800, margin: "0 0 2px" }}>{r.emoji} {r.nombre}</p>
                <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.4, margin: 0 }}>{r.texto}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ maxWidth: 380, width: "100%", margin: "18px auto 0" }}>
        <button style={S.btn} onClick={onCerrar}>← Volver al juego</button>
      </div>
    </div>
  );
}
