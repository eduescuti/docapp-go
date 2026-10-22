import React from "react";
import { StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface PasoReservaProps {
  numero: number;
  titulo: string;
  completo: boolean;
  /** A la derecha del título (p. ej. el botón del calendario). */
  accion?: React.ReactNode;
  children: React.ReactNode;
}

/** Un paso de la reserva de turnos: círculo numerado (con tilde si está completo), título y contenido. */
export function PasoReserva({ numero, titulo, completo, accion, children }: PasoReservaProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.paso}>
      <View style={styles.encabezado}>
        <View style={[styles.numero, { backgroundColor: completo ? theme.colors.primary : theme.colors.muted }]}>
          {completo ? (
            <Check size={14} color={theme.colors.primaryForeground} />
          ) : (
            <Text style={[styles.numeroTexto, { color: theme.colors.mutedForeground }]}>{numero}</Text>
          )}
        </View>
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>
          {titulo}
        </Text>
        {accion}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  paso: { marginBottom: 24 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, minHeight: 44 },
  numero: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  numeroTexto: { fontSize: 12, fontWeight: "700" },
  titulo: { flex: 1, fontSize: 16, fontWeight: "600" },
});
