import { StyleSheet, View } from "react-native";
import { CheckCircle2, CircleAlert } from "lucide-react-native";

import type { Aviso } from "@/hooks/useAviso";
import { useTheme } from "@/theme";
import { Text } from "./Text";

export function AvisoTemporal({ aviso }: { aviso: Aviso | null }) {
  const { theme } = useTheme();
  if (!aviso) return null;

  const color = aviso.tipo === "exito" ? theme.colors.success : theme.colors.danger;
  const Icono = aviso.tipo === "exito" ? CheckCircle2 : CircleAlert;

  return (
    <View style={[styles.aviso, { backgroundColor: `${color}1F` }]} accessibilityLiveRegion="polite">
      <Icono size={16} color={color} />
      <Text style={[styles.texto, { color: theme.colors.foreground }]}>{aviso.texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  texto: { flex: 1, fontSize: 13 },
});
