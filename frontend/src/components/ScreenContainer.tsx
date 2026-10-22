import React, { useContext } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { BarraInferiorContext } from "./BarraInferiorContext";

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

/** Contenedor base de pantalla: fondo del tema activo + safe area + padding horizontal 24. */
export function ScreenContainer({ children, scroll = true, style }: ScreenContainerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const conBarra = useContext(BarraInferiorContext);
  const areaInferior = conBarra ? 0 : insets.bottom;

  const containerStyle = [
    styles.base,
    { backgroundColor: theme.colors.background, paddingTop: insets.top + 16, paddingBottom: areaInferior },
    style,
  ];

  if (!scroll) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 32 + areaInferior }, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});
