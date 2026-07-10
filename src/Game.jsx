import { useEffect, useState } from "react";
import { S } from "./styles";
import {
  iniciarEleccionDeInicio, elegirQuienEmpieza, enviarRespuesta, cambiarMano,
  avanzarRevelacion, iniciarVotacion, votar, enviarShot, cerrarShotActivo,
  siguienteRonda, terminarJuego, salirDeSalaEnEspera,
} from "./sala";

const MARGEN_DESCONEXION_MS = 45000; // heartbeat cada 20s (ver App.jsx), doble de margen

function estaConectado(visto, ahora) {
  if (!visto) return true; // el timestamp del servidor todavía no llega, es un jugador recién unido
  const ms = typeof visto.toMillis === "function" ? visto.toMillis() : 0;
  return ahora - ms < MARGEN_DESCONEXION_MS;
}

function renderB(text, ans) {
  const hasBlank = text.includes("_");
  if (!ans) return hasBlank ? text.replace(/_/g, "______") : text;
  if (hasBlank) {
    let ai = 0;
    const parts = text.split("_");
    return parts.map((p, i) => (
      <span key={i}>
        {p}
        {i < parts.length - 1 && ans[ai] ? <span style={S.hl}>{ans[ai++]}</span> : i < parts.length - 1 ? "______" : ""}
      </span>
    ));
  }
  return (
    <span>
      {text}{" "}
      {ans.map((a, i) => (
        <span key={i}>
          <span style={S.hl}>{a}</span>
          {i < ans.length - 1 ? " + " : ""}
        </span>
      ))}
    </span>
  );
}

function calcularRecomendacion(sala, remitente) {
  const otros = sala.orden.filter((u) => u !== remitente);
  if (!otros.length) return null;
  const segundos = (u) => sala.jugadores[u]?.segundosBebidos || 0;
  const estrellas = (u) => sala.jugadores[u]?.estrellas || 0;
  const porBebida = [...otros].sort((a, b) => segundos(a) - segundos(b));
  const masSobrio = porBebida[0];
  const masBorracho = porBebida[porBebida.length - 1];
  const porPuntaje = [...otros].sort((a, b) => estrellas(b) - estrellas(a));
  const lider = porPuntaje[0];
  if (lider && estrellas(lider) > estrellas(remitente) && segundos(lider) <= segundos(masSobrio) + 3) {
    return { uid: lider, razon: `Va ganando con ${estrellas(lider)}⭐ y solo lleva ${segundos(lider)}s bebidos. Que sufra 😈` };
  }
  if (segundos(masBorracho) > 0 && segundos(masSobrio) < segundos(masBorracho) - 5) {
    return { uid: masSobrio, razon: `Lleva ${segundos(masSobrio)}s vs ${segundos(masBorracho)}s de otros. Hay que emparejar 🍺` };
  }
  return { uid: masSobrio, razon: `Lleva solo ${segundos(masSobrio)}s bebidos — anda muy sobrio para esta hora 🧐` };
}

