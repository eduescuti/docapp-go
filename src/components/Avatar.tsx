import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

interface AvatarProps {
  uri?: string;
  iniciales: string;
  size?: number;
}

export function Avatar({ uri, iniciales, size = 48 }: AvatarProps) {
  const { theme } = useTheme();
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.colors.muted }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: `${theme.colors.primary}33`,
        },
      ]}
    >
      <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: size * 0.35 }}>{iniciales}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
