import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import { Card } from "./Card";
import { IconBadge } from "./IconBadge";
import { Text } from "./Text";

interface StatCardProps {
  icon: LucideIcon;
  valor: number | string;
  etiqueta: string;
}

/** Tarjeta de métrica (dashboard de admin y agenda del profesional). */
export function StatCard({ icon, valor, etiqueta }: StatCardProps) {
  const { theme } = useTheme();
  return (
    <Card style={styles.card} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <IconBadge icon={icon} size={32} />
      <View>
        <Text variant="heading" style={[styles.valor, { color: theme.colors.foreground }]}>{valor}</Text>
        <Text style={[styles.etiqueta, { color: theme.colors.mutedForeground }]} numberOfLines={2}>
          {etiqueta}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 10, minWidth: 96 },
  valor: { fontSize: 22, fontWeight: "700" },
  etiqueta: { fontSize: 12 },
});
