import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { TriangleAlert } from "lucide-react-native";

import { useTheme } from "@/theme";
import { PrimaryButton } from "./PrimaryButton";
import { Text } from "./Text";

interface AvisoProfesionalProps {
  sinCoberturas: boolean;
  sinHorarios: boolean;
  onCargarCoberturas: () => void;
  onCargarHorarios: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Aviso del profesional que todavía no cargó coberturas u horarios: sin coberturas no le aparece a ningún
 * paciente (regla 18) y sin franjas no tiene turnos para ofrecer. Va en su Inicio y su Perfil.
 */
export function AvisoProfesional({ sinCoberturas, sinHorarios, onCargarCoberturas, onCargarHorarios, style }: AvisoProfesionalProps) {
  const { theme } = useTheme();
  if (!sinCoberturas && !sinHorarios) return null;

  const texto =
    sinCoberturas && sinHorarios
      ? "Todavía no cargaste tus coberturas ni tus horarios de atención: los pacientes no te ven."
      : sinCoberturas
        ? "Todavía no cargaste tus coberturas: los pacientes no te ven."
        : "Todavía no cargaste tus horarios de atención: los pacientes no pueden pedirte turnos.";

  return (
    <View
      style={[styles.caja, { backgroundColor: `${theme.colors.danger}14`, borderColor: `${theme.colors.danger}55`, borderRadius: theme.radii.md }, style]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.fila}>
        <TriangleAlert size={20} color={theme.colors.danger} />
        <Text style={[styles.texto, { color: theme.colors.foreground }]}>{texto}</Text>
      </View>
      {sinCoberturas ? <PrimaryButton label="Cargar coberturas" onPress={onCargarCoberturas} /> : null}
      {sinHorarios ? <PrimaryButton label="Cargar horarios" variant={sinCoberturas ? "outline" : "primary"} onPress={onCargarHorarios} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderWidth: 1, padding: 14, gap: 12, marginBottom: 20 },
  fila: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  texto: { flex: 1, fontSize: 14, lineHeight: 20 },
});
