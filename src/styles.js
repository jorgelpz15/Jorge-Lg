// Mismo look & feel del prototipo original: negro con acentos dorados.
export const S = {
  page: { minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Helvetica Neue',Arial,sans-serif", color: "#fff", boxSizing: "border-box" },
  btn: { width: "100%", padding: "15px 20px", fontSize: 16, fontWeight: 900, background: "#fff", color: "#000", border: "none", borderRadius: 12, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" },
  btnGold: { width: "100%", padding: "16px 20px", fontSize: 15, fontWeight: 900, background: "#ffd700", color: "#000", border: "none", borderRadius: 12, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" },
  btnSm: { padding: "12px 16px", fontSize: 14, fontWeight: 800, background: "#fff", color: "#000", border: "none", borderRadius: 10, cursor: "pointer" },
  input: { flex: 1, padding: "13px 14px", fontSize: 15, background: "#1a1a1a", border: "2px solid #333", borderRadius: 10, color: "#fff", outline: "none" },
  chip: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 100 },
  scoreBtn: { width: 40, height: 40, borderRadius: 10, border: "2px solid #333", background: "transparent", color: "#888", fontSize: 16, fontWeight: 700, cursor: "pointer" },
  scoreBtnOn: { background: "#fff", color: "#000", borderColor: "#fff" },
  nameBtn: { width: "100%", padding: "14px", fontSize: 15, fontWeight: 800, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 12, cursor: "pointer", textAlign: "center" },
  navBtn: { flex: 1, padding: "13px", fontSize: 14, fontWeight: 700, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 10, cursor: "pointer" },
  hl: { color: "#ffd700", textDecoration: "underline wavy", textUnderlineOffset: "3px", fontWeight: 900 },
  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statL: { color: "#888", fontSize: 13 }, statV: { color: "#fff", fontSize: 13, fontWeight: 700 },
  card: { background: "#111", borderRadius: 20, padding: "36px 20px", textAlign: "center", border: "1px solid #222", maxWidth: 380, width: "100%" },
  codeBox: { fontSize: 42, fontWeight: 900, letterSpacing: 8, color: "#ffd700", background: "#111", border: "2px dashed #333", borderRadius: 14, padding: "18px 10px", margin: "16px 0" },
  errorBox: { color: "#ff4444", fontSize: 12, background: "#1a0000", border: "1px solid #ff4444", borderRadius: 8, padding: "8px 12px", marginTop: 8 },
};

export function inyectarEstiloGlobal() {
  if (document.getElementById("cah-global-style")) return;
  const ss = document.createElement("style");
  ss.id = "cah-global-style";
  ss.textContent = `*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{margin:0;background:#000;overscroll-behavior:none}input::placeholder{color:#555}button:active{transform:scale(0.97)}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}`;
  document.head.appendChild(ss);
}
