import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar, Clock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, PrimaryButton, ScreenContainer, StatusBadge } from "@/components";
import { Medico, Turno } from "@/domain";
import { cancelarTurno, getMedico, getPacienteActual, listTurnosPaciente } from "@/services";
import { useTheme } from "@/theme";
import { formatFechaCorta } from "@/utils/format";

type Filtro = "proximos" | "historial";

interface TurnoConMedico {
  turno: Turno;
  medico?: Medico;
}

export default function TurnosScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filtro, setFiltro] = useState<Filtro>("proximos");
  const [turnos, setTurnos] = useState<TurnoConMedico[]>([]);

  const cargar = useCallback(async () => {
    const paciente = await getPacienteActual();
    const lista = await listTurnosPaciente(paciente.id);
    const conMedico = await Promise.all(
      lista.map(async (turno) => ({ turno, medico: await getMedico(turno.medicoId) })),
    );
    conMedico.sort((a, b) => `${a.turno.fecha}${a.turno.hora}`.localeCompare(`${b.turno.fecha}${b.turno.hora}`));
    setTurnos(conMedico);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const hoy = new Date().toISOString().slice(0, 10);
  const filtrados = turnos.filter(({ turno }) =>
    filtro === "proximos"
      ? turno.fecha >= hoy && turno.estado !== "cancelado" && turno.estado !== "completado"
      : turno.fecha < hoy || turno.estado === "completado" || turno.estado === "cancelado",
  );

  const handleCancelar = (turnoId: string) => {
    Alert.alert("Cancelar turno", "¿Seguro que querés cancelar este turno?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí, cancelar",
        style: "destructive",
        onPress: async () => {
          await cancelarTurno(turnoId);
          cargar();
        },
      },
    ]);
  };

  return (
    <ScreenContainer scroll={false} style={{ paddingTop: insets.top + 16 }}>
      <Text style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fonts.heading }]}>Mis Turnos</Text>

      <View style={[styles.tabSwitch, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}>
        <TabButton label="Próximos" active={filtro === "proximos"} onPress={() => setFiltro("proximos")} />
        <TabButton label="Historial" active={filtro === "historial"} onPress={() => setFiltro("historial")} />
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={({ turno }) => turno.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.mutedForeground, marginTop: 24 }}>
            {filtro === "proximos" ? "No tenés turnos próximos." : "Todavía no hay turnos en tu historial."}
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.turnoCard}>
            <View style={styles.turnoHeader}>
              <Text style={[styles.medicoNombre, { color: theme.colors.foreground }]}>
                {item.medico ? `Dr. ${item.medico.nombre} ${item.medico.apellido}` : "Médico"}
              </Text>
              <StatusBadge estado={item.turno.estado} />
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={14} color={theme.colors.primary} />
                <Text style={[styles.metaText, { color: theme.colors.mutedForeground }]}>
                  {formatFechaCorta(item.turno.fecha)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color={theme.colors.primary} />
                <Text style={[styles.metaText, { color: theme.colors.mutedForeground }]}>{item.turno.hora}</Text>
              </View>
            </View>
            {filtro === "proximos" && (
              <View style={{ marginTop: 12 }}>
                <PrimaryButton
                  label="Cancelar turno"
                  variant="outline"
                  onPress={() => handleCancelar(item.turno.id)}
                  accessibilityLabel="Cancelar turno"
                />
              </View>
            )}
          </Card>
        )}
      />
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
      style={[
        styles.tabButton,
        { backgroundColor: active ? theme.colors.background : "transparent" },
      ]}
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
  listContent: { paddingHorizontal: 24, paddingBottom: 120 },
  turnoCard: { marginBottom: 16 },
  turnoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  medicoNombre: { fontSize: 15, fontWeight: "600", flex: 1, marginRight: 8 },
  metaRow: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },
});
