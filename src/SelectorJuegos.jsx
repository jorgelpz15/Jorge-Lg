import { S } from "./styles";

const JUEGOS = [
  {
    id: "cah",
    emoji: "🍆",
    nombre: "Cartas Contra la Humanidad",
    descripcion: "Humor negro, cada quien su celular. 3+ jugadores (o modo libre con 2).",
    disponible: true,
  },
  {
    id: "rebanar",
    emoji: "🔪",
    nombre: "A Rebanar",
    descripcion: "Corta la figura lo más cerca posible del porcentaje que te toque.",
    disponible: true,
  },
];

export default function SelectorJuegos({ onElegir }) {
  return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 4px" }}>Juegos con amigos</h1>
      <p style={{ color: "#7a7a7a", fontSize: 13, textAlign: "center", margin: "0 0 32px" }}>Elige a qué van a jugar</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 380 }}>
        {JUEGOS.map((j) => (
          <button
            key={j.id}
            onClick={() => j.disponible && onElegir(j.id)}
            style={{
              ...S.card,
              width: "100%",
              maxWidth: "none",
              textAlign: "left",
              cursor: j.disponible ? "pointer" : "default",
              opacity: j.disponible ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "20px 18px",
            }}
          >
            <div style={{ fontSize: 40 }}>{j.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0 }}>{j.nombre}</h2>
                {!j.disponible && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#000", background: "#ffd700", padding: "2px 6px", borderRadius: 6, letterSpacing: 0.5 }}>PRÓXIMAMENTE</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0", lineHeight: 1.4 }}>{j.descripcion}</p>
            </div>
          </button>
        ))}
      </div>
      <p style={{ color: "#7a7a7a", fontSize: 10, marginTop: 32 }}>v{__APP_VERSION__}</p>
    </div>
  );
}
