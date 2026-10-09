import React from "react";
import { StyleSheet, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";

import { useTheme } from "@/theme";
import { PrimaryButton } from "./PrimaryButton";
import { Text } from "./Text";

interface ConfirmacionProps {
  mensaje: string;
  textoConfirmar: string;
  textoVolver: string;
  onConfirmar: () => void;
  onVolver: () => void;
  cargando?: boolean;
}

/**
 * Segunda confirmación antes de una acción que no se deshace (cancelar un turno, eliminar).
 * Se dibuja dentro de la app y no con `Alert`, que en web no funciona.
 */
export function Confirmacion({ mensaje, textoConfirmar, textoVolver, onConfirmar, onVolver, cargando }: ConfirmacionProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.contenedor}>
      <View style={[styles.icono, { backgroundColor: `${theme.colors.danger}1F` }]}>
        <AlertTriangle size={22} color={theme.colors.danger} />
      </View>
      <Text style={[styles.mensaje, { color: theme.colors.foreground }]}>{mensaje}</Text>
      <View style={styles.botones}>
        <PrimaryButton label={textoConfirmar} variant="danger" onPress={onConfirmar} loading={cargando} />
        <PrimaryButton label={textoVolver} variant="outline" onPress={onVolver} disabled={cargando} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", gap: 14, paddingVertical: 8 },
  icono: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  mensaje: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  botones: { alignSelf: "stretch", gap: 10, marginTop: 4 },
});
