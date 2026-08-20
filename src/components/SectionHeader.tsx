import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fonts.heading }]}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={8}>
          <Text style={[styles.action, { color: theme.colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  action: {
    fontSize: 12,
    fontWeight: "600",
  },
});
