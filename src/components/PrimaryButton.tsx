import React from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline";
  accessibilityLabel?: string;
}

/** Equivalente RN de `.theme-btn-primary` del prototipo Figma. Alto ≥ 44px (CLAUDE.md §3). */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  accessibilityLabel,
}: PrimaryButtonProps) {
  const { theme } = useTheme();
  const isOutline = variant === "outline";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isOutline ? "transparent" : theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: isOutline ? 1 : 0,
          borderRadius: theme.radii.full,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? theme.colors.primary : theme.colors.primaryForeground} />
      ) : (
        <Text
          variant="heading"
          style={[styles.label, { color: isOutline ? theme.colors.primary : theme.colors.primaryForeground }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
