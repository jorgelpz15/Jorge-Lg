import { S } from "../styles.js";
import { escucharSala, latirPresencia } from "./salaRocola.js";
import { useSalaSession } from "../shared/useSalaSession.js";
import LobbyRocola from "./LobbyRocola.jsx";
import JuegoRocola from "./JuegoRocola.jsx";

const CLAVE_LOCAL = "rocola_sesion";

export default function RocolaApp({ uid, onVolverAlMenu, codigoInicial }) {
  const { codigo, sala, handleEntrar, handleSalir } = useSalaSession({
    claveLocal: CLAVE_LOCAL, escucharSala, latirPresencia, uid, codigoInicial,
  });

  if (!codigo) {
    return <LobbyRocola uid={uid} onEntrar={handleEntrar} onVolverAlMenu={onVolverAlMenu} codigoInicial={codigoInicial} />;
  }
  if (!sala) {
    return (
      <div style={S.page}>
        <p style={{ color: "#7a7a7a", fontSize: 13 }}>Entrando a la sala…</p>
      </div>
    );
  }
  return <JuegoRocola sala={sala} uid={uid} codigo={codigo} onSalir={handleSalir} onEntrarSala={handleEntrar} />;
}
