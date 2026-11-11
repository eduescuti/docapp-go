import { Pressable, StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import { alPresionar } from "@/utils/ui";
import { Text } from "./Text";

interface BotonIconoProps {
  icono: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  colorIcono?: string;
  contador?: number;
}

/** Botón redondo de 44 px con un ícono, como los de arriba de las pestañas (archivados, historial, campana). */
export function BotonIcono({ icono: Icono, accessibilityLabel, onPress, colorIcono, contador = 0 }: BotonIconoProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.boton,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
        alPresionar(pressed, 0.92),
      ]}
    >
      <Icono size={20} color={colorIcono ?? theme.colors.primary} />
      {contador > 0 ? (
        <View style={[styles.contador, { backgroundColor: theme.colors.danger, borderColor: theme.colors.card }]}>
          <Text style={[styles.contadorTexto, { color: theme.colors.dangerForeground }]}>{contador}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  contador: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  contadorTexto: { fontSize: 10, fontWeight: "700" },
});
