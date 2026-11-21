// Enlace discreto "Salir de la sala" con área táctil de 44 px (antes eran
// ~16 px de alto) y fuera del render de cada juego para no remontarse con
// cada snapshot de Firestore.
export const estiloEnlaceDiscreto = {
  background: "none", border: "none", color: "#8a8a8a", fontSize: 13, textDecoration: "underline",
  cursor: "pointer", minHeight: 44, padding: "12px 16px",
};

export default function BotonSalir({ onClick, texto = "Salir de la sala" }) {
  return <button style={{ ...estiloEnlaceDiscreto, marginTop: 6 }} onClick={onClick}>{texto}</button>;
}
