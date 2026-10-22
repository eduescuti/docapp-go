import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/theme";
import { alPresionar } from "@/utils/presionado";
import { Text } from "./Text";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** danger: confirmaciones destructivas (cancelar un turno, eliminar). */
  variant?: "primary" | "outline" | "danger";
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
  const relleno = variant === "danger" ? theme.colors.danger : theme.colors.primary;
  const textoRelleno = variant === "danger" ? theme.colors.dangerForeground : theme.colors.primaryForeground;

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
          backgroundColor: isOutline ? "transparent" : relleno,
          borderColor: relleno,
          borderWidth: isOutline ? 1 : 0,
          borderRadius: theme.radii.full,
          opacity: disabled ? 0.5 : 1,
        },
        !disabled && alPresionar(pressed, 0.97),
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? theme.colors.primary : textoRelleno} />
      ) : (
        <Text
          variant="heading"
          style={[styles.label, { color: isOutline ? theme.colors.primary : textoRelleno }]}
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
