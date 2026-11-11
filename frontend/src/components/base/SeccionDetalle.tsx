import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface SeccionDetalleProps {
  icono: LucideIcon;
  titulo: string;
  children: ReactNode;
}

/**
 * Un bloque del detalle de un turno, estudio, orden o receta: ícono y título chico en mayúsculas, separado del
 * anterior por una línea, y debajo el contenido.
 */
export function SeccionDetalle({ icono: Icono, titulo, children }: SeccionDetalleProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.seccion, { borderTopColor: theme.colors.border }]}>
      <View style={styles.encabezado}>
        <Icono size={14} color={theme.colors.primary} />
        <Text style={[styles.titulo, { color: theme.colors.mutedForeground }]}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 4 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 6 },
  titulo: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
});
