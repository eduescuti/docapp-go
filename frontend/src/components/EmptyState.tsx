import { StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import { Card } from "./Card";
import { IconBadge } from "./IconBadge";
import { Text } from "./Text";

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  descripcion?: string;
}

/** Estado vacío de una sección (sin datos todavía). */
export function EmptyState({ icon, titulo, descripcion }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <Card style={styles.card}>
      <IconBadge icon={icon} size={48} />
      <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>{titulo}</Text>
      {descripcion ? (
        <Text style={[styles.descripcion, { color: theme.colors.mutedForeground }]}>{descripcion}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: 10, paddingVertical: 32 },
  titulo: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  descripcion: { fontSize: 13, textAlign: "center", lineHeight: 19, paddingHorizontal: 8 },
});
