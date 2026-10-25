import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CalendarX2, Clock, MapPin } from "lucide-react-native";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";

import { Calendario, Card, EmptyState, EncabezadoTab, ScreenContainer, StatusBadge, Text } from "@/components";
import { getMedicoActual, listAgendaMedico, TurnoDeAgenda } from "@/services";
import { useTheme } from "@/theme";
import { conservarSiIgual } from "@/utils/estable";
import { formatFechaLarga, hoyIso } from "@/utils/format";

/** Meses hacia atrás y hacia adelante que se pueden recorrer en el calendario. */
const MESES_RANGO = 6;

/** Agenda del profesional: calendario del mes con los días que tienen turnos y, debajo, los turnos del día elegido. */
export default function DoctorAgendaScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [agenda, setAgenda] = useState<TurnoDeAgenda[]>([]);
  const [fecha, setFecha] = useState(hoyIso);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        const medico = await getMedicoActual();
        const turnos = await listAgendaMedico(medico.id);
        if (activo) setAgenda((anterior) => conservarSiIgual(anterior, turnos));
      })();
      return () => {
        activo = false;
      };
    }, []),
  );

  const { desde, hasta } = useMemo(() => {
    const hoy = new Date();
    return {
      desde: format(startOfMonth(subMonths(hoy, MESES_RANGO)), "yyyy-MM-dd"),
      hasta: format(endOfMonth(addMonths(hoy, MESES_RANGO)), "yyyy-MM-dd"),
    };
  }, []);

  // Se marcan los días con turnos que ocupan el horario (los cancelados y rechazados lo liberan).
  const diasConTurnos = useMemo(
    () =>
      Array.from(
        new Set(
          agenda
            .filter(({ turno }) => turno.estado !== "cancelado" && turno.estado !== "rechazado")
            .map(({ turno }) => turno.fecha),
        ),
      ),
    [agenda],
  );

  const delDia = agenda.filter(({ turno }) => turno.fecha === fecha);
  const activosDelDia = delDia.filter(({ turno }) => turno.estado !== "cancelado" && turno.estado !== "rechazado").length;

  return (
    <ScreenContainer>
      <EncabezadoTab titulo="Agenda" />

      <Calendario valor={fecha} onChange={setFecha} desde={desde} hasta={hasta} diasMarcados={diasConTurnos} />

      <View style={styles.encabezadoDia}>
        <Text variant="heading" style={[styles.tituloDia, { color: theme.colors.foreground }]}>
          {fecha === hoyIso() ? "Hoy" : formatFechaLarga(fecha)}
        </Text>
        <Text style={[styles.cantidad, { color: theme.colors.mutedForeground }]}>
          {activosDelDia} {activosDelDia === 1 ? "turno" : "turnos"}
        </Text>
      </View>

      {delDia.length === 0 ? (
        <EmptyState icon={CalendarX2} titulo="Sin turnos" descripcion="No tenés turnos este día. Los días con turnos tienen un punto en el calendario." />
      ) : (
        delDia.map(({ turno, paciente, institucion, sede }) => (
          <Card
            key={turno.id}
            style={styles.turno}
            onPress={() => router.push(`/(doctor)/paciente/${turno.pacienteId}`)}
            accessibilityLabel={`${turno.hora}, ${paciente ? `${paciente.nombre} ${paciente.apellido}` : "paciente"}, turno ${turno.estado}. Ver ficha`}
          >
            <View style={styles.fila}>
              <View style={[styles.hora, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }]}>
                <Clock size={14} color={theme.colors.accentForeground} />
                <Text style={[styles.horaTexto, { color: theme.colors.accentForeground }]}>{turno.hora}</Text>
              </View>
              <Text style={[styles.paciente, { color: theme.colors.foreground }]} numberOfLines={1}>
                {paciente ? `${paciente.nombre} ${paciente.apellido}` : "Paciente"}
              </Text>
              <StatusBadge estado={turno.estado} />
            </View>
            {sede ? (
              <View style={styles.lugar}>
                <MapPin size={12} color={theme.colors.mutedForeground} />
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                  {institucion?.nombre ?? sede.nombre}
                </Text>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  encabezadoDia: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: 24, marginBottom: 12 },
  tituloDia: { flex: 1, fontSize: 17, fontWeight: "700", textTransform: "capitalize" },
  cantidad: { fontSize: 13 },
  turno: { marginBottom: 10 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  hora: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  horaTexto: { fontSize: 13, fontWeight: "700" },
  paciente: { flex: 1, fontSize: 15, fontWeight: "600" },
  lugar: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  meta: { fontSize: 12 },
});
