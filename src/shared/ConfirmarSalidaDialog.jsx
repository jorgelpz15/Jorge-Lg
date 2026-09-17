import { S } from "../styles.js";

// Diálogo "¿Salir de la sala?" compartido — el shell visual estaba
// duplicado idéntico en los 5 juegos del hub (ver
// PATHFINDER-2026-09-09/02-duplication-report.md, item 4). El mensaje y
// la etiqueta del botón "seguir" varían legítimamente por juego (turnos
// vs. sin turnos) y siguen siendo props, no texto fijo aquí.
export default function ConfirmarSalidaDialog({ mensaje, labelSeguir, onSeguir, onSalir }) {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🚪</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>¿Salir de la sala?</h2>
        <p style={{ color: "#999", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>{mensaje}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btnSm, flex: 1, background: "#333", color: "#aaa" }} onClick={onSeguir}>{labelSeguir}</button>
          <button style={{ ...S.btnSm, flex: 1, background: "#ff4444", color: "#fff" }} onClick={onSalir}>Sí, salir</button>
        </div>
      </div>
    </div>
  );
}
