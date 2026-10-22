import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useTheme } from "@/theme";
import { marcarPistaMostrada, pistaYaMostrada } from "@/utils/pistaCarrusel";
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
  /** false: la pantalla no está a la vista y la pista de deslizamiento no corre. */
  activo?: boolean;
  /** Ancho estimado antes de medir, para que el primer cuadro no se vea aplastado. */
  anchoInicial?: number;
}

/** Cuánto se corren las tarjetas durante la pista, en px. */
const PISTA_DESPLAZAMIENTO = 36;
/** Separación entre tarjetas: en reposo la siguiente queda fuera de la vista y durante la pista asoma separada. */
const SEPARACION = 16;
/** Espera en el Inicio antes de mostrar la pista. */
const PISTA_ESPERA_MS = 1000;
// Lento y con arranque y frenado suaves: tiene que insinuar que se puede deslizar, no llamar la atención.
const PISTA_IDA_MS = 600;
const PISTA_VUELTA_MS = 600;
const PISTA_PAUSA_MS = 250;

// react-native-web no convierte `snapToInterval` en scroll-snap: sin esto, en web una tarjeta podía
// quedar a medio camino dejando ver un pedazo de la otra. En el celular se encarga `snapToInterval`.
const snapWeb = Platform.OS === "web" ? ({ scrollSnapType: "x mandatory" } as object) : undefined;
const alineacionWeb = Platform.OS === "web" ? ({ scrollSnapAlign: "start" } as object) : undefined;


/**
 * Tarjetas que se deslizan de a una (con el dedo o con los puntos), con el título de la página
 * visible y puntos indicadores. No avanza sola: como indicio de que se puede deslizar, una única
 * vez, a 1 s de entrar al Inicio, la primera tarjeta se corre un poquito dos veces hacia la
 * siguiente (la del plan médico) y vuelve.
 */
export function Carrusel({ paginas, activo = true, anchoInicial = 0 }: CarruselProps) {
  const { theme } = useTheme();
  const scroll = useRef<ScrollView>(null);
  const desplazamientoX = useRef(new Animated.Value(0)).current;
  // Desplazamiento visual de la pista (negativo = las tarjetas se corren a la izquierda).
  const pistaX = useRef(new Animated.Value(0)).current;
  const [ancho, setAncho] = useState(anchoInicial);
  const [indice, setIndice] = useState(0);
  const indiceRef = useRef(0);

  // Lo que hay que desplazar para pasar de una tarjeta a la siguiente: su ancho más la separación.
  const paso = ancho + SEPARACION;

  const irA = useCallback(
    (i: number) => {
      if (!ancho) return;
      scroll.current?.scrollTo({ x: i * paso, animated: true });
      indiceRef.current = i;
      setIndice(i);
    },
    [ancho, paso],
  );

  // Si cambian las páginas (aparece o desaparece el próximo turno), se vuelve a la primera.
  const claves = paginas.map((p) => p.clave).join("|");
  useEffect(() => {
    indiceRef.current = 0;
    setIndice(0);
    desplazamientoX.setValue(0);
    scroll.current?.scrollTo({ x: 0, animated: false });
  }, [claves, desplazamientoX]);

  // Pista de deslizamiento: una sola vez, 1 s después de que el Inicio queda a la vista.
  const hayVarias = paginas.length > 1;
  const animacionPista = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (!activo || !hayVarias || !ancho || pistaYaMostrada()) return;
    let cancelado = false;
    const temporizador = setTimeout(async () => {
      // Con "reducir movimiento" activado no se anima nada.
      const reducir = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (cancelado) return;
      marcarPistaMostrada();
      if (reducir) return;
      const sacudida = [
        Animated.timing(pistaX, {
          toValue: -PISTA_DESPLAZAMIENTO,
          duration: PISTA_IDA_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pistaX, {
          toValue: 0,
          duration: PISTA_VUELTA_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.delay(PISTA_PAUSA_MS),
      ];
      animacionPista.current = Animated.sequence([...sacudida, ...sacudida]);
      animacionPista.current.start();
    }, PISTA_ESPERA_MS);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [activo, hayVarias, ancho, pistaX]);

  // Si el usuario toca el carrusel mientras corre la pista, la pista se corta.
  const cortarPista = () => {
    animacionPista.current?.stop();
    pistaX.setValue(0);
  };

  const alDesplazar = Animated.event([{ nativeEvent: { contentOffset: { x: desplazamientoX } } }], {
    useNativeDriver: false,
    listener: (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!ancho) return;
      const i = Math.round(evento.nativeEvent.contentOffset.x / paso);
      if (i !== indiceRef.current && i >= 0 && i < paginas.length) {
        indiceRef.current = i;
        setIndice(i);
      }
    },
  });

  const actual = paginas[Math.min(indice, paginas.length - 1)];

  return (
    <View>
      <View style={styles.encabezado}>
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>{actual?.titulo}</Text>
        {paginas.length > 1 ? (
          <View style={styles.puntos}>
            {paginas.map((pagina, i) => {
              const rango = [(i - 1) * paso, i * paso, (i + 1) * paso];
              const listo = ancho > 0;
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
            style={snapWeb}
            snapToInterval={paso}
            snapToAlignment="start"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={alDesplazar}
            onScrollBeginDrag={cortarPista}
            onTouchStart={cortarPista}
          >
            {paginas.map((pagina, i) => (
              // La pista corre las tarjetas con una transformación (no con el scroll) y el punto de snap
              // queda en el contenedor de afuera, que no se mueve, para que la pista no lo altere.
              <View
                key={pagina.clave}
                style={[{ width: ancho, marginRight: i === paginas.length - 1 ? 0 : SEPARACION }, alineacionWeb]}
              >
                <Animated.View style={{ transform: [{ translateX: pistaX }] }}>{pagina.contenido}</Animated.View>
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
