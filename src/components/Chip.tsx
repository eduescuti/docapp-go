import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.base,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.card,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? theme.colors.primaryForeground : theme.colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
