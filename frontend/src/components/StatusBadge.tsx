import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";
import { EstadoEstudio } from "@/domain/laboratorio";
import { EstadoTurno } from "@/domain/turno";

const ETIQUETAS: Record<EstadoTurno | EstadoEstudio, string> = {
  confirmado: "Confirmado",
  pendiente: "Pendiente",
  cancelado: "Cancelado",
  reprogramado: "Reprogramado",
  completado: "Completado",
  rechazado: "Rechazado",
  agendado: "Agendado",
  realizado: "Realizado",
  resultado_disponible: "Listo",
};

export function etiquetaEstado(estado: EstadoTurno | EstadoEstudio): string {
  return ETIQUETAS[estado];
}

interface StatusBadgeProps {
  estado: EstadoTurno | EstadoEstudio;
}

export function StatusBadge({ estado }: StatusBadgeProps) {
  const { theme } = useTheme();
  const esPositivo = estado === "confirmado" || estado === "completado" || estado === "resultado_disponible";
  const esNegativo = estado === "cancelado" || estado === "rechazado";

  const backgroundColor = esNegativo ? `${theme.colors.danger}22` : esPositivo ? `${theme.colors.success}22` : theme.colors.accent;
  const color = esNegativo ? theme.colors.danger : esPositivo ? theme.colors.success : theme.colors.accentForeground;

  return (
    <View style={[styles.base, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{ETIQUETAS[estado]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
