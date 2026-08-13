import { useState } from "react";
import { S } from "../styles.js";
import { crearSala, unirseSala } from "./salaRebanar.js";

const MENSAJES_ERROR = {
  SALA_NO_EXISTE: "Ese código no existe. Revísalo con quien creó la sala.",
  SALA_YA_EMPEZO: "Esa partida ya empezó. Pide que armen una nueva sala.",
  SALA_LLENA: "Esa sala ya tiene 8 jugadores (el máximo).",
  NOMBRE_REPETIDO: "Ya hay alguien con ese nombre en la sala, usa otro.",
};

export default function LobbyRebanar({ uid, onEntrar, onVolverAlMenu }) {
  const [pantalla, setPantalla] = useState("home");
  const [nombre, setNombre] = useState("");
  const [dificultad, setDificultad] = useState("deslizar");
  const [codigoInput, setCodigoInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleCrear() {
    if (!nombre.trim()) return;
    setCargando(true);
    setError("");
    try {
      const codigo = await crearSala(nombre, dificultad, uid);
      onEntrar(codigo);
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
      onEntrar(codigo);
    } catch (e) {
      setError(MENSAJES_ERROR[e.message] || "No se pudo unir a la sala.");
      setCargando(false);
    }
  }

  if (pantalla === "home") return (
    <div style={S.page}>
      <div style={{ maxWidth: 380, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 4 }}>🔪</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: 0 }}>A Rebanar</h1>
          <p style={{ color: "#7a7a7a", fontSize: 12, marginTop: 8 }}>3 rondas · corta lo más cerca posible del % que te toque</p>
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
      <label style={S.fieldLabel} htmlFor="nombre-crear-r">Tu nombre</label>
      <input id="nombre-crear-r" style={{ ...S.input, width: "100%", marginBottom: 16 }} placeholder="Ej. Jorge" value={nombre}
        onChange={(e) => setNombre(e.target.value)} maxLength={12} />
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 8px" }}>✋ Cómo se corta:</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.nameBtn, flex: 1, fontSize: 13, ...(dificultad === "deslizar" ? { background: "#ffd700", color: "#000", border: "1px solid #ffd700" } : {}) }}
            onClick={() => setDificultad("deslizar")}>👆 Deslizar<br /><span style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>un solo trazo, más difícil</span></button>
          <button style={{ ...S.nameBtn, flex: 1, fontSize: 13, ...(dificultad === "linea" ? { background: "#ffd700", color: "#000", border: "1px solid #ffd700" } : {}) }}
            onClick={() => setDificultad("linea")}>📏 Línea<br /><span style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>ajustable, más fácil</span></button>
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
      <p style={{ color: "#7a7a7a", fontSize: 13, margin: "0 0 20px" }}>Pide el código de 4 dígitos a quien creó la sala</p>
      <label style={S.fieldLabel} htmlFor="nombre-unir-r">Tu nombre</label>
      <input id="nombre-unir-r" style={{ ...S.input, width: "100%", marginBottom: 12 }} placeholder="Ej. Jorge" value={nombre}
        onChange={(e) => setNombre(e.target.value)} maxLength={12} />
      <label style={S.fieldLabel} htmlFor="codigo-unir-r">Código de la sala</label>
      <input id="codigo-unir-r" style={{ ...S.input, width: "100%", marginBottom: 16, fontSize: 24, letterSpacing: 6, textAlign: "center" }}
        placeholder="0000" value={codigoInput} inputMode="numeric" maxLength={4}
        onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, "").slice(0, 4))} />
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
