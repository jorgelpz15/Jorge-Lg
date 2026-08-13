import { useEffect, useRef, useState } from "react";
import { S } from "../styles.js";
import { LIENZO, puntosDesdeFirestore } from "./figuras.js";
import { avanzar, enviarCorte, iniciarJuego, jugarOtraVez, salirDeSalaEnEspera, unirseSala } from "./salaRebanar.js";

const MARGEN_DESCONEXION_MS = 45000;
const COLORES = ["#ffd700", "#4caf50", "#ff6b35", "#5aa9ff", "#e05aff", "#ff5a7a", "#5affe0", "#c9ff5a"];

function estaConectado(visto, ahora) {
  if (!visto) return true;
  const ms = typeof visto.toMillis === "function" ? visto.toMillis() : 0;
  return ahora - ms < MARGEN_DESCONEXION_MS;
}

function puntoDesdeEvento(svgEl, clientX, clientY) {
  const rect = svgEl.getBoundingClientRect();
  return [
    ((clientX - rect.left) / rect.width) * LIENZO,
    ((clientY - rect.top) / rect.height) * LIENZO,
  ];
}

function lineaExtendidaVisual(a, b) {
  // Solo para dibujar: una línea larga que cruce el lienzo, en la misma
  // dirección que el corte real (que internamente ya se extiende para medir).
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const mag = Math.hypot(dx, dy) || 1;
  const largo = LIENZO * 2;
  const ux = dx / mag, uy = dy / mag;
  return [[a[0] - ux * largo, a[1] - uy * largo], [b[0] + ux * largo, b[1] + uy * largo]];
}

