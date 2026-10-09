import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

export interface PaginaCarrusel {
  clave: string;
  /** Título de la sección mientras se ve esta página ("Próximo turno", "Mi plan médico"). */
  titulo: string;
  /** Para lectores de pantalla en el punto indicador ("Ver próximo turno"). */
  etiqueta: string;
  contenido: React.ReactNode;
}

interface CarruselProps {
  paginas: PaginaCarrusel[];
  /** Cada cuánto pasa sola a la siguiente página. */
  intervaloMs?: number;
  /** false: no avanza solo (p. ej. si la pantalla no está a la vista). */
  activo?: boolean;
  /** Ancho estimado antes de medir, para que el primer cuadro no se vea aplastado. */
  anchoInicial?: number;
}

/**
 * Tarjetas que se deslizan de a una (con el dedo o solas cada `intervaloMs`), con el título de la
 * página visible y puntos indicadores. Si el usuario la mueve, el avance automático espera un
 * intervalo completo. Con lector de pantalla o "reducir movimiento" no avanza sola.
 */
export function Carrusel({ paginas, intervaloMs = 4000, activo = true, anchoInicial = 0 }: CarruselProps) {
  const { theme } = useTheme();
  const scroll = useRef<ScrollView>(null);
  const desplazamientoX = useRef(new Animated.Value(0)).current;
  const [ancho, setAncho] = useState(anchoInicial);
  const [indice, setIndice] = useState(0);
  const indiceRef = useRef(0);
  const ultimaInteraccion = useRef(0);
  const [autoPermitido, setAutoPermitido] = useState(true);

  useEffect(() => {
    // En web, react-native-web responde siempre que hay lector de pantalla (no lo puede saber),
    // así que ahí solo se tiene en cuenta "reducir movimiento", que sí sale del sistema.
    const lectorActivo = Platform.OS === "web" ? Promise.resolve(false) : AccessibilityInfo.isScreenReaderEnabled();
    Promise.all([lectorActivo, AccessibilityInfo.isReduceMotionEnabled()])
      .then(([lector, reducir]) => setAutoPermitido(!lector && !reducir))
      .catch(() => setAutoPermitido(true));
  }, []);

  const irA = useCallback(
    (i: number) => {
      if (!ancho) return;
      scroll.current?.scrollTo({ x: i * ancho, animated: true });
      indiceRef.current = i;
      setIndice(i);
    },
    [ancho],
  );

  // Si cambian las páginas (aparece o desaparece el próximo turno), se vuelve a la primera.
  const claves = paginas.map((p) => p.clave).join("|");
  useEffect(() => {
    indiceRef.current = 0;
    setIndice(0);
    desplazamientoX.setValue(0);
    scroll.current?.scrollTo({ x: 0, animated: false });
  }, [claves, desplazamientoX]);

  useEffect(() => {
    if (!activo || !autoPermitido || paginas.length < 2 || !ancho) return;
    const temporizador = setInterval(() => {
      if (Date.now() - ultimaInteraccion.current < intervaloMs) return;
      irA((indiceRef.current + 1) % paginas.length);
    }, intervaloMs);
    return () => clearInterval(temporizador);
  }, [activo, autoPermitido, paginas.length, ancho, intervaloMs, irA]);

  const alDesplazar = Animated.event([{ nativeEvent: { contentOffset: { x: desplazamientoX } } }], {
    useNativeDriver: false,
    listener: (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!ancho) return;
      const i = Math.round(evento.nativeEvent.contentOffset.x / ancho);
      if (i !== indiceRef.current && i >= 0 && i < paginas.length) {
        indiceRef.current = i;
        setIndice(i);
      }
    },
  });

  const marcarInteraccion = () => {
    ultimaInteraccion.current = Date.now();
  };

  const actual = paginas[Math.min(indice, paginas.length - 1)];

  return (
    <View>
      <View style={styles.encabezado}>
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>{actual?.titulo}</Text>
        {paginas.length > 1 ? (
          <View style={styles.puntos}>
            {paginas.map((pagina, i) => {
              const rango = [(i - 1) * ancho, i * ancho, (i + 1) * ancho];
              const listo = ancho > 0;
              return (
                <Pressable
                  key={pagina.clave}
                  onPress={() => {
                    marcarInteraccion();
                    irA(i);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={pagina.etiqueta}
                  accessibilityState={{ selected: i === indice }}
                  hitSlop={{ top: 14, bottom: 14, left: 6, right: 6 }}
                >
                  <Animated.View
                    style={[
                      styles.punto,
                      listo
                        ? {
                          width: desplazamientoX.interpolate({ inputRange: rango, outputRange: [8, 20, 8], extrapolate: "clamp" }),
                          backgroundColor: desplazamientoX.interpolate({
                            inputRange: rango,
                            outputRange: [theme.colors.border, theme.colors.primary, theme.colors.border],
                            extrapolate: "clamp",
                          }),
                        }
                        : { width: i === indice ? 20 : 8, backgroundColor: i === indice ? theme.colors.primary : theme.colors.border },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View onLayout={(e) => e.nativeEvent.layout.width > 0 && setAncho(e.nativeEvent.layout.width)}>
        {paginas.length === 1 ? (
          paginas[0].contenido
        ) : (
          <Animated.ScrollView
            ref={scroll}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={alDesplazar}
            onScrollBeginDrag={marcarInteraccion}
            onTouchStart={marcarInteraccion}
          >
            {paginas.map((pagina) => (
              <View key={pagina.clave} style={{ width: ancho }}>
                {pagina.contenido}
              </View>
            ))}
          </Animated.ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Igual que SectionHeader, para que el Inicio no cambie de alto.
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  titulo: { fontSize: 18, fontWeight: "600" },
  puntos: { flexDirection: "row", alignItems: "center", gap: 6 },
  punto: { height: 8, borderRadius: 4 },
});
