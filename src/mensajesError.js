// Mensajes de error al unirse a una sala — compartidos por los 5 lobbies
// (antes estaban copiados literal en cada uno; ver crítica impeccable
// 2026-08-15). Hay dos variantes porque CAH/Semáforo/A Rebanar tienen fase
// "jugando" (no se puede entrar a medio juego) y tope de 8, mientras que
// Dados/Ponte Pedo no tienen concepto de turno y admiten hasta 12.
export const MENSAJES_ERROR_TURNO = {
  SALA_NO_EXISTE: "Ese código no existe. Revísalo con quien creó la sala.",
  SALA_YA_EMPEZO: "Esa partida ya empezó. Pide que armen una nueva sala.",
  SALA_LLENA: "Esa sala ya tiene 8 jugadores (el máximo).",
  NOMBRE_REPETIDO: "Ya hay alguien con ese nombre en la sala, usa otro.",
};

export const MENSAJES_ERROR_LIBRE = {
  SALA_NO_EXISTE: "Ese código no existe. Revísalo con quien creó la sala.",
  SALA_LLENA: "Esa sala ya tiene 12 jugadores (el máximo).",
  NOMBRE_REPETIDO: "Ya hay alguien con ese nombre en la sala, usa otro.",
};
