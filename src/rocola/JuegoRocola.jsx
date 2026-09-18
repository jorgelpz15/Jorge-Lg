import { useEffect, useState } from "react";
import { S } from "../styles.js";
import { estaConectado } from "../shared/presencia.js";
import ConfirmarSalidaDialog from "../shared/ConfirmarSalidaDialog.jsx";
import ComoSeJuega from "../ComoSeJuega.jsx";
import {
  iniciarJuego, sugerirCancion, confirmarCancion, enviarRespuesta, avanzar,
  salirDeSalaEnEspera, jugarOtraVez, unirseSala, djDeRonda, ERAS,
} from "./salaRocola.js";

const NOMBRES_ERA = { "80s": "80s", "90s": "90s", "2000s": "2000s", hoy: "Hoy" };

export default function JuegoRocola({ sala, uid, codigo, onSalir, onEntrarSala }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [cargandoRevancha, setCargandoRevancha] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [eraElegida, setEraElegida] = useState(null);
  const [cancionSugerida, setCancionSugerida] = useState(null);
  const [anioAdivinado, setAnioAdivinado] = useState(1990);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (sala.fase !== "espera") return;
    const t = setInterval(() => setAhora(Date.now()), 5000);
    return () => clearInterval(t);
  }, [sala.fase]);

  useEffect(() => {
    setEraElegida(null);
    setCancionSugerida(null);
    setAnioAdivinado(1990);
  }, [sala.ronda]);

  const yo = sala.jugadores[uid];
  const nombre = (u) => sala.jugadores[u]?.nombre || "?";
  const djActual = sala.orden && sala.orden.length > 0 ? djDeRonda(sala.orden, sala.ronda) : null;

  async function confirmarSalir() {
    if (sala.fase === "espera") await salirDeSalaEnEspera(codigo, uid);
    onSalir();
  }

  async function copiarInvitacion() {
    const link = `${location.origin}/?juego=rocola&codigo=${sala.codigo}`;
    const texto = `¡Únete a mi partida de Rocola! ${link} (código: ${sala.codigo})`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el navegador no dio permiso de portapapeles, no pasa nada grave */ }
  }

  function BotonSalir() {
    return (
      <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 12, textDecoration: "underline", cursor: "pointer", marginTop: 18 }}
        onClick={() => setConfirmarSalida(true)}>Salir de la sala</button>
    );
  }

  function elegirEra(era) {
    setEraElegida(era);
    setCancionSugerida(sugerirCancion(era, sala.cancionesUsadas || []));
  }

  function otraSugerencia() {
    if (!eraElegida) return;
    setCancionSugerida(sugerirCancion(eraElegida, sala.cancionesUsadas || []));
  }

  async function yaLaPuse() {
    if (!cancionSugerida) return;
    await confirmarCancion(codigo, cancionSugerida);
  }

  async function handleEnviarRespuesta() {
    setEnviando(true);
    try {
      await enviarRespuesta(codigo, uid, anioAdivinado);
    } finally {
      setEnviando(false);
    }
  }

  // ---------- Confirmación de salida ----------
  if (confirmarSalida) {
    const enEspera = sala.fase === "espera";
    return (
      <ConfirmarSalidaDialog
        labelSeguir="Seguir jugando"
        mensaje={enEspera
          ? "Puedes volver a entrar después con el mismo código."
          : "La partida ya empezó — si sales ahora, el juego puede quedarse esperando tu turno hasta que vuelvas a entrar con el código."}
        onSeguir={() => setConfirmarSalida(false)}
        onSalir={confirmarSalir}
      />
    );
  }

  // ---------- Sala de espera ----------
  if (sala.fase === "espera") {
    const entradas = Object.entries(sala.jugadores);
    const conectados = entradas.filter(([, j]) => estaConectado(j.visto, ahora)).length;
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "36px 20px" }}>
        <p style={{ color: "#7a7a7a", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", textAlign: "center", margin: "0 0 4px" }}>Código de la sala</p>
        <div style={{ ...S.codeBox, alignSelf: "center" }}>{sala.codigo}</div>
        <p style={{ color: "#ffd700", fontSize: 12, textAlign: "center", margin: "0 0 16px" }}>{sala.totalRondas} rondas</p>
        <button style={{ ...S.btnSm, alignSelf: "center", background: "#1a1a1a", color: "#ffd700", border: "1px solid #333", marginBottom: 20 }}
          onClick={copiarInvitacion}><span key={copiado} className="fade-rise">{copiado ? "¡Copiado! ✓" : "📋 Copiar invitación"}</span></button>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 8px" }}>Jugadores ({conectados}/{entradas.length} conectados):</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 28 }}>
          {entradas.map(([u, j]) => {
            const online = estaConectado(j.visto, ahora);
            return (
              <div key={u} style={{ ...S.chip, justifyContent: "space-between", opacity: online ? 1 : 0.5 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  <span style={{ color: online ? "#4caf50" : "#7a7a7a" }}>●</span> {j.nombre}
                  {u === sala.anfitrion && " 👑"}
                </span>
                {!online && <span style={{ color: "#888", fontSize: 11 }}>desconectado</span>}
              </div>
            );
          })}
        </div>
        <ComoSeJuega storageKey="rocola_reglas_vistas" texto="Cada ronda alguien es el DJ (rota solo) y pone una canción sugerida desde su Spotify. Los demás adivinan en privado el año en que salió — gana quien se acerque más." />
        <button style={{ ...S.btn, opacity: entradas.length >= 2 ? 1 : 0.3 }} disabled={entradas.length < 2} onClick={() => iniciarJuego(codigo)}>¡ARMAR JUEGO! ({entradas.length})</button>
        {entradas.length < 2 && <p style={{ color: "#7a7a7a", fontSize: 11, textAlign: "center", marginTop: 8 }}>Se necesitan mínimo 2 jugadores</p>}
        <div style={{ textAlign: "center" }}><BotonSalir /></div>
      </div>
    );
  }

  // ---------- Turno de juego ----------
  if (sala.fase === "jugando") {
    const esDj = uid === djActual;
    const cancion = sala.cancionActual;

    if (esDj && !cancion) {
      return (
        <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 380, margin: "0 auto 10px" }}>
            <span style={{ background: "#222", color: "#888", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>Ronda {sala.ronda}/{sala.totalRondas}</span>
            <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>Te toca ser DJ 🎧</span>
          </div>
          {!eraElegida ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 16px" }}>Elige una era</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 380, margin: "0 auto" }}>
                {ERAS.map((era) => (
                  <button key={era} style={S.nameBtn} onClick={() => elegirEra(era)}>{NOMBRES_ERA[era]}</button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ width: "100%", maxWidth: 380, margin: "0 auto", textAlign: "center" }}>
              <p style={{ color: "#7a7a7a", fontSize: 12, margin: "0 0 6px" }}>Te tocó:</p>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{cancionSugerida?.titulo}</h2>
              <p style={{ color: "#ffd700", fontSize: 14, fontWeight: 700, margin: "0 0 20px" }}>{cancionSugerida?.artista}</p>
              <a href={`https://open.spotify.com/search/${encodeURIComponent(`${cancionSugerida?.titulo} ${cancionSugerida?.artista}`)}`}
                target="_blank" rel="noreferrer"
                style={{ ...S.btnSm, display: "block", width: "100%", boxSizing: "border-box", marginBottom: 10, textDecoration: "none", textAlign: "center" }}>
                🔎 Buscarla en Spotify
              </a>
              <button style={{ ...S.navBtn, width: "100%", marginBottom: 16 }} onClick={otraSugerencia}>🎵 Otra sugerencia</button>
              <button style={S.btnGold} onClick={yaLaPuse}>Ya la puse →</button>
            </div>
          )}
          <div style={{ textAlign: "center" }}><BotonSalir /></div>
        </div>
      );
    }

    if (esDj && cancion) {
      const respondieron = sala.orden.filter((u) => u !== djActual && sala.respuestas[u]);
      const totalEsperado = sala.orden.length - 1;
      return (
        <div style={S.page}>
          <div style={S.card}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎧</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#4caf50", margin: "0 0 16px" }}>Sonando: {cancion.titulo}</h2>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 10px" }}>{respondieron.length} de {totalEsperado} ya adivinaron</p>
            <BotonSalir />
          </div>
        </div>
      );
    }

    if (!cancion) {
      return (
        <div style={S.page}>
          <div style={S.card}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎶</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>Esperando a que {nombre(djActual)} elija una canción…</h2>
            <BotonSalir />
          </div>
        </div>
      );
    }

    if (sala.respuestas[uid]) {
      return (
        <div style={S.page}>
          <div style={S.card}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#4caf50", margin: "0 0 16px" }}>¡Listo! Esperando a los demás…</h2>
            <BotonSalir />
          </div>
        </div>
      );
    }

    const anioActual = new Date().getFullYear();
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 380, margin: "0 auto 10px" }}>
          <span style={{ background: "#222", color: "#888", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>Ronda {sala.ronda}/{sala.totalRondas}</span>
          <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>{yo.nombre}</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 6px" }}>
          {nombre(djActual)} puso una canción
        </h2>
        <p style={{ color: "#7a7a7a", fontSize: 12, textAlign: "center", margin: "0 0 20px" }}>¿De qué año crees que es?</p>
        <p style={{ color: "#ffd700", fontSize: 42, fontWeight: 900, textAlign: "center", margin: "0 0 16px" }}>{anioAdivinado}</p>
        <input type="range" min="1960" max={anioActual} value={anioAdivinado}
          onChange={(e) => setAnioAdivinado(Number(e.target.value))}
          style={{ width: "100%", maxWidth: 380, margin: "0 auto 24px", display: "block" }} />
        <button style={{ ...S.btnGold, opacity: enviando ? 0.6 : 1 }} disabled={enviando} onClick={handleEnviarRespuesta}>
          {enviando ? "ENVIANDO…" : "Confirmar adivinanza"}
        </button>
        <div style={{ textAlign: "center" }}><BotonSalir /></div>
      </div>
    );
  }

  // ---------- Revelación ----------
  if (sala.fase === "revelando") {
    const ur = sala.ultimaRonda || { ganadores: [], tabla: {} };
    const cancion = sala.cancionActual;
    const ordenados = Object.keys(ur.tabla).sort((a, b) => ur.tabla[a].error - ur.tabla[b].error);
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
        <h2 className="fade-rise" style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 4px" }}>{cancion.titulo}</h2>
        <p className="fade-rise" style={{ color: "#7a7a7a", fontSize: 13, textAlign: "center", margin: "0 0 4px" }}>{cancion.artista}</p>
        <p className="pop-in" style={{ color: "#ffd700", fontSize: 32, fontWeight: 900, textAlign: "center", margin: "0 0 20px" }}>{cancion.anioReal}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {ordenados.map((u) => {
            const t = ur.tabla[u];
            const esGanador = ur.ganadores.includes(u);
            return (
              <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111", borderRadius: 10, border: esGanador ? "1px solid #ffd700" : "1px solid #1a1a1a" }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#fff" }}>{esGanador && "👑 "}{nombre(u)}</span>
                <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>{t.adivinado}</span>
                <span style={{ fontSize: 11, color: "#7a7a7a" }}>({t.error} {t.error === 1 ? "año" : "años"} de error)</span>
              </div>
            );
          })}
        </div>
        <button style={S.btnGold} onClick={() => avanzar(codigo)}>
          {sala.ronda >= sala.totalRondas ? "Ver resultado final →" : "Siguiente ronda →"}
        </button>
        <div style={{ textAlign: "center" }}><BotonSalir /></div>
      </div>
    );
  }

  // ---------- Fin del juego ----------
  if (sala.fase === "fin") {
    const ordenados = [...sala.orden].sort((a, b) => {
      const j1 = sala.jugadores[a], j2 = sala.jugadores[b];
      if (j2.rondasGanadas !== j1.rondasGanadas) return j2.rondasGanadas - j1.rondasGanadas;
      return (j1.errorTotal || 0) - (j2.errorTotal || 0);
    });

    async function alJugarOtraVez() {
      setCargandoRevancha(true);
      try {
        const nuevoCodigo = await jugarOtraVez(codigo, uid, yo.nombre, sala.totalRondas);
        onEntrarSala(nuevoCodigo);
      } catch {
        setCargandoRevancha(false);
      }
    }

    async function alUnirseARevancha() {
      setCargandoRevancha(true);
      try {
        await unirseSala(sala.salaNueva, yo.nombre, uid);
        onEntrarSala(sala.salaNueva);
      } catch {
        setCargandoRevancha(false);
      }
    }

    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div className="pop-in" style={{ fontSize: 64, marginBottom: 4 }}>🎶</div>
          <h1 className="fade-rise" style={{ fontSize: 28, fontWeight: 900, color: "#ffd700", margin: "0 0 2px" }}>
            {sala.orden.length > 1 ? `¡${nombre(ordenados[0])} tiene el mejor oído!` : "¡Terminaste la partida!"}
          </h1>
          <p style={{ color: "#7a7a7a", fontSize: 13, fontStyle: "italic", margin: 0 }}>{sala.totalRondas} rondas jugadas</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
          {ordenados.map((u, i) => (
            <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#111", borderRadius: 10, border: i === 0 ? "1px solid #ffd700" : "1px solid #1a1a1a" }}>
              <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}</span>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#fff" }}>{sala.jugadores[u].nombre}</span>
              <span style={{ fontSize: 13, color: "#ffd700", fontWeight: 700 }}>{sala.jugadores[u].rondasGanadas || 0} rondas</span>
              <span style={{ fontSize: 11, color: "#7a7a7a" }}>{sala.jugadores[u].errorTotal || 0} años de error total</span>
            </div>
          ))}
        </div>
        {sala.salaNueva ? (
          <button style={S.btnGold} disabled={cargandoRevancha} onClick={alUnirseARevancha}>
            {cargandoRevancha ? "Uniendo…" : `🔁 Unirme a la revancha (${sala.salaNueva})`}
          </button>
        ) : (
          <button style={S.btnGold} disabled={cargandoRevancha} onClick={alJugarOtraVez}>
            {cargandoRevancha ? "Creando…" : "🔁 Jugar otra vez"}
          </button>
        )}
        <button style={S.btn} onClick={onSalir}>Salir a inicio</button>
      </div>
    );
  }

  return null;
}
