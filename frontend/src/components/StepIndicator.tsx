import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface StepIndicatorProps {
  pasos: string[];
  actual: number; // índice base 0
}

/** Indicador de pasos para flujos tipo carrusel (registro de profesional). */
export function StepIndicator({ pasos, actual }: StepIndicatorProps) {
  const { theme } = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${actual + 1} de ${pasos.length}: ${pasos[actual]}`}
    >
      {pasos.map((paso, i) => {
        const hecho = i <= actual;
        return (
          <View key={paso} style={styles.step}>
            <View style={[styles.bar, { backgroundColor: hecho ? theme.colors.primary : theme.colors.border }]} />
            <Text
              style={[
                styles.label,
                { color: i === actual ? theme.colors.foreground : theme.colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {paso}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 24 },
  step: { flex: 1, gap: 6 },
  bar: { height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: "600" },
});
