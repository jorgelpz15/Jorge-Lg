// Pantalla de carga: el dado del logo con un par de destellos. Solo CSS
// (ver .cargando-dado en index.css), sin animar nada con prefers-reduced-motion.
function Destello({ x, y, size, delay }) {
  return (
    <svg className="cargando-destello" style={{ left: x, top: y, width: size, height: size, animationDelay: delay }}
      viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 0 L12.2 7.8 L20 10 L12.2 12.2 L10 20 L7.8 12.2 L0 10 L7.8 7.8 Z" fill="#ffd700" />
    </svg>
  );
}

export default function CargandoDado({ texto = "Cargando…" }) {
  return (
    <div role="status" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <svg className="cargando-dado" viewBox="0 0 64 64" width="96" height="96" aria-hidden="true">
          <rect x="9" y="9" width="46" height="46" rx="9" fill="#ffd700" />
          <g fill="#0a0a0a">
            <circle cx="21" cy="21" r="5.2" /><circle cx="43" cy="21" r="5.2" /><circle cx="32" cy="32" r="5.2" />
            <circle cx="21" cy="43" r="5.2" /><circle cx="43" cy="43" r="5.2" />
          </g>
        </svg>
        <Destello x={-14} y={2} size={16} delay="0s" />
        <Destello x={92} y={-6} size={22} delay="0.5s" />
        <Destello x={88} y={78} size={13} delay="1s" />
      </div>
      <p style={{ color: "#7a7a7a", fontSize: 13, margin: 0 }}>{texto}</p>
    </div>
  );
}
