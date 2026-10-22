import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, TextInput, View } from "react-native";
import { CalendarClock, ChevronRight, Search } from "lucide-react-native";

import { Avatar, Card, ScreenContainer, Text } from "@/components";
import { Paciente, PlanMedico, Turno } from "@/domain";
import { getMedicoActual, listPacientesAsignados, listPlanesMedicos, listTurnosMedico } from "@/services";
import { useTheme } from "@/theme";
import { formatFechaCorta, hoyIso, iniciales } from "@/utils/format";
import { normalizarDni } from "@/utils/validation";

interface PacienteAsignado {
  paciente: Paciente;
  plan?: PlanMedico;
  proximoTurno?: Turno;
}

/** Pacientes que el profesional tiene asignados (con turno próximo), con buscador por nombre o DNI. */
export default function DoctorPacientesScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [items, setItems] = useState<PacienteAsignado[]>([]);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        const medico = await getMedicoActual();
        const [pacientes, turnos, planes] = await Promise.all([
          listPacientesAsignados(medico.id),
          listTurnosMedico(medico.id),
          listPlanesMedicos(),
        ]);
        const hoy = hoyIso();
        const lista = pacientes.map((paciente) => ({
          paciente,
          plan: planes.find((p) => p.id === paciente.planMedicoId),
          proximoTurno: turnos.find(
            (t) =>
              t.pacienteId === paciente.id &&
              t.fecha >= hoy &&
              t.estado !== "cancelado" &&
              t.estado !== "completado" &&
              t.estado !== "rechazado",
          ),
        }));
        lista.sort((a, b) =>
          `${a.proximoTurno?.fecha}${a.proximoTurno?.hora}`.localeCompare(`${b.proximoTurno?.fecha}${b.proximoTurno?.hora}`),
        );
        if (activo) setItems(lista);
      })();
      return () => {
        activo = false;
      };
    }, []),
  );

  const q = query.trim().toLowerCase();
  const filtrados = items.filter(({ paciente }) => {
    if (!q) return true;
    const nombre = `${paciente.nombre} ${paciente.apellido}`.toLowerCase();
    return nombre.includes(q) || paciente.dni.includes(normalizarDni(q));
  });

  return (
    <ScreenContainer>
      <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>Mis pacientes</Text>
      <Text style={[styles.sub, { color: theme.colors.mutedForeground }]}>
        Pacientes con turnos próximos con vos.
      </Text>

      <View
        style={[
          styles.search,
          { backgroundColor: theme.colors.muted, borderColor: theme.colors.border, borderRadius: theme.radii.md },
        ]}
      >
        <Search size={18} color={theme.colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre o DNI"
          placeholderTextColor={theme.colors.mutedForeground}
          accessibilityLabel="Buscar paciente por nombre o DNI"
          autoCorrect={false}
          style={[styles.searchInput, { color: theme.colors.foreground, fontFamily: theme.fonts.body }]}
        />
      </View>

      {filtrados.length === 0 && (
        <Text style={{ color: theme.colors.mutedForeground }}>
          {items.length === 0 ? "Todavía no tenés pacientes con turnos próximos." : "No hay pacientes que coincidan."}
        </Text>
      )}

      {filtrados.map(({ paciente, plan, proximoTurno }) => (
        <Card
          key={paciente.id}
          style={styles.card}
          onPress={() => router.push(`/(doctor)/paciente/${paciente.id}`)}
          accessibilityLabel={`Ver ficha de ${paciente.nombre} ${paciente.apellido}`}
        >
          <View style={styles.row}>
            <Avatar iniciales={iniciales(paciente.nombre, paciente.apellido)} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.nombre, { color: theme.colors.foreground }]} numberOfLines={1}>
                {paciente.nombre} {paciente.apellido}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                DNI {paciente.dni}
                {plan ? ` · ${plan.nombre}` : ""}
              </Text>
              {proximoTurno && (
                <View style={styles.turnoRow}>
                  <CalendarClock size={12} color={theme.colors.primary} />
                  <Text style={[styles.meta, { color: theme.colors.primary }]}>
                    {formatFechaCorta(proximoTurno.fecha)} · {proximoTurno.hora}
                  </Text>
                </View>
              )}
            </View>
            <ChevronRight size={18} color={theme.colors.mutedForeground} />
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700" },
  sub: { fontSize: 13, marginTop: 4, marginBottom: 20 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingHorizontal: 14, minHeight: 48, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 12 },
  card: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  nombre: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  turnoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
});
