import { useCallback, useMemo, useRef } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent, WebViewNavigation } from "react-native-webview";

import { useTheme } from "@/theme";

import { crearHtmlMapa } from "./mapaHtml";
import { MapaCentrosProps, MensajeAlMapa } from "./tipos";
import { usePuenteMapa } from "./usePuenteMapa";

// Origen de la página del mapa. Con HTML en línea el WebView usa un origen "nulo" y Android puede
// bloquear el worker interno de MapLibre; con un origen https local funciona como en un navegador.
// No se pide nada a esta dirección: el HTML va en línea.
const ORIGEN_MAPA = "https://localhost/";

/**
 * Mapa de centros en Android/iOS: MapLibre dentro de un WebView. Anda en Expo Go y en la app
 * compilada, sin claves (la versión web es `MapaCentros.web.tsx`).
 */
export function MapaCentros(props: MapaCentrosProps) {
  const { theme } = useTheme();
  const webView = useRef<WebView>(null);

  // El HTML depende solo del tema: puntos, selección y ubicación viajan como mensajes.
  // El centro inicial se toma una sola vez para no recargar el mapa al moverse.
  const centroInicial = useRef(props.centroInicial).current;
  const interactivo = props.interactivo ?? true;
  const html = useMemo(
    () => crearHtmlMapa({ colores: theme.mapa, centro: centroInicial, interactivo }),
    [theme.mapa, centroInicial, interactivo],
  );

  const enviar = useCallback((mensaje: MensajeAlMapa) => webView.current?.postMessage(JSON.stringify(mensaje)), []);
  const { recibir } = usePuenteMapa(enviar, props, theme.id);

  // Los links de la atribución (OpenStreetMap, OpenFreeMap) se abren en el navegador, no en el mapa.
  const alNavegar = useCallback((pedido: WebViewNavigation) => {
    if (/^https?:/i.test(pedido.url) && !pedido.url.startsWith(ORIGEN_MAPA)) {
      Linking.openURL(pedido.url);
      return false;
    }
    return true;
  }, []);

  return (
    <View style={[styles.contenedor, props.style]}>
      <WebView
        key={theme.id}
        ref={webView}
        source={{ html, baseUrl: ORIGEN_MAPA }}
        originWhitelist={["*"]}
        onMessage={(evento: WebViewMessageEvent) => recibir(evento.nativeEvent.data)}
        onShouldStartLoadWithRequest={alNavegar}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        overScrollMode="never"
        style={{ backgroundColor: theme.mapa.tierra }}
        accessibilityLabel="Mapa de centros de salud. También podés verlos como lista."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, overflow: "hidden" },
});
