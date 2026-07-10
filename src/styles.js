// Sistema visual "El Casino Clandestino": negro con un solo acento dorado.
// La profundidad viene de resplandores suaves ("cartas flotando en la
// oscuridad"), nunca de sombras con esquina dura — ver DESIGN.md sección 4.
const SOMBRA = {
  ambiental: "0 12px 32px rgba(0,0,0,0.55)",
  ambientalSuave: "0 8px 20px rgba(0,0,0,0.35)",
  dorada: "0 0 20px rgba(255,215,0,0.35)",
  boton: "0 6px 20px rgba(0,0,0,0.4)",
  botonPeq: "0 4px 14px rgba(0,0,0,0.35)",
  alarma: "0 0 16px rgba(255,68,68,0.25)",
};

export const S = {
  page: { minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Helvetica Neue',Arial,sans-serif", color: "#fff", boxSizing: "border-box" },
  btn: { width: "100%", padding: "15px 20px", fontSize: 16, fontWeight: 900, background: "#fff", color: "#000", border: "none", borderRadius: 12, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", boxShadow: SOMBRA.boton },
  btnGold: { width: "100%", padding: "16px 20px", fontSize: 15, fontWeight: 900, background: "#ffd700", color: "#000", border: "none", borderRadius: 12, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", boxShadow: `${SOMBRA.boton}, ${SOMBRA.dorada}` },
  btnSm: { padding: "12px 16px", fontSize: 14, fontWeight: 800, background: "#fff", color: "#000", border: "none", borderRadius: 10, cursor: "pointer", boxShadow: SOMBRA.botonPeq },
  input: { flex: 1, padding: "13px 14px", fontSize: 15, background: "#1a1a1a", border: "2px solid #333", borderRadius: 10, color: "#fff", outline: "none" },
  fieldLabel: { display: "block", color: "#888", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 6px" },
  chip: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 100, boxShadow: SOMBRA.ambientalSuave },
  scoreBtn: { width: 44, height: 44, borderRadius: 10, border: "2px solid #333", background: "transparent", color: "#888", fontSize: 16, fontWeight: 700, cursor: "pointer" },
  scoreBtnOn: { background: "#fff", color: "#000", borderColor: "#fff" },
  nameBtn: { width: "100%", padding: "14px", fontSize: 15, fontWeight: 800, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 12, cursor: "pointer", textAlign: "center", boxShadow: SOMBRA.ambientalSuave },
  navBtn: { flex: 1, padding: "13px", fontSize: 14, fontWeight: 700, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 10, cursor: "pointer" },
  hl: { color: "#ffd700", textDecoration: "underline wavy", textUnderlineOffset: "3px", fontWeight: 900 },
  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statL: { color: "#888", fontSize: 13 }, statV: { color: "#fff", fontSize: 13, fontWeight: 700 },
  card: { background: "#111", borderRadius: 20, padding: "36px 20px", textAlign: "center", border: "1px solid #222", maxWidth: 380, width: "100%", boxShadow: SOMBRA.ambiental },
  codeBox: { fontSize: 42, fontWeight: 900, letterSpacing: 8, color: "#ffd700", background: "#111", border: "2px dashed #333", borderRadius: 14, padding: "18px 10px", margin: "16px 0", boxShadow: `${SOMBRA.ambiental}, 0 0 24px rgba(255,215,0,0.15)` },
  errorBox: { color: "#ff4444", fontSize: 12, background: "#1a0000", border: "1px solid #ff4444", borderRadius: 8, padding: "8px 12px", marginTop: 8, boxShadow: SOMBRA.alarma },
};
