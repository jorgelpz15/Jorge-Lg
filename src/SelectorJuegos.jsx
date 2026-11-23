import { useState } from "react";
import { S } from "./styles";
import { MARCA_NOMBRE, linkWhatsApp } from "./marca";

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
  {
    id: "semaforo",
    emoji: "🚦",
    nombre: "Semáforo",
    descripcion: "Toca en cuanto se apaguen las luces — como una salida de F1. El más rápido gana.",
    disponible: true,
  },
  {
    id: "dados",
    emoji: "🎲",
    nombre: "Dados",
    descripcion: "Tira hasta 10 dados y todos ven el mismo resultado al instante. Sin ganador, solo para apoyar otros juegos.",
    disponible: true,
  },
  {
    id: "pontepedo",
    emoji: "🍻",
    nombre: "Ponte Pedo",
    descripcion: "Saca una carta y todos ven el reto que les toca — regla, cascada, nunca nunca, y más.",
    disponible: true,
  },
  {
    id: "rocola",
    emoji: "🎶",
    nombre: "Rocola",
    descripcion: "Alguien pone una canción — adivina en qué año salió. Gana quien se acerque más.",
    disponible: true,
  },
];

export default function SelectorJuegos({ onElegir }) {
  const whatsapp = linkWhatsApp();
  const [copiado, setCopiado] = useState(false);

  async function compartirApp() {
    const url = location.origin;
    const texto = "¡Juega conmigo! Cartas Contra la Humanidad, A Rebanar, Rocola y más, cada quien desde su celular.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Juegos con Amigos", text: texto, url });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* sin permiso de portapapeles, no pasa nada grave */ }
  }

  return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "36px 20px" }}>
      <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 4px" }}>Juegos con amigos</h1>
      <p style={{ color: "#8a8a8a", fontSize: 13, textAlign: "center", margin: "0 0 32px" }}>Elige a qué van a jugar</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 380 }}>
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
              gap: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 34 }}>{j.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0 }}>{j.nombre}</h2>
                {!j.disponible && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#000", background: "#ffd700", padding: "2px 6px", borderRadius: 6, letterSpacing: 0.5 }}>PRÓXIMAMENTE</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0", lineHeight: 1.4 }}>{j.descripcion}</p>
            </div>
          </button>
        ))}
      </div>
      <button style={{ ...S.navBtn, width: "100%", maxWidth: 380, marginTop: 20, color: "#ffd700" }} onClick={compartirApp}>
        <span key={copiado} className="fade-rise">{copiado ? "¡Link copiado! ✓" : "📤 Compartir esta app"}</span>
      </button>
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <p style={{ color: "#8a8a8a", fontSize: 12, margin: 0 }}>Desarrollado por</p>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noreferrer" aria-label={`${MARCA_NOMBRE}, escribir por WhatsApp`}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44, padding: "7px 8px" }}>
            <img src="/fulmia-logo.svg" alt={MARCA_NOMBRE} height={30} style={{ display: "block", height: 30, width: "auto" }} />
          </a>
        ) : (
          <img src="/fulmia-logo.svg" alt={MARCA_NOMBRE} height={30} style={{ display: "block", height: 30, width: "auto", margin: "8px auto 0" }} />
        )}
      </div>
      <p style={{ color: "#8a8a8a", fontSize: 10, marginTop: 20 }}>v{__APP_VERSION__}</p>
    </div>
  );
}
