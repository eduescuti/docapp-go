import type { StyleProp, ViewStyle } from "react-native";

import type { TipoInstitucion } from "@/domain";
import type { Coordenada } from "@/hooks/useUbicacion";

/** Un marcador del mapa. Solo viaja lo necesario para dibujarlo; el resto queda en la pantalla. */
export interface PuntoMapa {
  id: string;
  latitud: number;
  longitud: number;
  tipo: TipoInstitucion;
}

/** Pedido para mover la cámara. `id` distinto en cada pedido, aunque se repita el destino. */
export interface PedidoVuelo {
  id: number;
  coordenada: Coordenada;
  zoom?: number;
}

export interface MapaCentrosProps {
  puntos: PuntoMapa[];
  seleccionadoId: string | null;
  /** Ubicación real del paciente (punto azul). Null si no dio permiso. */
  ubicacion: Coordenada | null;
  /** Dónde arranca la cámara. Solo se usa al cargar el mapa. */
  centroInicial: Coordenada;
  volarA?: PedidoVuelo | null;
  onSeleccionar: (id: string | null) => void;
  /** El mapa no cargó (sin internet, proveedor caído...). La pantalla ofrece la lista. */
  onError?: (detalle: string) => void;
  /** El mapa terminó de cargar (también si antes se había informado un error por demora). */
  onListo?: () => void;
  /** Alto de lo que la pantalla dibuja encima del mapa abajo, para no tapar la atribución. */
  margenInferior?: number;
  /** false: vista previa sin gestos ni toques (Inicio). Por defecto, true. */
  interactivo?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Mensajes de la app al mapa (WebView o iframe). */
export type MensajeAlMapa =
  | { tipo: "puntos"; puntos: PuntoMapa[] }
  | { tipo: "seleccion"; id: string | null }
  | { tipo: "ubicacion"; coordenada: Coordenada | null }
  | { tipo: "volar"; coordenada: Coordenada; zoom?: number }
  | { tipo: "margenes"; inferior: number };

/** Mensajes del mapa a la app. */
export type MensajeDelMapa = { tipo: "listo" } | { tipo: "seleccion"; id: string | null } | { tipo: "error"; detalle: string };

/** Valida lo que llega del WebView: es texto de otro contexto, no se confía en su forma. */
export function parsearMensajeDelMapa(dato: unknown): MensajeDelMapa | null {
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
  if (mensaje.tipo === "seleccion" && (typeof mensaje.id === "string" || mensaje.id === null)) {
    return { tipo: "seleccion", id: mensaje.id };
  }
  if (mensaje.tipo === "error") return { tipo: "error", detalle: String(mensaje.detalle ?? "") };
  return null;
}
