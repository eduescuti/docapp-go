import React from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

/** Contenedor base de pantalla: fondo del tema activo + safe area + padding horizontal 24. */
export function ScreenContainer({ children, scroll = true, style }: ScreenContainerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.base,
    { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 },
    style,
  ];

  if (!scroll) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }, style]}
      showsVerticalScrollIndicator={false}
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
    paddingBottom: 120,
  },
});
