// Banner de la pantalla "Unirme" cuando se llega por un link de invitación:
// dice a qué juego invitaron, para no entrar a ciegas.
export default function InvitacionJuego({ emoji, nombre }) {
  return (
    <div className="fade-rise" style={{
      display: "flex", alignItems: "center", gap: 14, width: "100%", boxSizing: "border-box",
      padding: "14px 16px", marginBottom: 20, background: "#111", border: "1px solid #2a2a2a", borderRadius: 12,
    }}>
      <span style={{ fontSize: 38, lineHeight: 1 }} aria-hidden="true">{emoji}</span>
      <div>
        <p style={{ margin: 0, color: "#7a7a7a", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Te invitaron a jugar</p>
        <p style={{ margin: "2px 0 0", color: "#fff", fontSize: 18, fontWeight: 900 }}>{nombre}</p>
      </div>
    </div>
  );
}
