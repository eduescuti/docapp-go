import { StyleSheet } from "react-native";

/** Tamaño de las mini cards de la tira de fechas y de la de horarios: el mismo en las dos. */
export const ANCHO_MINI_CARD = 64;
export const SEPARACION_MINI_CARDS = 8;

export const estilosMiniCard = StyleSheet.create({
  tira: { flexGrow: 0 },
  // Mini card de una fecha o de un horario.
  miniCard: { width: ANCHO_MINI_CARD, height: 80, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 4 },
});