export default function Game({ sala, uid, codigo, onSalir }) {
  const [selected, setSelected] = useState([]);
  const [mostrarRefresh, setMostrarRefresh] = useState(false);
  const [vistaShotMgr, setVistaShotMgr] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  useEffect(() => {
    if (sala.fase !== "espera") return;
    const t = setInterval(() => setAhora(Date.now()), 5000);
    return () => clearInterval(t);
  }, [sala.fase]);

  const yo = sala.jugadores[uid];
  const nombre = (u) => sala.jugadores[u]?.nombre || "?";

  async function copiarInvitacion() {
    const link = `${location.origin}/?codigo=${sala.codigo}`;
    const texto = `¡Únete a mi partida de Cartas Contra la Humanidad! ${link} (código: ${sala.codigo})`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el navegador no dio permiso de portapapeles, no pasa nada grave */ }
  }

  async function confirmarSalir() {
    if (sala.fase === "espera") await salirDeSalaEnEspera(codigo, uid);
    onSalir();
  }

  function BotonSalir() {
    return (
      <button style={{ background: "none", border: "none", color: "#555", fontSize: 12, textDecoration: "underline", cursor: "pointer", marginTop: 18 }}
        onClick={() => setConfirmarSalida(true)}>Salir de la sala</button>
    );
  }

  function toggleCard(card) {
    const n = sala.cartaNegra?.pick || 1;
    if (selected.includes(card)) setSelected(selected.filter((c) => c !== card));
    else if (selected.length < n) setSelected([...selected, card]);
  }

  async function confirmarRespuesta() {
    const cartas = selected;
    setSelected([]);
    await enviarRespuesta(codigo, uid, cartas);
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
            {enEspera
              ? "Puedes volver a entrar después con el mismo código."
              : "La partida ya empezó — si sales ahora, el juego puede quedarse esperando tu jugada hasta que vuelvas a entrar con el código."}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnSm, flex: 1, background: "#333", color: "#aaa" }} onClick={() => setConfirmarSalida(false)}>Seguir jugando</button>
            <button style={{ ...S.btnSm, flex: 1, background: "#ff4444", color: "#fff" }} onClick={confirmarSalir}>Sí, salir</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Overlay de shot compartido (todos lo ven) ----------
  if (sala.shotActivo) {
    const { para } = sala.shotActivo;
    return (
      <div style={S.page}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>🍺</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#ff4444", margin: "0 0 8px" }}>{nombre(para)}, ¡TOMA!</h1>
          <p style={{ color: "#888", fontSize: 14, margin: "0 0 24px" }}>El grupo cuenta en voz alta</p>
          <button style={{ ...S.btnSm, background: "#222", color: "#888", width: "100%" }}
            onClick={() => cerrarShotActivo(codigo)}>Ya tomó, continuar →</button>
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
        <p style={{ color: "#666", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", textAlign: "center", margin: "0 0 4px" }}>Código de la sala</p>
        <div style={{ ...S.codeBox, alignSelf: "center" }}>{sala.codigo}</div>
        <button style={{ ...S.btnSm, alignSelf: "center", background: "#1a1a1a", color: "#ffd700", border: "1px solid #333", marginBottom: 20 }}
          onClick={copiarInvitacion}>{copiado ? "¡Copiado! ✓" : "📋 Copiar invitación"}</button>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 8px" }}>Jugadores ({conectados}/{entradas.length} conectados):</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 28 }}>
          {entradas.map(([u, j]) => {
            const online = estaConectado(j.visto, ahora);
            return (
              <div key={u} style={{ ...S.chip, justifyContent: "space-between", opacity: online ? 1 : 0.5 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  <span style={{ color: online ? "#4caf50" : "#666" }}>●</span> {j.nombre}
                  {u === sala.anfitrion && " 👑"}
                </span>
                {!online && <span style={{ color: "#888", fontSize: 11 }}>desconectado</span>}
              </div>
            );
          })}
        </div>
        <button style={{ ...S.btn, opacity: entradas.length >= 3 ? 1 : 0.3 }} disabled={entradas.length < 3}
          onClick={() => iniciarEleccionDeInicio(codigo)}>¡ARMAR JUEGO! ({entradas.length})</button>
        {entradas.length < 3 && <p style={{ color: "#555", fontSize: 11, textAlign: "center", marginTop: 8 }}>Se necesitan mínimo 3 jugadores</p>}
        <div style={{ textAlign: "center" }}><BotonSalir /></div>
      </div>
    );
  }

  // ---------- Elegir quién empieza ----------
  if (sala.fase === "inicio") {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🎲</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>¿Quién empieza?</h2>
          <div style={{ width: 36, height: 2, background: "#333", margin: "16px auto" }} />
          <p style={{ fontSize: 22, fontWeight: 900, color: "#ffd700", lineHeight: 1.3, margin: "0 0 20px" }}>{sala.retoInicial}</p>
          <p style={{ color: "#666", fontSize: 12, margin: "0 0 16px" }}>Si esto te describe a ti, toca el botón</p>
          <button style={S.btnGold} onClick={() => elegirQuienEmpieza(codigo, uid)}>¡SOY YO, EMPIEZO!</button>
          <BotonSalir />
        </div>
      </div>
    );
  }

  // ---------- Turno de juego ----------
  if (sala.fase === "jugando") {
    const yaRespondio = !!sala.respuestas[uid];
    const need = sala.cartaNegra?.pick || 1;
    const mano = yo.mano || [];

    if (yaRespondio) {
      const respondieron = sala.orden.filter((u) => sala.respuestas[u]);
      return (
        <div style={S.page}>
          <div style={S.card}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#4caf50", margin: "0 0 16px" }}>¡Listo! Esperando a los demás…</h2>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 10px" }}>{respondieron.length} de {sala.orden.length} ya jugaron</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {sala.orden.map((u) => (
                <span key={u} style={{ ...S.chip, opacity: sala.respuestas[u] ? 1 : 0.35 }}>{nombre(u)} {sala.respuestas[u] ? "✓" : "…"}</span>
              ))}
            </div>
            <BotonSalir />
          </div>
        </div>
      );
    }

    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #1a1a1a", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: sala.esRondaDorada ? "#ffd700" : "#222", color: sala.esRondaDorada ? "#000" : "#888", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>R{sala.ronda}{sala.esRondaDorada ? " ×2" : ""}</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{yo.nombre}</span>
          </div>
          <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>⭐{yo.estrellas || 0}</span>
        </div>
        <div style={{ background: sala.esRondaDorada ? "linear-gradient(135deg,#1a1500,#000)" : "#000", margin: "10px 14px", padding: "18px 16px", borderRadius: 14, border: sala.esRondaDorada ? "2px solid #ffd700" : "2px solid #333", position: "relative" }}>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>{renderB(sala.cartaNegra.text)}</p>
          {need > 1 && <span style={{ position: "absolute", bottom: 8, right: 12, background: "#fff", color: "#000", fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 5 }}>ELIGE {need}</span>}
          {sala.esRondaDorada && <span style={{ position: "absolute", top: 8, right: 12, fontSize: 16 }}>🏆</span>}
        </div>
        {need > 1 && (
          <div style={{ display: "flex", gap: 6, margin: "0 14px 6px" }}>
            {Array.from({ length: need }).map((_, i) => (
              <div key={i} style={{ flex: 1, padding: "8px 6px", borderRadius: 8, border: selected[i] ? "2px solid #ffd700" : "2px dashed #333", background: selected[i] ? "rgba(255,215,0,0.05)" : "transparent", textAlign: "center", minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: selected[i] ? "#ffd700" : "#666", fontSize: 11, fontWeight: 600 }}>{selected[i] || `Carta ${i + 1}`}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "6px 14px 14px", overflowY: "auto", maxHeight: "calc(100vh - 340px)", display: "flex", flexDirection: "column", gap: 5 }}>
            {mano.map((card, i) => {
              const sel = selected.includes(card);
              const si = selected.indexOf(card);
              return (
                <button key={i} style={{ background: sel ? "#ffd700" : "#fff", border: "none", borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer", position: "relative", display: "block", width: "100%", transform: sel ? "scale(0.97)" : "none", boxShadow: sel ? "0 0 0 3px rgba(255,215,0,0.3), 0 0 20px rgba(255,215,0,0.35)" : "0 8px 20px rgba(0,0,0,0.35)" }} onClick={() => toggleCard(card)}>
                  {sel && <span style={{ position: "absolute", top: -5, right: -3, background: "#000", color: "#ffd700", width: 20, height: 20, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{si + 1}</span>}
                  <span style={{ color: "#000", fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{card}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "10px 14px 20px", borderTop: "1px solid #1a1a1a", width: "100%", boxSizing: "border-box" }}>
          {mostrarRefresh && (
            <div style={{ background: "#1a1000", border: "1px solid #ffd700", borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>🔄 ¿Cambiar todas tus cartas?</p>
              <p style={{ color: "#aaa", fontSize: 12, margin: "0 0 10px" }}>Pierdes tus {mano.length} cartas, recibes 10 nuevas y te cuesta 1⭐</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btnSm, flex: 1, background: "#333", color: "#aaa", fontSize: 12 }} onClick={() => setMostrarRefresh(false)}>Cancelar</button>
                <button style={{ ...S.btnSm, flex: 1, background: "#ffd700", color: "#000", fontSize: 12 }} onClick={() => { cambiarMano(codigo, sala, uid); setSelected([]); setMostrarRefresh(false); }}>Sí, cambiar</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {!mostrarRefresh && <button style={{ ...S.btnSm, background: "#222", color: "#aaa", fontSize: 11, padding: "12px 10px", flex: "0 0 auto" }} onClick={() => setMostrarRefresh(true)}>🔄 -1⭐</button>}
            <button style={{ ...S.btnGold, flex: 1, opacity: selected.length === need ? 1 : 0.3 }} disabled={selected.length !== need} onClick={confirmarRespuesta}>CONFIRMAR</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Revelación ----------
  if (sala.fase === "revelando") {
    const cur = sala.revSubs[sala.revIdx];
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 4px" }}>Respuestas</h2>
        <p style={{ textAlign: "center", color: "#666", fontSize: 13, margin: "0 0 16px" }}>{sala.revIdx + 1} de {sala.revSubs.length}</p>
        <div style={{ background: "#000", padding: "22px 18px", borderRadius: 14, border: "2px solid #333", marginBottom: 16 }}>
          <p style={{ color: "#fff", fontSize: 19, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>{cur ? renderB(sala.cartaNegra.text, cur.cartas) : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.navBtn, opacity: sala.revIdx > 0 ? 1 : 0.3 }} disabled={sala.revIdx === 0} onClick={() => avanzarRevelacion(codigo, sala.revIdx - 1)}>← Anterior</button>
          {sala.revIdx < sala.revSubs.length - 1
            ? <button style={S.navBtn} onClick={() => avanzarRevelacion(codigo, sala.revIdx + 1)}>Siguiente →</button>
            : <button style={S.btnGold} onClick={() => iniciarVotacion(codigo)}>¡A VOTAR!</button>}
        </div>
      </div>
    );
  }

  // ---------- Votación ----------
  if (sala.fase === "votando") {
    const yaVote = sala.votos[uid];
    if (yaVote) {
      const votaron = Object.keys(sala.votos).length;
      return (
        <div style={S.page}>
          <div style={S.card}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🗳️</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#4caf50", margin: "0 0 10px" }}>Voto enviado, esperando a los demás…</h2>
            <p style={{ color: "#888", fontSize: 12 }}>{votaron} de {sala.orden.length} ya votaron</p>
            <BotonSalir />
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "24px 16px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 2px" }}>Vota, {yo.nombre}</h2>
        <p style={{ textAlign: "center", color: "#555", fontSize: 12, margin: "0 0 14px", fontStyle: "italic" }}>No puedes votar por ti mismo</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {sala.revSubs.map(({ uid: pUid, cartas }, i) => (
            <button key={i} style={{ background: "#111", border: "2px solid #222", borderRadius: 12, padding: 14, textAlign: "left", cursor: "pointer", opacity: pUid === uid ? 0.25 : 1, pointerEvents: pUid === uid ? "none" : "auto" }}
              onClick={() => votar(codigo, uid, pUid)}>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{renderB(sala.cartaNegra.text, cartas)}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Manda un shot (pantalla local, no cambia la fase compartida) ----------
  if (vistaShotMgr) {
    const rec = calcularRecomendacion(sala, uid);
    const objetivos = sala.orden.filter((u) => u !== uid);
    return (
      <div style={S.page}>
        <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🍺</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#ffd700", margin: "0 0 4px" }}>Manda un shot</h2>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 6px" }}>Tienes {yo.shotsDisponibles || 0} disponible{(yo.shotsDisponibles || 0) > 1 ? "s" : ""}</p>
          {rec && (
            <div style={{ background: "#1a1000", borderRadius: 10, padding: "10px 14px", border: "1px solid #333", margin: "12px 0 16px" }}>
              <p style={{ color: "#ffd700", fontSize: 11, fontWeight: 700, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 1 }}>💡 Recomendación</p>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: "0 0 2px" }}>{nombre(rec.uid)}</p>
              <p style={{ color: "#999", fontSize: 12, margin: 0 }}>{rec.razon}</p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {objetivos.map((t) => (
              <button key={t} style={{ ...S.nameBtn, border: rec?.uid === t ? "2px solid #ffd700" : "1px solid #333" }}
                onClick={() => { enviarShot(codigo, sala, uid, t); setVistaShotMgr(false); }}>
                <span>🍺 → {nombre(t)}</span>
                <span style={{ color: "#666", fontSize: 11, marginLeft: 8 }}>{sala.jugadores[t]?.segundosBebidos || 0}s bebidos</span>
                {rec?.uid === t && <span style={{ marginLeft: 4 }}>⭐</span>}
              </button>
            ))}
          </div>
          <button style={{ ...S.btnSm, marginTop: 16, background: "#222", color: "#888", width: "100%" }} onClick={() => setVistaShotMgr(false)}>Guardar para después</button>
        </div>
      </div>
    );
  }

  // ---------- Resultados ----------
  if (sala.fase === "resultados") {
    const ur = sala.ultimaRonda || { tabla: {}, ganadores: [] };
    const sorted = sala.orden.map((u) => [u, sala.jugadores[u]]).sort((a, b) => (b[1].estrellas || 0) - (a[1].estrellas || 0));
    const pendientes = sala.orden.filter((u) => (sala.jugadores[u].shotsDisponibles || 0) > 0);
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "24px 18px", gap: 12 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#888", fontSize: 12, margin: "0 0 4px" }}>Ronda {sala.ronda}{sala.esRondaDorada ? " 🏆 DORADA" : ""}</p>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#ffd700", margin: 0 }}>
            {ur.ganadores.length === 1 ? `¡${nombre(ur.ganadores[0])} gana!` : `¡Empate: ${ur.ganadores.map(nombre).join(" & ")}!`}
          </h2>
          {ur.ganadores[0] && (sala.jugadores[ur.ganadores[0]]?.racha || 0) >= 2 && <p style={{ color: "#ff6b35", fontSize: 12, fontWeight: 700, margin: "4px 0 0" }}>🔥 Racha de {sala.jugadores[ur.ganadores[0]].racha}</p>}
        </div>
        <div style={{ background: "#111", borderRadius: 12, padding: "12px 14px", border: "1px solid #222" }}>
          <p style={{ color: "#888", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px" }}>¿Quién jugó qué?</p>
          {sala.revSubs.map(({ uid: pUid, cartas }, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ color: ur.ganadores.includes(pUid) ? "#ffd700" : "#888", fontWeight: 800, fontSize: 13, minWidth: 60 }}>{nombre(pUid)}</span>
              <span style={{ color: "#aaa", fontSize: 12, lineHeight: 1.3 }}>{cartas.join(" + ")}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {sorted.map(([u, j], i) => (
            <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111", borderRadius: 10, border: i === 0 ? "1px solid #ffd700" : "1px solid #1a1a1a" }}>
              <span style={{ fontSize: 16, width: 26, textAlign: "center" }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#fff" }}>{j.nombre}</span>
              <span style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>⭐{j.estrellas || 0}</span>
              {(j.segundosBebidos || 0) > 0 && <span style={{ fontSize: 11, color: "#ff8800" }}>{j.segundosBebidos}s🍺</span>}
              {(j.racha || 0) >= 2 && <span style={{ fontSize: 11, color: "#ff6b35" }}>🔥{j.racha}</span>}
              {(j.shotsDisponibles || 0) > 0 && <span style={{ fontSize: 11, color: "#ff4444" }}>🍺{j.shotsDisponibles}</span>}
            </div>
          ))}
        </div>
        {ur.castigoQuien && (
          <div style={{ background: "linear-gradient(135deg,#1a0000,#0a0a0a)", borderRadius: 12, padding: "14px 16px", border: "1px solid #ff4444" }}>
            <p style={{ color: "#ff4444", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 6px" }}>🍺 TOMA, {nombre(ur.castigoQuien).toUpperCase()}</p>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{ur.castigoTexto}</p>
          </div>
        )}
        {pendientes.length > 0 && (
          <div style={{ background: "linear-gradient(135deg,#1a1000,#0a0a0a)", borderRadius: 12, padding: "14px 16px", border: "1px solid #ffd700" }}>
            <p style={{ color: "#ffd700", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px" }}>🍺 SHOTS DISPONIBLES</p>
            {pendientes.map((u) => {
              const j = sala.jugadores[u];
              return u === uid ? (
                <button key={u} style={{ ...S.nameBtn, marginBottom: 6, background: "#1a1000", border: "1px solid #ffd700", color: "#ffd700" }}
                  onClick={() => setVistaShotMgr(true)}>Tienes {j.shotsDisponibles} shot{j.shotsDisponibles > 1 ? "s" : ""} — MANDAR</button>
              ) : (
                <p key={u} style={{ color: "#aaa", fontSize: 13, margin: "0 0 6px" }}>{j.nombre} tiene {j.shotsDisponibles} shot{j.shotsDisponibles > 1 ? "s" : ""} pendiente{j.shotsDisponibles > 1 ? "s" : ""}</p>
              );
            })}
            <p style={{ color: "#666", fontSize: 11, margin: "6px 0 0", fontStyle: "italic" }}>Se pueden guardar para después</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn, flex: 1 }} onClick={() => siguienteRonda(codigo)}>Siguiente Ronda →</button>
          <button style={{ ...S.btnSm, background: "#1a0000", color: "#ff4444", border: "1px solid #ff4444", padding: "14px 12px" }} onClick={() => terminarJuego(codigo)}>FIN</button>
        </div>
        <div style={{ textAlign: "center" }}><BotonSalir /></div>
      </div>
    );
  }

  // ---------- Fin del juego ----------
  if (sala.fase === "fin") {
    const entries = sala.orden.map((u) => [u, sala.jugadores[u]]);
    const sorted = [...entries].sort((a, b) => (b[1].estrellas || 0) - (a[1].estrellas || 0));
    const mvp = [...entries].sort((a, b) => (b[1].votosTotales || 0) - (a[1].votosTotales || 0))[0];
    const ms = [...entries].sort((a, b) => (b[1].shotsRecibidos || 0) - (a[1].shotsRecibidos || 0))[0];
    const masBorracho = [...entries].sort((a, b) => (b[1].segundosBebidos || 0) - (a[1].segundosBebidos || 0))[0];
    const masSobrio = entries.filter(([, j]) => (j.segundosBebidos || 0) > 0).sort((a, b) => (a[1].segundosBebidos || 0) - (b[1].segundosBebidos || 0))[0];
    return (
      <div style={{ ...S.page, justifyContent: "flex-start", padding: "28px 18px", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 4 }}>🏆</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#ffd700", margin: "0 0 2px" }}>¡{sorted[0][1].nombre} gana!</h1>
          <p style={{ color: "#666", fontSize: 13, fontStyle: "italic", margin: 0 }}>La peor persona de la noche</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
          {sorted.map(([u, j], i) => (
            <div key={u} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#111", borderRadius: 10, border: i === 0 ? "1px solid #ffd700" : "1px solid #1a1a1a" }}>
              <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}</span>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#fff" }}>{j.nombre}</span>
              <span style={{ fontSize: 13, color: "#ffd700", fontWeight: 700 }}>{j.estrellas || 0} pts</span>
              <span style={{ fontSize: 11, color: "#ff8800" }}>{j.segundosBebidos || 0}s🍺</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#111", borderRadius: 12, padding: "14px 16px", border: "1px solid #222", width: "100%", boxSizing: "border-box" }}>
          <p style={{ color: "#888", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>📊 ESTADÍSTICAS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={S.statRow}><span style={S.statL}>Rondas jugadas</span><span style={S.statV}>{sala.ronda}</span></div>
            {mvp && (mvp[1].votosTotales || 0) > 0 && <div style={S.statRow}><span style={S.statL}>Favorito del público</span><span style={S.statV}>{mvp[1].nombre} ({mvp[1].votosTotales} votos)</span></div>}
            {masBorracho && (masBorracho[1].segundosBebidos || 0) > 0 && <div style={S.statRow}><span style={S.statL}>Más pedo 🥴</span><span style={S.statV}>{masBorracho[1].nombre} ({masBorracho[1].segundosBebidos}s bebidos)</span></div>}
            {masSobrio && <div style={S.statRow}><span style={S.statL}>Más sobrio 🧐</span><span style={S.statV}>{masSobrio[1].nombre} ({masSobrio[1].segundosBebidos}s bebidos)</span></div>}
            {ms && (ms[1].shotsRecibidos || 0) > 0 && <div style={S.statRow}><span style={S.statL}>Más shots recibidos 💀</span><span style={S.statV}>{ms[1].nombre} ({ms[1].shotsRecibidos})</span></div>}
            {entries.map(([u, j]) => {
              const s = Object.values(j.shotsEnviados || {}).reduce((a, b) => a + b, 0);
              return s > 0 ? <div key={u} style={S.statRow}><span style={S.statL}>{j.nombre} mandó</span><span style={S.statV}>{s} shot{s > 1 ? "s" : ""}</span></div> : null;
            })}
          </div>
        </div>
        <button style={S.btn} onClick={onSalir}>Salir a inicio</button>
      </div>
    );
  }

  return null;
}
