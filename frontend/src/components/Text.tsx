import React from "react";
import { Text as RNText, TextProps } from "react-native";

import { useTheme } from "@/theme";

interface AppTextProps extends TextProps {
  variant?: "heading" | "body";
}

/**
 * Reemplazo temático de `Text` de React Native: aplica la tipografía del tema
 * activo (Inter/Nunito/Playfair+PlusJakarta según CLAUDE.md §7) por defecto, sin
 * que cada pantalla tenga que setear `fontFamily` a mano.
 */
export function Text({ variant = "body", style, ...rest }: AppTextProps) {
  const { theme } = useTheme();
  return <RNText style={[{ fontFamily: theme.fonts[variant] }, style]} {...rest} />;
}
