import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

export interface BarDatum {
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  unidad?: string;
  /** Color de las barras (por defecto `primary`). Cada gráfico de una pantalla lleva el suyo. */
  color?: string;
}

/**
 * Gráfico de barras horizontal hecho con `View` (sin librería extra, para no sumar
 * dependencias con versiones congeladas — CLAUDE.md §2).
 */
export function HorizontalBarChart({ data, unidad = "", color }: HorizontalBarChartProps) {
  const { theme } = useTheme();
  const tono = color ?? theme.colors.primary;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.wrapper}>
      {data.map((d) => (
        <View
          key={d.label}
          style={styles.row}
          accessible
          accessibilityLabel={`${d.label}: ${d.value} ${unidad}`.trim()}
        >
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: theme.colors.foreground }]} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={[styles.value, { color: tono }]}>{d.value}</Text>
          </View>
          {/* La pista es el mismo color, muy suave (alfa 1F), para que cada gráfico se lea de un solo tono. */}
          <View style={[styles.track, { backgroundColor: `${tono}1F`, borderRadius: theme.radii.sm }]}>
            <View
              style={[
                styles.bar,
                {
                  width: `${(d.value / max) * 100}%`,
                  backgroundColor: tono,
                  borderRadius: theme.radii.sm,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  row: { gap: 6 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  label: { fontSize: 13, fontWeight: "500", flex: 1 },
  value: { fontSize: 13, fontWeight: "700" },
  track: { height: 12, overflow: "hidden" },
  bar: { height: "100%", minWidth: 2 },
});
