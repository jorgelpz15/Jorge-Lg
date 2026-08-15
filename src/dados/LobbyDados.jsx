import { useState } from "react";
import { S } from "../styles.js";
import { crearSala, unirseSala } from "./salaDados.js";

const MENSAJES_ERROR = {
  SALA_NO_EXISTE: "Ese código no existe. Revísalo con quien creó la sala.",
  SALA_LLENA: "Esa sala ya tiene 12 jugadores (el máximo).",
  NOMBRE_REPETIDO: "Ya hay alguien con ese nombre en la sala, usa otro.",
};

export default function LobbyDados({ uid, onEntrar, onVolverAlMenu, codigoInicial }) {
  const [pantalla, setPantalla] = useState(codigoInicial ? "unir" : "home");
  const [solo, setSolo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [codigoInput, setCodigoInput] = useState(codigoInicial || "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function abrirCrear(modoSolo) {
    setSolo(modoSolo);
    setPantalla("crear");
  }

  async function handleCrear() {
    if (!nombre.trim()) return;
    setCargando(true);
    setError("");
    try {
      const codigo = await crearSala(nombre, uid);
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
          <div style={{ fontSize: 52, marginBottom: 4 }}>🎲</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: 0 }}>Dados</h1>
          <p style={{ color: "#7a7a7a", fontSize: 12, marginTop: 8 }}>tira los dados y todos ven el mismo resultado, al mismo tiempo</p>
        </div>
        <button style={{ ...S.btn, marginBottom: 12 }} onClick={() => abrirCrear(true)}>🕹️ Jugar solo</button>
        <button style={{ ...S.btnGold, marginBottom: 12 }} onClick={() => abrirCrear(false)}>Crear sala</button>
        <button style={{ ...S.btn, marginBottom: 12 }} onClick={() => setPantalla("unir")}>Unirme con un código</button>
        {onVolverAlMenu && <button style={S.navBtn} onClick={onVolverAlMenu}>← Otros juegos</button>}
      </div>
    </div>
  );

  if (pantalla === "crear") return (
    <div style={{ ...S.page, justifyContent: "flex-start", padding: "36px 20px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{solo ? "Jugar solo" : "Crear sala"}</h2>
      <p style={{ color: "#7a7a7a", fontSize: 13, margin: "0 0 20px" }}>{solo ? "Practica tú solo, a tu ritmo" : "Tú serás el anfitrión"}</p>
      <label style={S.fieldLabel} htmlFor="nombre-crear-d">Tu nombre</label>
      <input id="nombre-crear-d" style={{ ...S.input, width: "100%", marginBottom: 16 }} placeholder="Ej. Jorge" value={nombre}
        onChange={(e) => setNombre(e.target.value)} maxLength={12} />
      {error && <p style={S.errorBox}>{error}</p>}
      <button style={{ ...S.btn, opacity: nombre.trim() && !cargando ? 1 : 0.3 }} disabled={!nombre.trim() || cargando} onClick={handleCrear}>
        {cargando ? "Creando..." : solo ? "Empezar" : "Crear sala"}
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
      <label style={S.fieldLabel} htmlFor="nombre-unir-d">Tu nombre</label>
      <input id="nombre-unir-d" style={{ ...S.input, width: "100%", marginBottom: 12 }} placeholder="Ej. Jorge" value={nombre}
        onChange={(e) => setNombre(e.target.value)} maxLength={12} />
      <label style={S.fieldLabel} htmlFor="codigo-unir-d">Código de la sala</label>
      <input id="codigo-unir-d" style={{ ...S.input, width: "100%", marginBottom: 16, fontSize: 24, letterSpacing: 6, textAlign: "center" }}
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
