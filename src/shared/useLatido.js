import { useEffect, useRef } from "react";
import { LATIDO_MS } from "./presencia.js";

// Avisa "sigo aquí" cada LATIDO_MS mientras `activo`. Se pausa si la pestaña
// está oculta (pantalla apagada) y al volver manda un latido de inmediato.
export function useLatido(activo, latir) {
  const latirRef = useRef(latir);
  latirRef.current = latir;

  useEffect(() => {
    if (!activo) return;
    let timer = null;
    const latido = () => { Promise.resolve(latirRef.current()).catch(() => {}); };
    const arrancar = () => { if (!timer) timer = setInterval(latido, LATIDO_MS); };
    const parar = () => { clearInterval(timer); timer = null; };
    const alCambiarVisibilidad = () => {
      if (document.hidden) parar();
      else { latido(); arrancar(); }
    };
    if (!document.hidden) arrancar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      parar();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [activo]);
}
