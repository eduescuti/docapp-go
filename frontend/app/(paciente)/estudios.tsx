import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, FileText, Stethoscope } from "lucide-react-native";

import { Card, ScreenContainer, StatusBadge, Text } from "@/components";
import { Estudio, Medico, OrdenLaboratorio } from "@/domain";
import { getMedico, getPacienteActual, listEstudiosPaciente, listOrdenesPaciente } from "@/services";
import { useTheme } from "@/theme";
import { formatFechaCorta, tituloMedico } from "@/utils/format";

type Tab = "resultados" | "ordenes";

interface EstudioConMedico {
  estudio: Estudio;
  medico?: Medico;
}

export default function EstudiosScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>("resultados");
  const [estudios, setEstudios] = useState<EstudioConMedico[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenLaboratorio[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const paciente = await getPacienteActual();
        const [listaEstudios, listaOrdenes] = await Promise.all([
          listEstudiosPaciente(paciente.id),
          listOrdenesPaciente(paciente.id),
        ]);
        const conMedico = await Promise.all(
          listaEstudios.map(async (estudio) => ({ estudio, medico: await getMedico(estudio.medicoSolicitanteId) })),
        );
        setEstudios(conMedico);
        setOrdenes(listaOrdenes);
      })();
    }, []),
  );

  return (
    <ScreenContainer scroll={false} style={{ paddingTop: insets.top + 16 }}>
      <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>Mis Estudios</Text>

      <View style={[styles.tabSwitch, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}>
        <TabButton label="Resultados" active={tab === "resultados"} onPress={() => setTab("resultados")} />
        <TabButton label="Órdenes" active={tab === "ordenes"} onPress={() => setTab("ordenes")} />
      </View>

      {tab === "resultados" ? (
        <FlatList
          data={estudios}
          keyExtractor={({ estudio }) => estudio.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{ color: theme.colors.mutedForeground, marginTop: 24 }}>Sin estudios registrados.</Text>}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.colors.accent }]}>
                    <FileText size={16} color={theme.colors.accentForeground} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>{item.estudio.tipo}</Text>
                  </View>
                </View>
                <StatusBadge estado={item.estudio.estado} />
              </View>
              <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
                <View style={styles.metaItem}>
                  <Calendar size={12} color={theme.colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: theme.colors.mutedForeground }]}>
                    {formatFechaCorta(item.estudio.fecha)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Stethoscope size={12} color={theme.colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: theme.colors.mutedForeground }]}>
                    {item.medico ? `${tituloMedico(item.medico)} ${item.medico.apellido}` : ""}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={ordenes}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{ color: theme.colors.mutedForeground, marginTop: 24 }}>Sin órdenes de laboratorio.</Text>}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
                {item.estudiosSolicitados.join(", ")}
              </Text>
              <Text style={[styles.metaText, { color: theme.colors.mutedForeground, marginTop: 4 }]}>{item.indicaciones}</Text>
              <View style={{ marginTop: 8 }}>
                <StatusBadge estado={item.estado} />
              </View>
            </Card>
          )}
        />
      )}
    </ScreenContainer>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[styles.tabButton, { backgroundColor: active ? theme.colors.background : "transparent" }]}
    >
      <Text style={{ fontSize: 14, fontWeight: "600", color: active ? theme.colors.foreground : theme.colors.mutedForeground }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, paddingHorizontal: 24 },
  tabSwitch: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  listContent: { paddingHorizontal: 24, paddingBottom: 32 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 8 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
});
