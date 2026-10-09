import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent, WebViewNavigation } from "react-native-webview";

import { useTheme } from "@/theme";

import { parsearMensajeDelVisor, VisorPdfProps } from "./tipos";
import { crearHtmlVisorPdf } from "./visorPdfHtml";

// Origen https local por el mismo motivo que el mapa: el worker de pdf.js se crea desde un Blob.
const ORIGEN_VISOR = "https://localhost/";

/** Visor de PDF en Android/iOS: pdf.js dentro de un WebView (la versión web es `VisorPdf.web.tsx`). */
export function VisorPdf({ datos, zoom, onListo, onError, style }: VisorPdfProps) {
  const { theme } = useTheme();
  const webView = useRef<WebView>(null);
  const [listo, setListo] = useState(false);
  const html = useMemo(() => crearHtmlVisorPdf({ datos, fondo: theme.colors.muted }), [datos, theme.colors.muted]);

  useEffect(() => {
    if (listo) webView.current?.postMessage(JSON.stringify({ tipo: "zoom", valor: zoom }));
  }, [listo, zoom]);

  const alMensaje = useCallback(
    (evento: WebViewMessageEvent) => {
      const mensaje = parsearMensajeDelVisor(evento.nativeEvent.data);
      if (mensaje?.tipo === "listo") {
        setListo(true);
        onListo?.();
      } else if (mensaje?.tipo === "error") {
        onError?.(mensaje.detalle);
      }
    },
    [onListo, onError],
  );

  // El visor no navega a ningún lado: solo se permite la carga inicial.
  const alNavegar = useCallback((pedido: WebViewNavigation) => !/^https?:/i.test(pedido.url) || pedido.url.startsWith(ORIGEN_VISOR), []);

  return (
    <View style={[styles.contenedor, style]}>
      <WebView
        ref={webView}
        source={{ html, baseUrl: ORIGEN_VISOR }}
        originWhitelist={["*"]}
        onMessage={alMensaje}
        onShouldStartLoadWithRequest={alNavegar}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        setBuiltInZoomControls
        setDisplayZoomControls={false}
        style={{ backgroundColor: theme.colors.muted }}
        accessibilityLabel="Visor del estudio en PDF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, overflow: "hidden" },
});
