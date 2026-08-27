import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, PrimaryButton, Text } from "@/components";
import { Institucion, Medico, Sede } from "@/domain";
import { crearTurno, getInstitucion, getMedico, getPacienteActual } from "@/services";
import { useTheme } from "@/theme";

const HORARIOS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

function proximosDias(cantidad: number) {
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = addDays(new Date(), i);
    return {
      iso: format(fecha, "yyyy-MM-dd"),
      diaSemana: format(fecha, "EEE", { locale: es }).replace(/^\w/, (c) => c.toUpperCase()),
      diaMes: format(fecha, "d"),
    };
  });
}

export default function ReservarScreen() {
  const { medicoId } = useLocalSearchParams<{ medicoId: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [medico, setMedico] = useState<Medico | null>(null);
  const [institucion, setInstitucion] = useState<Institucion | null>(null);
  const [sede, setSede] = useState<Sede | null>(null);
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const dias = useMemo(() => proximosDias(5), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(dias[0].iso);
  const [horaSeleccionada, setHoraSeleccionada] = useState(HORARIOS[0]);

  useEffect(() => {
    getMedico(medicoId).then((m) => {
      if (!m) return;
      setMedico(m);
      getInstitucion(m.institucionesIds[0]).then((inst) => {
        setInstitucion(inst ?? null);
        setSede(inst?.sedes.find((s) => s.id === m.sedesIds[0]) ?? inst?.sedes[0] ?? null);
      });
    });
    getPacienteActual().then((p) => setPacienteId(p.id));
  }, [medicoId]);

  const confirmar = async () => {
    if (!medico || !sede || !pacienteId) return;
    setConfirmando(true);
    try {
      await crearTurno({
        pacienteId,
        medicoId: medico.id,
        sedeId: sede.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        tipoConsulta: "primera_consulta",
      });
      Alert.alert("Turno confirmado", "Tu turno fue reservado con éxito.", [
        { text: "OK", onPress: () => router.replace("/(paciente)/turnos") },
      ]);
    } catch (error) {
      Alert.alert("No pudimos reservar el turno", error instanceof Error ? error.message : "Intentá de nuevo.");
    } finally {
      setConfirmando(false);
    }
  };

  if (!medico) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={8}>
            <ArrowLeft size={20} color={theme.colors.foreground} />
          </Pressable>
          <Text variant="heading" style={[styles.headerTitle, { color: theme.colors.foreground }]}>
            Reservar turno
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          {format(new Date(), "MMMM yyyy", { locale: es })}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList} contentContainerStyle={{ gap: 8 }}>
          {dias.map((dia) => {
            const seleccionado = dia.iso === fechaSeleccionada;
            return (
              <Pressable
                key={dia.iso}
                onPress={() => setFechaSeleccionada(dia.iso)}
                accessibilityRole="button"
                accessibilityLabel={`Elegir ${dia.diaSemana} ${dia.diaMes}`}
                accessibilityState={{ selected: seleccionado }}
                style={[
                  styles.dateCell,
                  {
                    backgroundColor: seleccionado ? theme.colors.primary : theme.colors.card,
                    borderColor: seleccionado ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 12, color: seleccionado ? theme.colors.primaryForeground : theme.colors.mutedForeground }}>
                  {dia.diaSemana}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: seleccionado ? theme.colors.primaryForeground : theme.colors.foreground,
                  }}
                >
                  {dia.diaMes}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: theme.colors.foreground, marginTop: 24 }]}>Horarios disponibles</Text>
        <View style={styles.horariosGrid}>
          {HORARIOS.map((hora) => {
            const seleccionado = hora === horaSeleccionada;
            return (
              <Pressable
                key={hora}
                onPress={() => setHoraSeleccionada(hora)}
                accessibilityRole="button"
                accessibilityLabel={`Elegir horario ${hora}`}
                accessibilityState={{ selected: seleccionado }}
                style={[
                  styles.horaCell,
                  {
                    borderColor: seleccionado ? theme.colors.primary : theme.colors.border,
                    backgroundColor: seleccionado ? `${theme.colors.primary}1A` : theme.colors.card,
                  },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: seleccionado ? theme.colors.primary : theme.colors.foreground }}>
                  {hora}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {sede && (
          <Card style={{ backgroundColor: theme.colors.accent, borderWidth: 0, marginTop: 24 }}>
            <View style={styles.sedeRow}>
              <MapPin size={20} color={theme.colors.accentForeground} />
              <View>
                <Text style={[styles.sedeNombre, { color: theme.colors.foreground }]}>{institucion?.nombre}</Text>
                <Text style={[styles.sedeDireccion, { color: theme.colors.mutedForeground }]}>{sede.direccion}, {sede.ciudad}</Text>
              </View>
            </View>
          </Card>
        )}

        <View style={{ marginTop: 24 }}>
          <PrimaryButton label="Confirmar reserva" onPress={confirmar} loading={confirmando} accessibilityLabel="Confirmar reserva de turno" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 12, textTransform: "capitalize" },
  dateList: { flexGrow: 0 },
  dateCell: {
    width: 64,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  horariosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  horaCell: {
    width: "30%",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  sedeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sedeNombre: { fontSize: 14, fontWeight: "600" },
  sedeDireccion: { fontSize: 12, marginTop: 2 },
});
