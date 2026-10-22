import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface EncabezadoTabProps {
  titulo: string;
  /** Botón a la derecha del título (p. ej. Historial, Archivados). Debería medir 44 px. */
  accion?: React.ReactNode;
  /** Si se pasa, el título lleva un botón de volver a la izquierda (vistas internas de una pestaña). */
  onVolver?: () => void;
  etiquetaVolver?: string;
}

/**
 * Título de pantalla de las pestañas (Turnos, Estudios, Recetas, Menú). Todos comparten el mismo alto
 * (44 px) y centrado, así el título queda en la misma posición en cada pestaña.
 */
export function EncabezadoTab({ titulo, accion, onVolver, etiquetaVolver = "Volver" }: EncabezadoTabProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.fila}>
      {onVolver ? (
        <Pressable
          onPress={onVolver}
          accessibilityRole="button"
          accessibilityLabel={etiquetaVolver}
          hitSlop={8}
          style={[styles.volver, { backgroundColor: theme.colors.muted }]}
        >
          <ChevronLeft size={22} color={theme.colors.foreground} />
        </Pressable>
      ) : null}
      <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]} numberOfLines={1} accessibilityRole="header">
        {titulo}
      </Text>
      {accion}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44, marginBottom: 20 },
  titulo: { flex: 1, fontSize: 22, fontWeight: "700" },
  volver: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
