import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  /** false: no interactivo si la pantalla no está a la vista. */
  activo?: boolean;
  /** Ancho estimado antes de medir, para que el primer cuadro no se vea aplastado. */
  anchoInicial?: number;
}

const ESPACIO_ASOMADO = 36; // Cantidad de píxeles que asoma la tarjeta siguiente
const GAP = 12; // Separación horizontal entre tarjetas

export function Carrusel({ paginas, anchoInicial = 0 }: CarruselProps) {
  const { theme } = useTheme();
  const scroll = useRef<ScrollView>(null);
  const desplazamientoX = useRef(new Animated.Value(0)).current;
  const [anchoContenedor, setAnchoContenedor] = useState(anchoInicial);
  const [indice, setIndice] = useState(0);
  const indiceRef = useRef(0);

  // Si hay más de una tarjeta, le restamos espacio para que asome la que sigue
  const tieneVarias = paginas.length > 1;
  const anchoTarjeta = tieneVarias && anchoContenedor > 0
    ? anchoContenedor - ESPACIO_ASOMADO
    : anchoContenedor;
  const pasoScroll = anchoTarjeta + GAP;

  const irA = useCallback(
    (i: number) => {
      if (!pasoScroll) return;
      scroll.current?.scrollTo({ x: i * pasoScroll, animated: true });
      indiceRef.current = i;
      setIndice(i);
    },
    [pasoScroll],
  );

  // Si cambian las páginas (aparece o desaparece un turno), volvemos a la primera.
  const claves = paginas.map((p) => p.clave).join("|");
  useEffect(() => {
    indiceRef.current = 0;
    setIndice(0);
    desplazamientoX.setValue(0);
    scroll.current?.scrollTo({ x: 0, animated: false });
  }, [claves, desplazamientoX]);

  const alDesplazar = Animated.event(
    [{ nativeEvent: { contentOffset: { x: desplazamientoX } } }],
    {
      useNativeDriver: false,
      listener: (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!pasoScroll) return;
        const i = Math.round(evento.nativeEvent.contentOffset.x / pasoScroll);
        if (i !== indiceRef.current && i >= 0 && i < paginas.length) {
          indiceRef.current = i;
          setIndice(i);
        }
      },
    },
  );

  const actual = paginas[Math.min(indice, paginas.length - 1)];

  return (
    <View>
      <View style={styles.encabezado}>
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>
          {actual?.titulo}
        </Text>
        {paginas.length > 1 ? (
          <View style={styles.puntos}>
            {paginas.map((pagina, i) => {
              const rango = [(i - 1) * pasoScroll, i * pasoScroll, (i + 1) * pasoScroll];
              const listo = pasoScroll > 0;
              return (
                <Pressable
                  key={pagina.clave}
                  onPress={() => irA(i)}
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
                            width: desplazamientoX.interpolate({
                              inputRange: rango,
                              outputRange: [8, 20, 8],
                              extrapolate: "clamp",
                            }),
                            backgroundColor: desplazamientoX.interpolate({
                              inputRange: rango,
                              outputRange: [theme.colors.border, theme.colors.primary, theme.colors.border],
                              extrapolate: "clamp",
                            }),
                          }
                        : {
                            width: i === indice ? 20 : 8,
                            backgroundColor: i === indice ? theme.colors.primary : theme.colors.border,
                          },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View onLayout={(e) => e.nativeEvent.layout.width > 0 && setAnchoContenedor(e.nativeEvent.layout.width)}>
        {paginas.length === 1 ? (
          paginas[0].contenido
        ) : (
          <Animated.ScrollView
            ref={scroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={pasoScroll}
            snapToAlignment="start"
            contentContainerStyle={{ paddingRight: ESPACIO_ASOMADO }}
            scrollEventThrottle={16}
            onScroll={alDesplazar}
          >
            {paginas.map((pagina, i) => (
              <View
                key={pagina.clave}
                style={{
                  width: anchoTarjeta,
                  marginRight: i === paginas.length - 1 ? 0 : GAP,
                }}
              >
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
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "600",
  },
  puntos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  punto: {
    height: 8,
    borderRadius: 4,
  },
});