import { useEffect, useRef, useState } from "react";
import { S } from "../styles.js";
import {
  avanzar, enviarReaccion, iniciarJuego, jugarOtraVez, salirDeSalaEnEspera, unirseSala,
  NUM_LUCES, MS_ENTRE_LUCES,
} from "./salaSemaforo.js";

const MARGEN_DESCONEXION_MS = 45000;

function estaConectado(visto, ahora) {
  if (!visto) return true;
  const ms = typeof visto.toMillis === "function" ? visto.toMillis() : 0;
  return ahora - ms < MARGEN_DESCONEXION_MS;
}

export default function JuegoSemaforo({ sala, uid, codigo, onSalir, onEntrarSala }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [cargandoRevancha, setCargandoRevancha] = useState(false);
  const [lucesEncendidas, setLucesEncendidas] = useState(0);
  const [apagadas, setApagadas] = useState(false);
  const [yaToque, setYaToque] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const lucesOffMsRef = useRef(null);

  useEffect(() => {
    if (sala.fase !== "espera") return;
    const t = setInterval(() => setAhora(Date.now()), 5000);
    return () => clearInterval(t);
  }, [sala.fase]);

  // Cada ronda nueva programa su propia secuencia de luces a partir de la
  // hora de inicio que guardó el servidor, para que todos los celulares
  // arranquen del mismo punto.
  useEffect(() => {
    setLucesEncendidas(0);
    setApagadas(false);
    setYaToque(false);
    lucesOffMsRef.current = null;
    if (sala.fase !== "jugando" || !sala.horaInicio) return;
    const inicioMs = sala.horaInicio.toMillis();
    const lucesOffMs = inicioMs + NUM_LUCES * MS_ENTRE_LUCES + sala.demoraMs;
    lucesOffMsRef.current = lucesOffMs;
    const timers = [];
    for (let i = 1; i <= NUM_LUCES; i++) {
      const faltan = inicioMs + i * MS_ENTRE_LUCES - Date.now();
      timers.push(setTimeout(() => setLucesEncendidas(i), Math.max(0, faltan)));
    }
    timers.push(setTimeout(() => setApagadas(true), Math.max(0, lucesOffMs - Date.now())));
    return () => timers.forEach(clearTimeout);
  }, [sala.fase, sala.ronda, sala.horaInicio, sala.demoraMs]);

  const yo = sala.jugadores[uid];
  const nombre = (u) => sala.jugadores[u]?.nombre || "?";

  async function confirmarSalir() {
    if (sala.fase === "espera") await salirDeSalaEnEspera(codigo, uid);
    onSalir();
  }

  async function copiarInvitacion() {
    const link = `${location.origin}/?juego=semaforo&codigo=${sala.codigo}`;
    const texto = `¡Únete a mi partida de Semáforo! ${link} (código: ${sala.codigo})`;
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

  function alTocar() {
    if (yaToque) return;
    setYaToque(true);
    const ahoraMs = Date.now();
    const lucesOffMs = lucesOffMsRef.current;
    const falso = !lucesOffMs || ahoraMs < lucesOffMs;
    enviarReaccion(codigo, uid, { falso, reaccionMs: falso ? null : ahoraMs - lucesOffMs });
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
            {enEspera ? "Puedes volver a entrar después con el mismo código." : "La partida ya empezó — si sales ahora, el juego puede quedarse esperando tu reacción hasta que vuelvas a entrar con el código."}
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
        <p style={{ color: "#ffd700", fontSize: 12, textAlign: "center", margin: "0 0 16px" }}>{sala.totalRondas} rondas</p>
        <button style={{ ...S.btnSm, alignSelf: "center", background: "#1a1a1a", color: "#ffd700", border: "1px solid #333", marginBottom: 20 }}
          onClick={copiarInvitacion}>{copiado ? "¡Copiado! ✓" : "📋 Copiar invitación"}</button>
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

  // ---------- Ronda en curso ----------
  if (sala.fase === "jugando") {
    const yaEnvie = !!sala.reacciones[uid];

    if (yaEnvie) {
      const listos = sala.orden.filter((u) => sala.reacciones[u]);
      return (
        <div style={S.page}>
          <div style={S.card}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#4caf50", margin: "0 0 16px" }}>¡Listo! Esperando a los demás…</h2>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 10px" }}>{listos.length} de {sala.orden.length} ya reaccionaron</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {sala.orden.map((u) => (
                <span key={u} style={{ ...S.chip, opacity: sala.reacciones[u] ? 1 : 0.35 }}>{nombre(u)} {sala.reacciones[u] ? "✓" : "…"}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const fondo = apagadas ? "#0d3d0d" : "#000";
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px", background: fondo }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 320, margin: "0 auto 10px" }}>
          <span style={{ background: "#222", color: "#888", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>Ronda {sala.ronda}/{sala.totalRondas}</span>
          <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>{yo.nombre}</span>
        </div>
        {/* Zona de toque: solo aquí cuenta como reacción, para no chocar con
            "Salir de la sala" si alguien lo toca durante una ronda activa. */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, minHeight: 300, width: "100%", touchAction: "none", userSelect: "none" }}
          onPointerDown={alTocar}
        >
          <div style={{ display: "flex", gap: 14, padding: 10, background: "#161616", borderRadius: 16 }}>
            {Array.from({ length: NUM_LUCES }).map((_, i) => (
              <div key={i} style={{
                width: 44, height: 44, borderRadius: "50%",
                background: !apagadas && i < lucesEncendidas ? "#ff2222" : "#666",
                boxShadow: !apagadas && i < lucesEncendidas ? "0 0 18px 4px rgba(255,34,34,0.7)" : "none",
                border: "2px solid #888", transition: "background 0.1s",
              }} />
            ))}
          </div>
          <p key={apagadas ? "on" : "off"} className={apagadas ? "pop-in" : ""}
            style={{ color: apagadas ? "#fff" : "#7a7a7a", fontSize: apagadas ? 22 : 14, fontWeight: apagadas ? 900 : 400, textAlign: "center", margin: 0 }}>
            {apagadas ? "¡TOCA AHORA!" : "Espera a que se apaguen las luces…"}
          </p>
        </div>
        <div style={{ textAlign: "center" }}><BotonSalir /></div>
      </div>
    );
  }

  // ---------- Revelación ----------
  if (sala.fase === "revelando") {
    const ordenados = [...sala.orden].sort((a, b) => sala.ultimaRonda.tabla[a].reaccionMs - sala.ultimaRonda.tabla[b].reaccionMs);
    return (
      <div key={sala.ronda} style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
        <h2 className="fade-rise" style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 4px" }}>
          Resultados de la ronda {sala.ronda}
        </h2>
        <p className="fade-rise" style={{ color: "#ffd700", fontSize: 13, fontWeight: 700, textAlign: "center", margin: "0 0 20px" }}>
          {sala.ultimaRonda.ganadores.length ? `👑 ${sala.ultimaRonda.ganadores.map(nombre).join(", ")}` : "Nadie reaccionó a tiempo — todos salieron en falso"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {ordenados.map((u, i) => {
            const r = sala.ultimaRonda.tabla[u];
            const esGanador = sala.ultimaRonda.ganadores.includes(u);
            return (
              <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111", borderRadius: 10, border: esGanador ? "1px solid #ffd700" : "1px solid #1a1a1a" }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#fff" }}>{esGanador && "👑 "}{nombre(u)}</span>
                {r.falso ? (
                  <span style={{ fontSize: 12, color: "#ff4444", fontWeight: 700 }}>Salida en falso 🚫</span>
                ) : (
                  <span style={{ fontSize: 13, color: "#ffd700", fontWeight: 700 }}>{r.reaccionMs} ms</span>
                )}
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
      return (j1.tiempoTotalMs || 0) - (j2.tiempoTotalMs || 0);
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
          <div className="pop-in" style={{ fontSize: 64, marginBottom: 4 }}>🚦</div>
          <h1 className="fade-rise" style={{ fontSize: 28, fontWeight: 900, color: "#ffd700", margin: "0 0 2px" }}>
            {sala.orden.length > 1 ? `¡${nombre(ordenados[0])} reacciona más rápido!` : "¡Terminaste la práctica!"}
          </h1>
          <p style={{ color: "#7a7a7a", fontSize: 13, fontStyle: "italic", margin: 0 }}>{sala.totalRondas} rondas jugadas</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
          {ordenados.map((u, i) => (
            <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#111", borderRadius: 10, border: i === 0 ? "1px solid #ffd700" : "1px solid #1a1a1a" }}>
              <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}</span>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#fff" }}>{sala.jugadores[u].nombre}</span>
              <span style={{ fontSize: 13, color: "#ffd700", fontWeight: 700 }}>{sala.jugadores[u].rondasGanadas} rondas</span>
              <span style={{ fontSize: 11, color: "#7a7a7a" }}>{sala.jugadores[u].tiempoTotalMs || 0} ms total</span>
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