function FiguraSvg({ puntos, svgRef, children, onPointerDown, onPointerMove, onPointerUp }) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${LIENZO} ${LIENZO}`}
      style={{ width: "100%", maxWidth: 320, aspectRatio: "1/1", display: "block", margin: "0 auto", touchAction: "none", background: "#000", borderRadius: 16 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <polygon points={puntos.map((p) => p.join(",")).join(" ")} fill="#fff" stroke="#333" strokeWidth="2" />
      {children}
    </svg>
  );
}

export default function JuegoRebanar({ sala, uid, codigo, onSalir, onEntrarSala }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [cargandoRevancha, setCargandoRevancha] = useState(false);
  const svgRef = useRef(null);

  // --- estado del corte en curso (solo local, hasta que se confirma) ---
  const [puntoA, setPuntoA] = useState(null);
  const [puntoB, setPuntoB] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [manejando, setManejando] = useState(null); // "a" | "b" | null (modo línea)

  useEffect(() => {
    if (sala.fase !== "espera") return;
    const t = setInterval(() => setAhora(Date.now()), 5000);
    return () => clearInterval(t);
  }, [sala.fase]);

  useEffect(() => {
    // Cada ronda nueva arranca con la línea en blanco.
    setPuntoA(sala.dificultad === "linea" ? [150, 40] : null);
    setPuntoB(sala.dificultad === "linea" ? [150, 260] : null);
    setArrastrando(false);
    setManejando(null);
  }, [sala.ronda, sala.dificultad]);

  const yo = sala.jugadores[uid];
  const nombre = (u) => sala.jugadores[u]?.nombre || "?";

  async function confirmarSalir() {
    if (sala.fase === "espera") await salirDeSalaEnEspera(codigo, uid);
    onSalir();
  }

  function BotonSalir() {
    return (
      <button style={{ background: "none", border: "none", color: "#7a7a7a", fontSize: 12, textDecoration: "underline", cursor: "pointer", marginTop: 18 }}
        onClick={() => setConfirmarSalida(true)}>Salir de la sala</button>
    );
  }

  // ---------- Confirmación de salida ----------
  if (confirmarSalida) {
    const enEspera = sala.fase === "espera";
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🚪</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>¿Salir de la sala?</h2>
          <p style={{ color: "#999", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>
            {enEspera ? "Puedes volver a entrar después con el mismo código." : "La partida ya empezó — si sales ahora, el juego puede quedarse esperando tu corte hasta que vuelvas a entrar con el código."}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnSm, flex: 1, background: "#333", color: "#aaa" }} onClick={() => setConfirmarSalida(false)}>Seguir jugando</button>
            <button style={{ ...S.btnSm, flex: 1, background: "#ff4444", color: "#fff" }} onClick={confirmarSalir}>Sí, salir</button>
          </div>
        </div>
      </div>
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
        <p style={{ color: "#ffd700", fontSize: 12, textAlign: "center", margin: "0 0 16px" }}>{sala.dificultad === "linea" ? "📏 Modo línea" : "👆 Modo deslizar"}</p>
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
        <button style={S.btn} onClick={() => iniciarJuego(codigo)}>¡ARMAR JUEGO! ({entradas.length})</button>
        {entradas.length < 2 && <p style={{ color: "#7a7a7a", fontSize: 11, textAlign: "center", marginTop: 8 }}>Puedes jugar solo para practicar, o esperar a que se unan más amigos</p>}
        <div style={{ textAlign: "center" }}><BotonSalir /></div>
      </div>
    );
  }

  // ---------- Turno de corte ----------
  if (sala.fase === "jugando") {
    const yaEnvie = !!sala.cortes[uid];
    const objetivoPct = Math.round(sala.figuraActual.objetivo * 100);
    const puntosFigura = puntosDesdeFirestore(sala.figuraActual.puntos);

    if (yaEnvie) {
      const listos = sala.orden.filter((u) => sala.cortes[u]);
      return (
        <div style={S.page}>
          <div style={S.card}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#4caf50", margin: "0 0 16px" }}>¡Listo! Esperando a los demás…</h2>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 10px" }}>{listos.length} de {sala.orden.length} ya cortaron</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {sala.orden.map((u) => (
                <span key={u} style={{ ...S.chip, opacity: sala.cortes[u] ? 1 : 0.35 }}>{nombre(u)} {sala.cortes[u] ? "✓" : "…"}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    async function confirmarCorte(a, b) {
      if (!a || !b) return;
      await enviarCorte(codigo, uid, a, b);
    }

    function alSoltarPuntero(e) {
      if (sala.dificultad !== "deslizar") return;
      setArrastrando(false);
      if (puntoA && puntoB) confirmarCorte(puntoA, puntoB);
    }

    function alBajarPuntero(e) {
      if (sala.dificultad !== "deslizar") return;
      const pt = puntoDesdeEvento(svgRef.current, e.clientX, e.clientY);
      setPuntoA(pt);
      setPuntoB(pt);
      setArrastrando(true);
      e.target.setPointerCapture?.(e.pointerId);
    }

    function alMoverPuntero(e) {
      if (sala.dificultad !== "deslizar" || !arrastrando) return;
      setPuntoB(puntoDesdeEvento(svgRef.current, e.clientX, e.clientY));
    }

    // ---- modo línea: manejadores arrastrables ----
    function alBajarManejador(cual) {
      return (e) => {
        e.stopPropagation();
        setManejando(cual);
      };
    }
    function alMoverEnLienzo(e) {
      if (sala.dificultad === "deslizar") return alMoverPuntero(e);
      if (!manejando) return;
      const pt = puntoDesdeEvento(svgRef.current, e.clientX, e.clientY);
      if (manejando === "a") setPuntoA(pt); else setPuntoB(pt);
    }
    function alSoltarEnLienzo(e) {
      if (sala.dificultad === "deslizar") return alSoltarPuntero(e);
      setManejando(null);
    }

    const lineaVisual = puntoA && puntoB ? lineaExtendidaVisual(puntoA, puntoB) : null;

    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 320, margin: "0 auto 10px" }}>
          <span style={{ background: "#222", color: "#888", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>Ronda {sala.ronda}/{sala.totalRondas}</span>
          <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>{yo.nombre}</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 6px" }}>
          Corta {sala.figuraActual.emoji} {sala.figuraActual.nombre}
        </h2>
        <p style={{ color: "#ffd700", fontSize: 15, fontWeight: 800, textAlign: "center", margin: "0 0 4px" }}>Objetivo: {objetivoPct}% – {100 - objetivoPct}%</p>
        <p style={{ color: "#7a7a7a", fontSize: 12, textAlign: "center", margin: "0 0 16px" }}>
          {sala.dificultad === "linea" ? "Arrastra los dos extremos de la línea" : "Desliza el dedo de un lado a otro, como un cuchillo"}
        </p>
        <FiguraSvg puntos={puntosFigura} svgRef={svgRef} onPointerDown={alBajarPuntero} onPointerMove={alMoverEnLienzo} onPointerUp={alSoltarEnLienzo}>
          {lineaVisual && (
            <line x1={lineaVisual[0][0]} y1={lineaVisual[0][1]} x2={lineaVisual[1][0]} y2={lineaVisual[1][1]} stroke="#ffd700" strokeWidth="3" />
          )}
          {sala.dificultad === "linea" && puntoA && puntoB && (
            <>
              <circle cx={puntoA[0]} cy={puntoA[1]} r="14" fill="#ffd700" opacity="0.9" onPointerDown={alBajarManejador("a")} />
              <circle cx={puntoB[0]} cy={puntoB[1]} r="14" fill="#ffd700" opacity="0.9" onPointerDown={alBajarManejador("b")} />
            </>
          )}
        </FiguraSvg>
        {sala.dificultad === "linea" && (
          <button style={{ ...S.btnGold, marginTop: 16, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }} onClick={() => confirmarCorte(puntoA, puntoB)}>
            CONFIRMAR CORTE
          </button>
        )}
        <div style={{ textAlign: "center" }}><BotonSalir /></div>
      </div>
    );
  }

  // ---------- Revelación ----------
  if (sala.fase === "revelando") {
    const objetivoPct = Math.round(sala.figuraActual.objetivo * 100);
    const puntosFigura = puntosDesdeFirestore(sala.figuraActual.puntos);
    const ordenados = [...sala.orden].sort((a, b) => sala.ultimaRonda.tabla[a].error - sala.ultimaRonda.tabla[b].error);
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 4px" }}>
          Resultados — {sala.figuraActual.emoji} {sala.figuraActual.nombre}
        </h2>
        <p style={{ color: "#ffd700", fontSize: 13, fontWeight: 700, textAlign: "center", margin: "0 0 14px" }}>Objetivo: {objetivoPct}% – {100 - objetivoPct}%</p>
        <svg viewBox={`0 0 ${LIENZO} ${LIENZO}`} style={{ width: "100%", maxWidth: 320, aspectRatio: "1/1", display: "block", margin: "0 auto 16px", background: "#000", borderRadius: 16 }}>
          <polygon points={puntosFigura.map((p) => p.join(",")).join(" ")} fill="#fff" stroke="#333" strokeWidth="2" />
          {sala.orden.map((u, i) => {
            const corte = sala.ultimaRonda.tabla[u];
            const [p1, p2] = lineaExtendidaVisual(corte.a, corte.b);
            return <line key={u} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={COLORES[i % COLORES.length]} strokeWidth="3" opacity="0.85" />;
          })}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {ordenados.map((u, i) => {
            const corte = sala.ultimaRonda.tabla[u];
            const esGanador = sala.ultimaRonda.ganadores.includes(u);
            const logradoPct = Math.round(corte.logrado * 100);
            return (
              <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111", borderRadius: 10, border: esGanador ? "1px solid #ffd700" : "1px solid #1a1a1a" }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: COLORES[sala.orden.indexOf(u) % COLORES.length], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#fff" }}>{esGanador && "👑 "}{nombre(u)}</span>
                <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>{logradoPct}% – {100 - logradoPct}%</span>
                <span style={{ fontSize: 11, color: "#7a7a7a" }}>({Math.round(corte.error * 100)}% de error)</span>
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
        const nuevoCodigo = await jugarOtraVez(codigo, uid, yo.nombre, sala.dificultad, sala.totalRondas);
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
          <div style={{ fontSize: 64, marginBottom: 4 }}>🔪</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#ffd700", margin: "0 0 2px" }}>
            {sala.orden.length > 1 ? `¡${nombre(ordenados[0])} corta mejor!` : "¡Terminaste la práctica!"}
          </h1>
          <p style={{ color: "#666", fontSize: 13, fontStyle: "italic", margin: 0 }}>{sala.totalRondas} rondas jugadas</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
          {ordenados.map((u, i) => (
            <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#111", borderRadius: 10, border: i === 0 ? "1px solid #ffd700" : "1px solid #1a1a1a" }}>
              <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}</span>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#fff" }}>{sala.jugadores[u].nombre}</span>
              <span style={{ fontSize: 13, color: "#ffd700", fontWeight: 700 }}>{sala.jugadores[u].rondasGanadas} rondas</span>
              <span style={{ fontSize: 11, color: "#7a7a7a" }}>{Math.round((sala.jugadores[u].errorTotal || 0) * 100)}% error total</span>
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
