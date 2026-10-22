import { Pressable, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";

import { useTheme } from "@/theme";

const AMARILLO = "#EAB308";

interface StarRatingProps {
  value: number; // 0 = sin calificar
  onChange?: (value: 1 | 2 | 3 | 4 | 5) => void;
  size?: number;
  label?: string;
}

/** Estrellas de 1 a 5. Con `onChange` es editable (cada estrella tiene área táctil de 44px). */
export function StarRating({ value, onChange, size = 24, label = "Calificación" }: StarRatingProps) {
  const { theme } = useTheme();
  const valores = [1, 2, 3, 4, 5] as const;

  if (!onChange) {
    return (
      <View style={styles.row} accessible accessibilityLabel={`${label}: ${value} de 5 estrellas`}>
        {valores.map((v) => (
          <Star key={v} size={size} color={v <= value ? AMARILLO : theme.colors.border} fill={v <= value ? AMARILLO : "transparent"} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={`${label}: ${value} de 5`}>
      {valores.map((v) => (
        <Pressable
          key={v}
          onPress={() => onChange(v)}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${v} ${v === 1 ? "estrella" : "estrellas"}`}
          accessibilityState={{ selected: v <= value }}
          style={styles.touch}
        >
          <Star size={size} color={v <= value ? AMARILLO : theme.colors.mutedForeground} fill={v <= value ? AMARILLO : "transparent"} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  touch: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
