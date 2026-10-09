import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

import { crearHtmlMapa } from "./mapaHtml";
import { MapaCentrosProps, MensajeAlMapa } from "./tipos";
import { usePuenteMapa } from "./usePuenteMapa";

/**
 * Mapa de centros en web: la misma página de MapLibre que usa el celular, dentro de un <iframe>.
 * Excepción aprobada a "sin etiquetas HTML" (CLAUDE.md §2): solo en este archivo, que Expo usa
 * únicamente en el navegador.
 */
export function MapaCentros(props: MapaCentrosProps) {
  const { theme } = useTheme();
  const iframe = useRef<HTMLIFrameElement>(null);

  const centroInicial = useRef(props.centroInicial).current;
  const interactivo = props.interactivo ?? true;
  const html = useMemo(
    () => crearHtmlMapa({ colores: theme.mapa, centro: centroInicial, interactivo }),
    [theme.mapa, centroInicial, interactivo],
  );

  const enviar = useCallback(
    (mensaje: MensajeAlMapa) => iframe.current?.contentWindow?.postMessage(JSON.stringify(mensaje), "*"),
    [],
  );
  const { recibir } = usePuenteMapa(enviar, props, theme.id);

  useEffect(() => {
    // Solo se escuchan los mensajes que manda este iframe.
    const escuchar = (evento: MessageEvent) => {
      if (evento.source === iframe.current?.contentWindow) recibir(evento.data);
    };
    window.addEventListener("message", escuchar);
    return () => window.removeEventListener("message", escuchar);
  }, [recibir]);

  return (
    <View style={[styles.contenedor, props.style]} accessibilityLabel="Mapa de centros de salud. También podés verlos como lista.">
      <iframe
        key={theme.id}
        ref={iframe}
        srcDoc={html}
        title="Mapa de centros de salud"
        style={{ border: 0, width: "100%", height: "100%", display: "block", backgroundColor: theme.mapa.tierra }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, overflow: "hidden" },
});
