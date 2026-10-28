import { Pressable, StyleSheet, View, ViewProps } from "react-native";

import { useTheme } from "@/theme";
import { alPresionar } from "@/utils/presionado";

interface CardProps extends ViewProps {
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
  /** Ocupa todo el alto de su contenedor (p. ej. tarjetas lado a lado que tienen que medir lo mismo). */
  llenar?: boolean;
}

/** Equivalente RN de `.theme-card` del prototipo Figma (template-ejemplo-figma). */
export function Card({ children, style, onPress, accessibilityLabel, padded = true, llenar = false, ...rest }: CardProps) {
  const { theme } = useTheme();
  const content = (
    <View
      style={[
        styles.base,
        llenar && styles.llenar,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          padding: padded ? 16 : 0,
          ...theme.shadow,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [llenar && styles.llenar, alPresionar(pressed)]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: "hidden",
  },
  llenar: { flex: 1 },
});
