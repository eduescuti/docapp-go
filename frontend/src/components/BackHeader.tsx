import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { useTheme } from "@/theme";
import { sinTeclado } from "@/utils/teclado";
import { Text } from "./Text";

interface BackHeaderProps {
  titulo: string;
  subtitulo?: string;
  onBack?: () => void;
}

/** Encabezado de pantalla secundaria con botón de volver (área táctil 44px). */
export function BackHeader({ titulo, subtitulo, onBack }: BackHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        // Vuelve sin teclado (ver `sinTeclado`).
        onPress={onBack ?? (() => sinTeclado(() => router.back()))}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
        style={[styles.backBtn, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.full }]}
      >
        <ChevronLeft size={22} color={theme.colors.foreground} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={[styles.subtitulo, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  titulo: { fontSize: 20, fontWeight: "700" },
  subtitulo: { fontSize: 13, marginTop: 2 },
});
