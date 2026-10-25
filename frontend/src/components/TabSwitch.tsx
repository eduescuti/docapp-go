import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface TabSwitchProps<T extends string> {
  /** `avisos`: cuántas novedades tiene la pestaña (p. ej. resultados nuevos). Con 0 o sin pasarlo no se muestra nada. */
  opciones: { valor: T; etiqueta: string; avisos?: number }[];
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
        const avisos = opcion.avisos ?? 0;
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => onChange(opcion.valor)}
            accessibilityRole="tab"
            accessibilityLabel={avisos > 0 ? `${opcion.etiqueta}, ${avisos} ${avisos === 1 ? "nuevo" : "nuevos"}` : opcion.etiqueta}
            accessibilityState={{ selected: activa }}
            style={[styles.pestana, { backgroundColor: activa ? theme.colors.background : "transparent" }]}
          >
            <View style={styles.fila}>
              <Text style={[styles.texto, { color: activa ? theme.colors.foreground : theme.colors.mutedForeground }]}>
                {opcion.etiqueta}
              </Text>
              {avisos > 0 ? (
                <View style={[styles.aviso, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.avisoTexto, { color: theme.colors.primaryForeground }]}>{avisos}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 4, marginBottom: 16 },
  pestana: { flex: 1, minHeight: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  texto: { fontSize: 14, fontWeight: "600" },
  aviso: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  avisoTexto: { fontSize: 11, fontWeight: "700" },
});
