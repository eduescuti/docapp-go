import React from "react";
import { Pressable, StyleSheet, View, ViewProps } from "react-native";

import { useTheme } from "@/theme";

interface CardProps extends ViewProps {
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
}

/** Equivalente RN de `.theme-card` del prototipo Figma (template-ejemplo-figma). */
export function Card({ children, style, onPress, accessibilityLabel, padded = true, ...rest }: CardProps) {
  const { theme } = useTheme();
  const content = (
    <View
      style={[
        styles.base,
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
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
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
});
