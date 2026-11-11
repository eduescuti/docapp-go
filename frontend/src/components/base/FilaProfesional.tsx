import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { Medico } from "@/domain";
import { useTheme } from "@/theme";
import { iniciales, nombreConTitulo } from "@/utils/format";
import { alPresionar } from "@/utils/ui";
import { Avatar } from "./Avatar";
import { Text } from "./Text";

interface FilaProfesionalProps {
  medico: Medico;
  detalle?: string;
  onPress: () => void;
}

/**
 * Profesional tocable dentro de un detalle (orden, resultado, receta): foto, nombre y especialidad, con una
 * flecha que lleva a su perfil. Igual que la fila del profesional en el detalle de un turno.
 */
export function FilaProfesional({ medico, detalle, onPress }: FilaProfesionalProps) {
  const { theme } = useTheme();
  const nombre = nombreConTitulo(medico);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver perfil de ${nombre}`}
      style={({ pressed }) => [styles.fila, alPresionar(pressed)]}
    >
      <Avatar uri={medico.avatarUrl} iniciales={iniciales(medico.nombre, medico.apellido)} size={44} />
      <View style={styles.textos}>
        <Text style={[styles.nombre, { color: theme.colors.foreground }]} numberOfLines={1}>
          {nombre}
        </Text>
        {detalle ? (
          <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
            {detalle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44, marginTop: 4 },
  textos: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: "500" },
  detalle: { fontSize: 12, marginTop: 2 },
});
