import type { StyleProp, ViewStyle } from "react-native";

export interface VisorPdfProps {
  /** PDF como string binario (un carácter por byte). */
  datos: string;
  /** 1 = ancho de la pantalla. */
  zoom: number;
  onListo?: () => void;
  onError?: (detalle: string) => void;
  style?: StyleProp<ViewStyle>;
}

export type MensajeDelVisor = { tipo: "listo" } | { tipo: "error"; detalle: string };

export function parsearMensajeDelVisor(dato: unknown): MensajeDelVisor | null {
  let valor: unknown = dato;
  if (typeof dato === "string") {
    try {
      valor = JSON.parse(dato);
    } catch {
      return null;
    }
  }
  if (typeof valor !== "object" || valor === null) return null;
  const mensaje = valor as Record<string, unknown>;
  if (mensaje.tipo === "listo") return { tipo: "listo" };
  if (mensaje.tipo === "error") return { tipo: "error", detalle: String(mensaje.detalle ?? "") };
  return null;
}
