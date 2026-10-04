import Constants from "expo-constants";
import { Pressable, StyleSheet, View } from "react-native";
import { Check, Info } from "lucide-react-native";

import { BackHeader, Card, IconBadge, ScreenContainer, SectionHeader, Text } from "@/components";
import { PreferenciaTema, Theme, themes, useTheme } from "@/theme";

interface OpcionTema {
  value: PreferenciaTema;
  label: string;
  descripcion: string;
}

const OPCIONES: OpcionTema[] = [
  { value: "sistema", label: "Automático", descripcion: "Sigue el modo claro u oscuro de tu teléfono." },
  { value: "claro", label: "Claro", descripcion: "La app se ve siempre en modo claro." },
  { value: "oscuro", label: "Oscuro", descripcion: "La app se ve siempre en modo oscuro." },
];

/** Configuración de la app. Por ahora: apariencia (modo claro / oscuro / automático). */
export default function ConfiguracionScreen() {
  const { theme, preferencia, setPreferencia } = useTheme();
  const version = Constants.expoConfig?.version;
  const actual = OPCIONES.find((o) => o.value === preferencia) ?? OPCIONES[0];

  return (
    <ScreenContainer>
      <BackHeader titulo="Configuración" />

      <SectionHeader title="Apariencia" />
      <Card style={styles.bloque}>
        <Text style={[styles.label, { color: theme.colors.foreground }]}>Modo de color</Text>
        <View style={styles.opciones} accessibilityRole="radiogroup" accessibilityLabel="Modo de color">
          {OPCIONES.map((op) => {
            const activa = op.value === preferencia;
            return (
              <Pressable
                key={op.value}
                onPress={() => setPreferencia(op.value)}
                accessibilityRole="radio"
                accessibilityLabel={`${op.label}. ${op.descripcion}`}
                accessibilityState={{ checked: activa }}
                style={styles.opcion}
              >
                <View
                  style={[
                    styles.preview,
                    {
                      borderColor: activa ? theme.colors.primary : theme.colors.border,
                      borderWidth: activa ? 2 : 1,
                      borderRadius: theme.radii.lg,
                    },
                  ]}
                >
                  {op.value === "sistema" ? (
                    <View style={styles.mitades}>
                      <MiniApp tema={themes.A} />
                      <MiniApp tema={themes.C} />
                    </View>
                  ) : (
                    <MiniApp tema={op.value === "claro" ? themes.A : themes.C} />
                  )}
                  {activa && (
                    <View style={[styles.check, { backgroundColor: theme.colors.primary }]}>
                      <Check size={12} color={theme.colors.primaryForeground} strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.opcionTexto,
                    { color: activa ? theme.colors.foreground : theme.colors.mutedForeground, fontWeight: activa ? "700" : "500" },
                  ]}
                  numberOfLines={1}
                >
                  {op.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.descripcion, { color: theme.colors.mutedForeground }]}>{actual.descripcion}</Text>
      </Card>

      {version ? (
        <>
          <SectionHeader title="Acerca de" />
          <Card>
            <View style={styles.aboutRow}>
              <IconBadge icon={Info} size={36} />
              <Text style={[styles.aboutLabel, { color: theme.colors.foreground }]}>Versión de la app</Text>
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>{version}</Text>
            </View>
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}

/** Miniatura de una pantalla de la app con los colores de un tema (vista previa del modo). */
function MiniApp({ tema }: { tema: Theme }) {
  const c = tema.colors;
  return (
    <View style={[styles.mini, { backgroundColor: c.background }]}>
      <View style={[styles.miniTitulo, { backgroundColor: c.foreground }]} />
      <View style={[styles.miniCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[styles.miniLinea, { backgroundColor: c.mutedForeground, width: "80%" }]} />
        <View style={[styles.miniLinea, { backgroundColor: c.border, width: "55%" }]} />
        <View style={[styles.miniBoton, { backgroundColor: c.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { marginBottom: 28 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 14 },
  opciones: { flexDirection: "row", gap: 10 },
  opcion: { flex: 1, gap: 8 },
  preview: { height: 104, overflow: "hidden" },
  mitades: { flex: 1, flexDirection: "row" },
  mini: { flex: 1, padding: 8, gap: 6 },
  miniTitulo: { height: 6, width: "50%", borderRadius: 3, opacity: 0.85 },
  miniCard: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 6, gap: 4 },
  miniLinea: { height: 4, borderRadius: 2 },
  miniBoton: { height: 10, width: "70%", borderRadius: 5, marginTop: "auto" },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  opcionTexto: { fontSize: 13, textAlign: "center" },
  descripcion: { fontSize: 12, marginTop: 14, textAlign: "center" },
  aboutRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  aboutLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
});
