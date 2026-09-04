import { useState } from "react";
import { S } from "./styles";
import { WHITE_CARDS, BLACK_CARDS } from "./gameData";
import { WHITE_CARDS_EN, BLACK_CARDS_EN } from "./gameDataEn";
import { crearSala, unirseSala } from "./sala";
import { MENSAJES_ERROR_TURNO as MENSAJES_ERROR } from "./mensajesError";

export default function Lobby({ uid, onEntrar, codigoInicial, onVolverAlMenu }) {
  const [pantalla, setPantalla] = useState(codigoInicial ? "unir" : "home");
  const [nombre, setNombre] = useState("");
  const [shotThreshold, setShotThreshold] = useState(5);
  const [idioma, setIdioma] = useState("es");
  const [codigoInput, setCodigoInput] = useState(codigoInicial || "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleCrear() {
    if (!nombre.trim()) return;
    setCargando(true);
    setError("");
    try {
      const codigo = await crearSala(nombre, shotThreshold, uid, idioma);
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

  if (pantalla === "home") return (
    <div style={S.page}>
      <div style={{ maxWidth: 380, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 4 }}>🍆</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: 2 }}>CAH</h1>
          <p style={{ color: "#ffd700", fontSize: 12, letterSpacing: 2, margin: "4px 0 0", textTransform: "uppercase", fontWeight: 700 }}>ENG & SPA version</p>
          <p style={{ color: "#7a7a7a", fontSize: 12, marginTop: 8 }}>{WHITE_CARDS.length + BLACK_CARDS.length} cartas en español · {WHITE_CARDS_EN.length + BLACK_CARDS_EN.length} cards in English</p>
        </div>
        <button style={{ ...S.btnGold, marginBottom: 12 }} onClick={() => setPantalla("crear")}>Crear sala</button>
        <button style={{ ...S.btn, marginBottom: 12 }} onClick={() => setPantalla("unir")}>Unirme con un código</button>
        {onVolverAlMenu && <button style={S.navBtn} onClick={onVolverAlMenu}>← Otros juegos</button>}
      </div>
    </div>
  );

  if (pantalla === "crear") return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "36px 20px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Crear sala</h2>
      <p style={{ color: "#7a7a7a", fontSize: 13, margin: "0 0 20px" }}>Tú serás el anfitrión de la partida</p>
      <label style={S.fieldLabel} htmlFor="nombre-crear">Tu nombre</label>
      <input id="nombre-crear" style={{ ...S.input, width: "100%", marginBottom: 16 }} placeholder="Ej. Jorge" value={nombre}
        onChange={e => setNombre(e.target.value)} maxLength={12} />
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 8px" }}>🗣️ Idioma de las cartas:</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.nameBtn, flex: 1, ...(idioma === "es" ? { background: "#ffd700", color: "#000", border: "1px solid #ffd700" } : {}) }}
            onClick={() => setIdioma("es")}>🇲🇽 Español<br /><span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>{WHITE_CARDS.length + BLACK_CARDS.length} cartas</span></button>
          <button style={{ ...S.nameBtn, flex: 1, ...(idioma === "en" ? { background: "#ffd700", color: "#000", border: "1px solid #ffd700" } : {}) }}
            onClick={() => setIdioma("en")}>🇺🇸 English<br /><span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>{WHITE_CARDS_EN.length + BLACK_CARDS_EN.length} cards</span></button>
        </div>
        <p style={{ color: "#7a7a7a", fontSize: 11, margin: "8px 0 0" }}>No se pueden mezclar idiomas en la misma partida.</p>
      </div>
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
      <p style={{ color: "#7a7a7a", fontSize: 13, margin: "0 0 20px" }}>
        {codigoInicial ? "Te invitaron a esta partida — solo falta tu nombre" : "Pide el código de 4 dígitos a quien creó la sala"}
      </p>
      <label style={S.fieldLabel} htmlFor="nombre-unir">Tu nombre</label>
      <input id="nombre-unir" style={{ ...S.input, width: "100%", marginBottom: 12 }} placeholder="Ej. Jorge" value={nombre}
        onChange={e => setNombre(e.target.value)} maxLength={12} />
      <label style={S.fieldLabel} htmlFor="codigo-unir">Código de la sala</label>
      <input id="codigo-unir" style={{ ...S.input, width: "100%", marginBottom: 16, fontSize: 24, letterSpacing: 6, textAlign: "center" }}
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
