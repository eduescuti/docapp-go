import React from "react";
import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";

import { Card } from "./Card";
import { IconBadge } from "./IconBadge";
import { PrimaryButton } from "./PrimaryButton";
import { ScreenContainer } from "./ScreenContainer";
import { Text } from "./Text";

interface RolePlaceholderProps {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  funcionalidades: string[];
}

/** Pantalla base para los modos doctor/admin: navegación lista, contenido pendiente (CLAUDE.md §6, §12 MVP). */
export function RolePlaceholder({ icon, titulo, descripcion, funcionalidades }: RolePlaceholderProps) {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconBadge icon={icon} size={56} />
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>{titulo}</Text>
        <Text style={[styles.descripcion, { color: theme.colors.mutedForeground }]}>{descripcion}</Text>
      </View>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Próximamente en esta base</Text>
        {funcionalidades.map((f) => (
          <View key={f} style={styles.itemRow}>
            <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.itemText, { color: theme.colors.mutedForeground }]}>{f}</Text>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: 24 }}>
        <PrimaryButton
          label="Cerrar sesión"
          variant="outline"
          onPress={() => {
            logout();
            router.replace("/(auth)/login");
          }}
          accessibilityLabel="Cerrar sesión"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: 12, marginBottom: 28 },
  titulo: { fontSize: 20, fontWeight: "700" },
  descripcion: { fontSize: 13, textAlign: "center", paddingHorizontal: 8 },
  cardTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  itemText: { fontSize: 13, flex: 1 },
});
