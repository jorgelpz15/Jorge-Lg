// Centraliza qué mazo de cartas usar según el idioma elegido al crear la
// sala. Se elige una sola vez, al crear la sala — mezclar cartas en español
// con cartas en inglés en la misma partida no tendría sentido.
import { WHITE_CARDS, BLACK_CARDS, STARTER_CHALLENGES, getPunishment } from "./gameData";
import { WHITE_CARDS_EN, BLACK_CARDS_EN, STARTER_CHALLENGES_EN, getPunishmentEn } from "./gameDataEn";

export function mazosPara(idioma) {
  if (idioma === "en") {
    return { WHITE: WHITE_CARDS_EN, BLACK: BLACK_CARDS_EN, STARTERS: STARTER_CHALLENGES_EN, getPunishment: getPunishmentEn };
  }
  return { WHITE: WHITE_CARDS, BLACK: BLACK_CARDS, STARTERS: STARTER_CHALLENGES, getPunishment };
}
