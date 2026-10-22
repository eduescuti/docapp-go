import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CalendarCheck, CalendarDays, Clock, MapPin, Users } from "lucide-react-native";
import { addDays, format } from "date-fns";

import { Card, ScreenContainer, SectionHeader, StatCard, StatusBadge, Text } from "@/components";
import { Especialidad, Medico, Paciente, Sede, Turno } from "@/domain";
import {
  getEspecialidad,
  getMedicoActual,
  getSede,
  listPacientes,
  listPacientesAsignados,
  listTurnosMedico,
} from "@/services";
import { useTheme } from "@/theme";
import { etiquetaTipoConsulta, formatFechaCorta, hoyIso } from "@/utils/format";

interface TurnoAgenda {
  turno: Turno;
  paciente?: Paciente;
  sede?: Sede;
}

/** Agenda del profesional: resumen del día y próximos turnos agrupados por fecha. */
export default function DoctorAgendaScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [medico, setMedico] = useState<Medico | null>(null);
  const [especialidad, setEspecialidad] = useState<Especialidad | undefined>();
  const [proximos, setProximos] = useState<TurnoAgenda[]>([]);
  const [cantidadAsignados, setCantidadAsignados] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        const m = await getMedicoActual();
        const hoy = hoyIso();
        const [esp, turnos, pacientes, asignados] = await Promise.all([
          getEspecialidad(m.especialidadId),
          listTurnosMedico(m.id),
          listPacientes(),
          listPacientesAsignados(m.id),
        ]);
        const futuros = turnos.filter(
          (t) => t.fecha >= hoy && t.estado !== "cancelado" && t.estado !== "completado" && t.estado !== "rechazado",
        );
        const conDatos = await Promise.all(
          futuros.map(async (turno) => ({
            turno,
            paciente: pacientes.find((p) => p.id === turno.pacienteId),
            sede: await getSede(turno.sedeId),
          })),
        );
        if (!activo) return;
        setMedico(m);
        setEspecialidad(esp);
        setProximos(conDatos);
        setCantidadAsignados(asignados.length);
      })();
      return () => {
        activo = false;
      };
    }, []),
  );

  const hoy = hoyIso();
  const enUnaSemana = format(addDays(new Date(), 7), "yyyy-MM-dd");
  const turnosHoy = proximos.filter(({ turno }) => turno.fecha === hoy).length;
  const turnosSemana = proximos.filter(({ turno }) => turno.fecha <= enUnaSemana).length;

  const porFecha = proximos.reduce<Record<string, TurnoAgenda[]>>((acc, item) => {
    (acc[item.turno.fecha] ??= []).push(item);
    return acc;
  }, {});

  return (
    <ScreenContainer>
      <Text style={[styles.saludo, { color: theme.colors.mutedForeground }]}>Hola,</Text>
      <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
        {medico ? `${medico.nombre} ${medico.apellido}` : "Cargando..."}
      </Text>
      {medico && (
        <Text style={[styles.sub, { color: theme.colors.mutedForeground }]}>
          {medico.profesion}
          {especialidad ? ` · ${especialidad.nombre}` : ""} · Mat. {medico.matricula}
        </Text>
      )}

      <View style={styles.stats}>
        <StatCard icon={CalendarCheck} valor={turnosHoy} etiqueta="Turnos hoy" />
        <StatCard icon={CalendarDays} valor={turnosSemana} etiqueta="Próximos 7 días" />
        <StatCard icon={Users} valor={cantidadAsignados} etiqueta="Pacientes" />
      </View>

      <SectionHeader title="Próximos turnos" />
      {proximos.length === 0 && (
        <Text style={{ color: theme.colors.mutedForeground }}>No tenés turnos próximos.</Text>
      )}
      {Object.entries(porFecha).map(([fecha, items]) => (
        <View key={fecha} style={{ marginBottom: 20 }}>
          <Text style={[styles.fecha, { color: theme.colors.primary }]}>
            {fecha === hoy ? "Hoy" : formatFechaCorta(fecha)}
          </Text>
          {items.map(({ turno, paciente, sede }) => (
            <Card
              key={turno.id}
              style={styles.turnoCard}
              onPress={() => router.push(`/(doctor)/paciente/${turno.pacienteId}`)}
              accessibilityLabel={`Turno ${turno.hora} con ${paciente?.nombre ?? ""} ${paciente?.apellido ?? ""}`}
            >
              <View style={styles.turnoRow}>
                <View style={[styles.hora, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }]}>
                  <Clock size={14} color={theme.colors.accentForeground} />
                  <Text style={[styles.horaText, { color: theme.colors.accentForeground }]}>{turno.hora}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paciente, { color: theme.colors.foreground }]} numberOfLines={1}>
                    {paciente ? `${paciente.nombre} ${paciente.apellido}` : "Paciente"}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                    {etiquetaTipoConsulta(turno.tipoConsulta)}
                  </Text>
                </View>
                <StatusBadge estado={turno.estado} />
              </View>
              {sede && (
                <View style={styles.sedeRow}>
                  <MapPin size={12} color={theme.colors.mutedForeground} />
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                    {sede.nombre}
                  </Text>
                </View>
              )}
            </Card>
          ))}
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  saludo: { fontSize: 14 },
  nombre: { fontSize: 24, fontWeight: "700", marginTop: 2 },
  sub: { fontSize: 13, marginTop: 4 },
  stats: { flexDirection: "row", gap: 10, marginTop: 24, marginBottom: 28 },
  fecha: { fontSize: 13, fontWeight: "700", marginBottom: 10, textTransform: "capitalize" },
  turnoCard: { marginBottom: 10 },
  turnoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  hora: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  horaText: { fontSize: 13, fontWeight: "700" },
  paciente: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  sedeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
});
