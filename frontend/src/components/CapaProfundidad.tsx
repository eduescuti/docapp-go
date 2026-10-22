import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";
import { useRoute } from "expo-router";
import { useNavigationState } from "expo-router/react-navigation";

import { useTheme } from "@/theme";

/** Escala de la pantalla que quedó abajo (se achica apenas, como si retrocediera). */
const ESCALA_ATRAS = 0.95;
/** Cuánto se aclara la pantalla que quedó abajo (0 = nada, 1 = desaparece en el color de fondo). No se oscurece. */
const VELO_ATRAS = 0.45;
/** Parecida a la de la animación nativa de la pantalla que entra y sale, para que se muevan juntas. */
const DURACION_MS = 300;

/**
 * Envuelve el contenido de cada pantalla de un stack. Cuando se abre otra pantalla encima, esta retrocede en
 * profundidad: se achica un poco y se aclara; al volver, regresa. No hay sombra ni oscurecimiento. Usa solo
 * animaciones nativas (escala y opacidad), sin pasar por JS cuadro a cuadro.
 *
 * Aclarar se hace con un velo del color de fondo por encima, NO bajando la opacidad del contenido: en Android
 * una vista con opacidad menor a 1 se dibuja en una capa aparte y las sombras (elevación) de los botones y
 * tarjetas de adentro se veían como bordes grises hasta que terminaba la animación.
 *
 * Solo en Android: en iOS el stack nativo ya mueve la pantalla de abajo. Y en Android hace falta porque, para
 * que al volver no se vea la pantalla en blanco, la de abajo se deja montada y quieta (ver `OPCIONES_STACK`),
 * y quieta la transición se veía plana.
 */
export function CapaProfundidad({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const ruta = useRoute();
  // ¿Hay otra pantalla abierta encima de esta, en el mismo stack?
  const cubierta = useNavigationState((estado: { index: number; routes: { key: string }[] }) => {
    const posicion = estado.routes.findIndex((r) => r.key === ruta.key);
    return posicion >= 0 && estado.index > posicion;
  });

  const progreso = useRef(new Animated.Value(cubierta ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(progreso, {
      toValue: cubierta ? 1 : 0,
      duration: DURACION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [cubierta, progreso]);

  if (Platform.OS !== "android") return <>{children}</>;

  return (
    <Animated.View
      style={[styles.capa, { transform: [{ scale: progreso.interpolate({ inputRange: [0, 1], outputRange: [1, ESCALA_ATRAS] }) }] }]}
    >
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.background, opacity: progreso.interpolate({ inputRange: [0, 1], outputRange: [0, VELO_ATRAS] }) },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capa: { flex: 1 },
});
