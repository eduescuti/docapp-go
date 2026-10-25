import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Calendar } from "lucide-react-native";
import { addDays, format } from "date-fns";

import { BackHeader, Card, PrimaryButton, ScreenContainer, Text, TextField } from "@/components";
import { Medico, Paciente } from "@/domain";
import { crearReceta, getMedicoActual, getPaciente } from "@/services";
import { useTheme } from "@/theme";
import { dejarAviso } from "@/utils/avisoAlVolver";
import { formatFechaLarga, hoyIso } from "@/utils/format";

/**
 * El profesional le asigna una receta al paciente: medicamento, dosis, cómo tomarla, duración e indicaciones.
 * La fecha de emisión es la de hoy y la duración define hasta cuándo es activa (después pasa a Pasadas).
 */
export default function NuevaRecetaScreen() {
  const { pacienteId } = useLocalSearchParams<{ pacienteId: string }>();
  const { theme } = useTheme();
  const router = useRouter();

  const [medico, setMedico] = useState<Medico | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [medicacion, setMedicacion] = useState("");
  const [dosis, setDosis] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [duracion, setDuracion] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Las pestañas dejan la pantalla montada: cada vez que se abre, el formulario arranca vacío.
  useFocusEffect(
    useCallback(() => {
      setMedicacion("");
      setDosis("");
      setFrecuencia("");
      setDuracion("");
      setIndicaciones("");
      setError(null);
      (async () => {
        const [m, p] = await Promise.all([getMedicoActual(), getPaciente(pacienteId)]);
        setMedico(m);
        setPaciente(p ?? null);
      })();
    }, [pacienteId]),
  );

  const dias = /^\d{1,3}$/.test(duracion.trim()) ? Number(duracion.trim()) : NaN;
  const duracionValida = Number.isInteger(dias) && dias >= 1 && dias <= 365;
  const completo = !!medicacion.trim() && !!dosis.trim() && !!frecuencia.trim() && duracionValida;

  const guardar = async () => {
    if (!medico || !paciente) return;
    setError(null);
    setGuardando(true);
    try {
      await crearReceta({
        medicoId: medico.id,
        pacienteId: paciente.id,
        medicacion,
        dosis,
        frecuencia,
        duracionDias: dias,
        indicaciones,
      });
      dejarAviso(`Asignaste la receta a ${paciente.nombre}. Ya la ve en Recetas › Activas.`);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo asignar la receta.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenContainer>
        <BackHeader
          titulo="Asignar receta"
          subtitulo={paciente ? `Para ${paciente.nombre} ${paciente.apellido}` : undefined}
        />

        <Card style={styles.fecha}>
          <Calendar size={16} color={theme.colors.primary} />
          <Text style={[styles.fechaTexto, { color: theme.colors.foreground }]}>Emitida hoy, {formatFechaLarga(hoyIso())}</Text>
        </Card>

        <TextField
          label="Medicamento"
          value={medicacion}
          onChangeText={setMedicacion}
          placeholder="Amoxicilina 500mg"
          maxLength={120}
        />
        <TextField label="Dosis" value={dosis} onChangeText={setDosis} placeholder="1 comprimido" maxLength={80} />
        <TextField
          label="Cómo tomarla"
          value={frecuencia}
          onChangeText={setFrecuencia}
          placeholder="Cada 8 horas, con las comidas"
          maxLength={120}
        />
        <TextField
          label="Duración (días)"
          value={duracion}
          onChangeText={(texto) => setDuracion(texto.replace(/\D/g, ""))}
          placeholder="10"
          keyboardType="number-pad"
          maxLength={3}
          error={duracion && !duracionValida ? "Tiene que ser de 1 a 365 días." : undefined}
          hint={
            duracionValida
              ? `Activa hasta el ${formatFechaLarga(format(addDays(new Date(), dias), "yyyy-MM-dd"))}.`
              : "Define hasta cuándo la receta está activa."
          }
        />
        <TextField
          label="Indicaciones (opcional)"
          value={indicaciones}
          onChangeText={setIndicaciones}
          placeholder="Completar el tratamiento aunque los síntomas mejoren."
          multiline
          maxLength={600}
        />

        {error ? (
          <Text style={[styles.error, { color: theme.colors.danger }]} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <View style={styles.pie}>
          <PrimaryButton label="Asignar receta" onPress={guardar} disabled={!completo || !paciente} loading={guardando} />
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fecha: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  fechaTexto: { fontSize: 13, fontWeight: "500" },
  error: { fontSize: 13, marginBottom: 12 },
  pie: { marginTop: 8 },
});
