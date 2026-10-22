import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface TabSwitchProps<T extends string> {
  opciones: { valor: T; etiqueta: string }[];
  valor: T;
  onChange: (valor: T) => void;
}

/** Selector de pestañas tipo "pastilla" (Turnos: Próximos | Historial · Estudios: Resultados | Archivados). */
export function TabSwitch<T extends string>({ opciones, valor, onChange }: TabSwitchProps<T>) {
  const { theme } = useTheme();
  return (
    <View
      style={[styles.contenedor, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}
      accessibilityRole="tablist"
    >
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => onChange(opcion.valor)}
            accessibilityRole="tab"
            accessibilityLabel={opcion.etiqueta}
            accessibilityState={{ selected: activa }}
            style={[styles.pestana, { backgroundColor: activa ? theme.colors.background : "transparent" }]}
          >
            <Text style={[styles.texto, { color: activa ? theme.colors.foreground : theme.colors.mutedForeground }]}>
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 4, marginBottom: 16 },
  pestana: { flex: 1, minHeight: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  texto: { fontSize: 14, fontWeight: "600" },
});
