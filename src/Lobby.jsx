import { useState } from "react";
import { S } from "./styles";
import { WHITE_CARDS, BLACK_CARDS } from "./gameData";
import { crearSala, unirseSala } from "./sala";

const MENSAJES_ERROR = {
  SALA_NO_EXISTE: "Ese código no existe. Revísalo con quien creó la sala.",
  SALA_YA_EMPEZO: "Esa partida ya empezó. Pide que armen una nueva sala.",
  SALA_LLENA: "Esa sala ya tiene 8 jugadores (el máximo).",
  NOMBRE_REPETIDO: "Ya hay alguien con ese nombre en la sala, usa otro.",
};

export default function Lobby({ uid, onEntrar, codigoInicial }) {
  const [pantalla, setPantalla] = useState(codigoInicial ? "unir" : "splash");
  const [nombre, setNombre] = useState("");
  const [shotThreshold, setShotThreshold] = useState(5);
  const [codigoInput, setCodigoInput] = useState(codigoInicial || "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleCrear() {
    if (!nombre.trim()) return;
    setCargando(true);
    setError("");
    try {
      const codigo = await crearSala(nombre, shotThreshold, uid);
      onEntrar(codigo, nombre.trim());
    } catch (e) {
      setError("No se pudo crear la sala. Intenta de nuevo.");
      setCargando(false);
    }
  }

  async function handleUnirse() {
    const codigo = codigoInput.trim();
    if (!nombre.trim() || codigo.length !== 4) return;
    setCargando(true);
    setError("");
    try {
      await unirseSala(codigo, nombre, uid);
      onEntrar(codigo, nombre.trim());
    } catch (e) {
      setError(MENSAJES_ERROR[e.message] || "No se pudo unir a la sala.");
      setCargando(false);
    }
  }

  if (pantalla === "splash") return (
    <div style={S.page}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: 72, marginBottom: 8 }}>🍆</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: 3, lineHeight: 1.1 }}>CARTAS</h1>
        <p style={{ color: "#666", fontSize: 15, letterSpacing: 6, margin: "2px 0", textTransform: "uppercase", fontWeight: 300 }}>contra la</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: 3 }}>HUMANIDAD</h1>
        <p style={{ color: "#ffd700", fontSize: 13, marginTop: 12, letterSpacing: 2 }}>Edición México 🇲🇽 · Multijugador</p>
        <p style={{ color: "#555", fontSize: 11, marginTop: 4 }}>{WHITE_CARDS.length} blancas · {BLACK_CARDS.length} negras</p>
        <div style={{ width: 50, height: 2, background: "#222", margin: "28px auto" }} />
        <button style={S.btn} onClick={() => setPantalla("home")}>JUGAR</button>
        <p style={{ color: "#444", fontSize: 11, marginTop: 20, fontStyle: "italic" }}>Un juego horrible para gente horrible</p>
      </div>
    </div>
  );

  if (pantalla === "home") return (
    <div style={S.page}>
      <div style={{ maxWidth: 380, width: "100%" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 28px" }}>Cada quien desde su celular</h2>
        <button style={{ ...S.btnGold, marginBottom: 12 }} onClick={() => setPantalla("crear")}>Crear sala</button>
        <button style={S.btn} onClick={() => setPantalla("unir")}>Unirme con un código</button>
      </div>
    </div>
  );

  if (pantalla === "crear") return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "36px 20px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Crear sala</h2>
      <p style={{ color: "#555", fontSize: 13, margin: "0 0 20px" }}>Tú serás el anfitrión de la partida</p>
      <input style={{ ...S.input, width: "100%", marginBottom: 16 }} placeholder="Tu nombre..." value={nombre}
        onChange={e => setNombre(e.target.value)} maxLength={12} />
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 8px" }}>🍺 Estrellas para desbloquear un shot:</p>
        <div style={{ display: "flex", gap: 6 }}>
          {[3, 5, 7, 10].map(n => <button key={n} style={{ ...S.scoreBtn, ...(shotThreshold === n ? S.scoreBtnOn : {}) }} onClick={() => setShotThreshold(n)}>{n}</button>)}
        </div>
      </div>
      {error && <p style={S.errorBox}>{error}</p>}
      <button style={{ ...S.btn, opacity: nombre.trim() && !cargando ? 1 : 0.3 }} disabled={!nombre.trim() || cargando} onClick={handleCrear}>
        {cargando ? "Creando..." : "Crear sala"}
      </button>
      <button style={{ ...S.navBtn, marginTop: 10, width: "100%" }} onClick={() => setPantalla("home")}>← Volver</button>
    </div>
  );

  if (pantalla === "unir") return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "36px 20px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Unirme a una sala</h2>
      <p style={{ color: "#555", fontSize: 13, margin: "0 0 20px" }}>
        {codigoInicial ? "Te invitaron a esta partida — solo falta tu nombre" : "Pide el código de 4 dígitos a quien creó la sala"}
      </p>
      <input style={{ ...S.input, width: "100%", marginBottom: 12 }} placeholder="Tu nombre..." value={nombre}
        onChange={e => setNombre(e.target.value)} maxLength={12} />
      <input style={{ ...S.input, width: "100%", marginBottom: 16, fontSize: 24, letterSpacing: 6, textAlign: "center" }}
        placeholder="0000" value={codigoInput} inputMode="numeric" maxLength={4}
        onChange={e => setCodigoInput(e.target.value.replace(/\D/g, "").slice(0, 4))} />
      {error && <p style={S.errorBox}>{error}</p>}
      <button style={{ ...S.btn, opacity: nombre.trim() && codigoInput.length === 4 && !cargando ? 1 : 0.3 }}
        disabled={!nombre.trim() || codigoInput.length !== 4 || cargando} onClick={handleUnirse}>
        {cargando ? "Uniendo..." : "Unirme"}
      </button>
      <button style={{ ...S.navBtn, marginTop: 10, width: "100%" }} onClick={() => setPantalla("home")}>← Volver</button>
    </div>
  );

  return null;
}
