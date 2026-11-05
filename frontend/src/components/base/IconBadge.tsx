import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";

interface IconBadgeProps {
  icon: LucideIcon;
  size?: number;
}

/** Equivalente RN de `.theme-icon-bg` del prototipo Figma. */
export function IconBadge({ icon: Icon, size = 40 }: IconBadgeProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          backgroundColor: theme.colors.accent,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <Icon size={size * 0.5} color={theme.colors.accentForeground} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
