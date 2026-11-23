// Datos de marca del hub. Cambiar aquí el nombre o el número y se actualiza el pie del menú.
export const MARCA_NOMBRE = "FulmIA Studio";
// WhatsApp con código de país y sin signos ni espacios, p. ej. "5215512345678". Vacío = no se muestra el botón.
export const WHATSAPP_NUMERO = "524497698573";
export const WHATSAPP_MENSAJE = "Hola! Vi tu página de Juegos con Amigos, de FulmIA Studio. ¿Pueden hacerme algo parecido para mi negocio?";

export function linkWhatsApp() {
  if (!/^\d{10,15}$/.test(WHATSAPP_NUMERO)) return null;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`;
}
