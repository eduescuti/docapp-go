import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CalendarCheck, CalendarDays, Clock, Hourglass, MapPin, Users } from "lucide-react-native";
import { addDays, format } from "date-fns";

import { AvisoProfesional, Card, ScreenContainer, SectionHeader, StatCard, StatusBadge, Text } from "@/components";
import { Especialidad, Medico } from "@/domain";
import { getEspecialidad, getMedicoActual, listAgendaMedico, listMisFranjas, listPacientesAsignados, TurnoDeAgenda } from "@/services";
import { useTheme } from "@/theme";
import { conservarSiIgual } from "@/utils/estable";
import { formatFechaCorta, hoyIso } from "@/utils/format";

/** Inicio del profesional: resumen del día y próximos turnos agrupados por fecha. El calendario está en Agenda. */
export default function DoctorInicioScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [medico, setMedico] = useState<Medico | null>(null);
  const [especialidad, setEspecialidad] = useState<Especialidad | undefined>();
  const [proximos, setProximos] = useState<TurnoDeAgenda[]>([]);
  const [cantidadAsignados, setCantidadAsignados] = useState(0);
  const [sinHorarios, setSinHorarios] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        const m = await getMedicoActual();
        const hoy = hoyIso();
        // Un solo pedido por dato: la agenda ya viene con paciente y lugar.
        const [esp, agenda, asignados, franjas] = await Promise.all([
          getEspecialidad(m.especialidadId),
          listAgendaMedico(m.id),
          listPacientesAsignados(m.id),
          listMisFranjas(),
        ]);
        const futuros = agenda.filter(
          ({ turno }) =>
            turno.fecha >= hoy && turno.estado !== "cancelado" && turno.estado !== "completado" && turno.estado !== "rechazado",
        );
        if (!activo) return;
        setMedico(m);
        setEspecialidad(esp);
        setProximos((anterior) => conservarSiIgual(anterior, futuros));
        setCantidadAsignados(asignados.length);
        setSinHorarios(franjas.length === 0);
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
  const pendientes = proximos.filter(({ turno }) => turno.estado === "pendiente").length;

  const porFecha = proximos.reduce<Record<string, TurnoDeAgenda[]>>((acc, item) => {
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

      {medico ? (
        <AvisoProfesional
          sinCoberturas={medico.coberturas.length === 0}
          sinHorarios={sinHorarios}
          onCargarCoberturas={() => router.push("/(doctor)/coberturas")}
          onCargarHorarios={() => router.push("/(doctor)/horarios")}
          style={styles.aviso}
        />
      ) : null}

      <View style={styles.stats}>
        <StatCard icon={CalendarCheck} valor={turnosHoy} etiqueta="Turnos hoy" />
        <StatCard icon={CalendarDays} valor={turnosSemana} etiqueta="Próximos 7 días" />
        <StatCard icon={Users} valor={cantidadAsignados} etiqueta="Pacientes" />
      </View>

      {pendientes > 0 ? (
        <View
          style={[styles.pendientes, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }]}
          accessible
          accessibilityLabel={`${pendientes} ${pendientes === 1 ? "turno pendiente" : "turnos pendientes"} de confirmar`}
        >
          <Hourglass size={18} color={theme.colors.accentForeground} />
          <Text style={[styles.pendientesTexto, { color: theme.colors.accentForeground }]}>
            {pendientes === 1 ? "Tenés 1 turno pendiente" : `Tenés ${pendientes} turnos pendientes`} de confirmar. Tocalo para
            confirmarlo o rechazarlo desde la ficha del paciente.
          </Text>
        </View>
      ) : null}

      <SectionHeader title="Próximos turnos" />
      {proximos.length === 0 && (
        <Text style={{ color: theme.colors.mutedForeground }}>No tenés turnos próximos.</Text>
      )}
      {Object.entries(porFecha).map(([fecha, items]) => (
        <View key={fecha} style={{ marginBottom: 20 }}>
          <Text style={[styles.fecha, { color: theme.colors.primary }]}>
            {fecha === hoy ? "Hoy" : formatFechaCorta(fecha)}
          </Text>
          {items.map(({ turno, paciente, sede, institucion }) => (
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
                  {paciente ? (
                    <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>DNI {paciente.dni}</Text>
                  ) : null}
                </View>
                <StatusBadge estado={turno.estado} />
              </View>
              {sede && (
                <View style={styles.sedeRow}>
                  <MapPin size={12} color={theme.colors.mutedForeground} />
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                    {institucion?.nombre ?? sede.nombre}
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
  aviso: { marginTop: 20, marginBottom: 0 },
  stats: { flexDirection: "row", gap: 10, marginTop: 24, marginBottom: 20 },
  pendientes: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, marginBottom: 24 },
  pendientesTexto: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "500" },
  fecha: { fontSize: 13, fontWeight: "700", marginBottom: 10, textTransform: "capitalize" },
  turnoCard: { marginBottom: 10 },
  turnoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  hora: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  horaText: { fontSize: 13, fontWeight: "700" },
  paciente: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  sedeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
});
