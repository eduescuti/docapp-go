import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Pill } from "lucide-react-native";

import { BackHeader, Card, EmptyState, IconBadge, ScreenContainer, Text } from "@/components";
import { Medico, Receta } from "@/domain";
import { getMedico, getPacienteActual, listRecetasPaciente } from "@/services";
import { useTheme } from "@/theme";
import { formatFechaLarga, nombreConTitulo } from "@/utils/format";

interface RecetaConMedico {
  receta: Receta;
  medico?: Medico;
}

/** Mis recetas: cada receta queda asociada al profesional que la emitió (regla #7). */
export default function RecetasScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<RecetaConMedico[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await getPacienteActual();
        const recetas = await listRecetasPaciente(p.id);
        const conMedico = await Promise.all(recetas.map(async (receta) => ({ receta, medico: await getMedico(receta.medicoId) })));
        setItems(conMedico.sort((a, b) => b.receta.fecha.localeCompare(a.receta.fecha)));
      })();
    }, []),
  );

  return (
    <ScreenContainer>
      <BackHeader titulo="Mis recetas" />
      {items?.length === 0 && (
        <EmptyState icon={Pill} titulo="Todavía no tenés recetas" descripcion="Cuando un profesional te emita una receta, la vas a ver acá." />
      )}
      {items?.map(({ receta, medico }) => (
        <Card key={receta.id} style={styles.card}>
          <View style={styles.header}>
            <IconBadge icon={Pill} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="heading" style={[styles.medicacion, { color: theme.colors.foreground }]}>{receta.medicacion}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                {medico ? nombreConTitulo(medico) : "Profesional"} · {formatFechaLarga(receta.fecha)}
              </Text>
            </View>
          </View>
          <View style={[styles.grid, { borderTopColor: theme.colors.border }]}>
            <Dato label="Dosis" valor={receta.dosis} />
            <Dato label="Frecuencia" valor={receta.frecuencia} />
            <Dato label="Duración" valor={receta.duracion} />
          </View>
          {receta.indicaciones ? (
            <View style={[styles.indicaciones, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.md }]}>
              <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Indicaciones</Text>
              <Text style={{ color: theme.colors.foreground, fontSize: 13, lineHeight: 19 }}>{receta.indicaciones}</Text>
            </View>
          ) : null}
          {receta.observaciones ? (
            <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 8 }]}>{receta.observaciones}</Text>
          ) : null}
        </Card>
      ))}
    </ScreenContainer>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>{label}</Text>
      <Text style={{ color: theme.colors.foreground, fontSize: 13, fontWeight: "600" }}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  medicacion: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  grid: { flexDirection: "row", gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  label: { fontSize: 11, marginBottom: 2 },
  indicaciones: { padding: 12, marginTop: 14 },
});
