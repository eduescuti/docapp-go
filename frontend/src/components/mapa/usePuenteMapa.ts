import { useCallback, useEffect, useRef, useState } from "react";

import { MapaCentrosProps, MensajeAlMapa, parsearMensajeDelMapa } from "./tipos";

/** Si el mapa no avisa que cargó en este tiempo, se considera caído (sin internet, proveedor caído...). */
const ESPERA_MAXIMA_MS = 15000;

/**
 * Lógica compartida entre el WebView (celular) y el iframe (web): manda puntos, selección,
 * ubicación y vuelos cuando el mapa está listo, y traduce lo que el mapa responde.
 * `clave` cambia cuando se recarga la página del mapa (por ejemplo, al cambiar el tema).
 */
export function usePuenteMapa(enviar: (mensaje: MensajeAlMapa) => void, props: MapaCentrosProps, clave: string) {
  const { puntos, seleccionadoId, ubicacion, volarA, margenInferior } = props;
  const [listo, setListo] = useState(false);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    setListo(false);
  }, [clave]);

  useEffect(() => {
    if (listo) return;
    const espera = setTimeout(() => callbacks.current.onError?.("El mapa tardó demasiado en cargar."), ESPERA_MAXIMA_MS);
    return () => clearTimeout(espera);
  }, [listo, clave]);

  useEffect(() => {
    if (listo) enviar({ tipo: "puntos", puntos });
  }, [listo, puntos, enviar]);

  useEffect(() => {
    if (listo) enviar({ tipo: "ubicacion", coordenada: ubicacion });
  }, [listo, ubicacion, enviar]);

  useEffect(() => {
    if (listo) enviar({ tipo: "seleccion", id: seleccionadoId });
  }, [listo, seleccionadoId, enviar]);

  useEffect(() => {
    if (listo && volarA) enviar({ tipo: "volar", coordenada: volarA.coordenada, zoom: volarA.zoom });
  }, [listo, volarA, enviar]);

  useEffect(() => {
    if (listo) enviar({ tipo: "margenes", inferior: margenInferior ?? 0 });
  }, [listo, margenInferior, enviar]);

  const recibir = useCallback((dato: unknown) => {
    const mensaje = parsearMensajeDelMapa(dato);
    if (!mensaje) return;
    if (mensaje.tipo === "listo") {
      setListo(true);
      callbacks.current.onListo?.();
    } else if (mensaje.tipo === "seleccion") {
      callbacks.current.onSeleccionar(mensaje.id);
    } else {
      callbacks.current.onError?.(mensaje.detalle);
    }
  }, []);

  return { listo, recibir };
}
