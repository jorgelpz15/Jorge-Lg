// Cloudflare Pages Function para la ruta "/". Los rastreadores de WhatsApp,
// etc. no ejecutan JavaScript, así que la vista previa de un link de
// invitación (/?juego=rocola&codigo=1234) se arma aquí: si trae un código
// válido, cambia las etiquetas Open Graph por las del juego invitado. Sin
// código (o ante cualquier fallo) se sirve el index.html normal.
const JUEGOS = {
  cah: { nombre: "Cartas Contra la Humanidad", frase: "humor negro, cada quien desde su celular" },
  rebanar: { nombre: "A Rebanar", frase: "corta la figura lo más cerca del porcentaje" },
  semaforo: { nombre: "Semáforo", frase: "toca en cuanto se apaguen las luces" },
  dados: { nombre: "Dados", frase: "tira dados y todos ven el mismo resultado" },
  pontepedo: { nombre: "Ponte Pedo", frase: "saca una carta y cumple el reto que te toque" },
  rocola: { nombre: "Rocola", frase: "adivina en qué año salió la canción" },
};

function fijarMeta(html, propiedad, valor) {
  const re = new RegExp(`(<meta [^>]*?(?:property|name)="${propiedad}" content=")[^"]*(")`);
  return html.replace(re, (_, a, b) => a + valor + b);
}

export async function onRequest({ request, env }) {
  const respuesta = await env.ASSETS.fetch(request);
  try {
    const url = new URL(request.url);
    const codigo = url.searchParams.get("codigo");
    const tipo = respuesta.headers.get("content-type") || "";
    if (!codigo || !/^\d{4}$/.test(codigo) || !tipo.includes("text/html")) return respuesta;

    const id = Object.hasOwn(JUEGOS, url.searchParams.get("juego")) ? url.searchParams.get("juego") : "cah";
    const juego = JUEGOS[id];
    let html = await respuesta.text();
    html = fijarMeta(html, "og:title", `Te invitaron a jugar ${juego.nombre}`);
    html = fijarMeta(html, "og:description", `Entra con el código ${codigo}: ${juego.frase}. Sin instalar nada.`);
    html = fijarMeta(html, "og:image", `${url.origin}/og/${id}.png`);
    html = fijarMeta(html, "og:url", `${url.origin}/?juego=${id}&codigo=${codigo}`);

    const headers = new Headers(respuesta.headers);
    headers.delete("content-length");
    headers.delete("etag");
    headers.set("cache-control", "no-cache");
    return new Response(html, { status: respuesta.status, headers });
  } catch {
    return respuesta;
  }
}
