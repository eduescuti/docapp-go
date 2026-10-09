import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

import { parsearMensajeDelVisor, VisorPdfProps } from "./tipos";
import { crearHtmlVisorPdf } from "./visorPdfHtml";

/**
 * Visor de PDF en web: la misma página de pdf.js dentro de un <iframe>. Misma excepción a "sin
 * etiquetas HTML" que el mapa (CLAUDE.md §2): solo en este archivo, que Expo usa en el navegador.
 */
export function VisorPdf({ datos, zoom, onListo, onError, style }: VisorPdfProps) {
  const { theme } = useTheme();
  const iframe = useRef<HTMLIFrameElement>(null);
  const [listo, setListo] = useState(false);
  const html = useMemo(() => crearHtmlVisorPdf({ datos, fondo: theme.colors.muted }), [datos, theme.colors.muted]);
  const callbacks = useRef({ onListo, onError });
  callbacks.current = { onListo, onError };

  useEffect(() => {
    if (listo) iframe.current?.contentWindow?.postMessage(JSON.stringify({ tipo: "zoom", valor: zoom }), "*");
  }, [listo, zoom]);

  useEffect(() => {
    const escuchar = (evento: MessageEvent) => {
      if (evento.source !== iframe.current?.contentWindow) return;
      const mensaje = parsearMensajeDelVisor(evento.data);
      if (mensaje?.tipo === "listo") {
        setListo(true);
        callbacks.current.onListo?.();
      } else if (mensaje?.tipo === "error") {
        callbacks.current.onError?.(mensaje.detalle);
      }
    };
    window.addEventListener("message", escuchar);
    return () => window.removeEventListener("message", escuchar);
  }, []);

  return (
    <View style={[styles.contenedor, style]} accessibilityLabel="Visor del estudio en PDF">
      <iframe
        ref={iframe}
        srcDoc={html}
        title="Visor del estudio en PDF"
        style={{ border: 0, width: "100%", height: "100%", display: "block", backgroundColor: theme.colors.muted }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, overflow: "hidden" },
});
