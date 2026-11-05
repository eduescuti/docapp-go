import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PropsBarraPestanas } from "@/navigation/PestanasDeslizables";
import { useTheme } from "@/theme";

/**
 * Barra inferior de las pestañas del paciente. Sigue al pager: el indicador de arriba se desliza y el
 * color de cada ícono y su etiqueta se funden de a poco a medida que el dedo mueve la pantalla.
 */
export function BarraPestanas({ state, descriptors, position, layout, jumpTo }: PropsBarraPestanas) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const cantidad = state.routes.length;
  const anchoPestana = layout.width / cantidad;
  const indices = state.routes.map((_, i) => i);

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.barra,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          // En web no hay safe area: un relleno chico alcanza.
          paddingBottom: Platform.OS === "web" ? 4 : insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {anchoPestana > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicador,
            {
              width: anchoPestana,
              transform: [{ translateX: position.interpolate({ inputRange: indices, outputRange: indices.map((i) => i * anchoPestana) }) }],
            },
          ]}
        >
          <View style={[styles.indicadorPastilla, { backgroundColor: theme.colors.primary }]} />
        </Animated.View>
      ) : null}

      {state.routes.map((ruta, i) => {
        const { options } = descriptors[ruta.key];
        const seleccionada = state.index === i;
        const titulo = options.title ?? ruta.name;
        // 1 cuando esta pestaña está a la vista, 0 cuando está a una pestaña o más de distancia.
        const actividad = position.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [0, 1, 0], extrapolate: "clamp" });
        const escala = actividad.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

        return (
          <Pressable
            key={ruta.key}
            onPress={() => jumpTo(ruta.key)}
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel ?? titulo}
            accessibilityState={{ selected: seleccionada }}
            // En web `accessibilityState` no llega al DOM: se indica también con la prop equivalente.
            aria-selected={seleccionada}
            style={styles.pestana}
          >
            <Animated.View style={[styles.icono, { transform: [{ scale: escala }] }]}>
              {/* Dos capas, una de cada color: la activa se funde sobre la inactiva. */}
              {options.tabBarIcon?.({ focused: false, color: theme.colors.mutedForeground })}
              <Animated.View style={[StyleSheet.absoluteFill, styles.capaActiva, { opacity: actividad }]}>
                {options.tabBarIcon?.({ focused: true, color: theme.colors.primary })}
              </Animated.View>
            </Animated.View>
            <View>
              <Animated.Text style={[styles.etiqueta, { color: theme.colors.mutedForeground, fontFamily: theme.fonts.body }]}>{titulo}</Animated.Text>
              <Animated.Text
                style={[styles.etiqueta, styles.capaActivaTexto, { color: theme.colors.primary, opacity: actividad, fontFamily: theme.fonts.body }]}
              >
                {titulo}
              </Animated.Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { flexDirection: "row", borderTopWidth: 1, paddingTop: 8 },
  indicador: { position: "absolute", top: -1, left: 0, height: 3, alignItems: "center" },
  indicadorPastilla: { width: 28, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  pestana: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 3 },
  icono: { width: 24, height: 24 },
  capaActiva: { alignItems: "center", justifyContent: "center" },
  etiqueta: { fontSize: 10, fontWeight: "600" },
  capaActivaTexto: { position: "absolute", left: 0, right: 0, textAlign: "center" },
});
