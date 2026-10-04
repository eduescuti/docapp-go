import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import { BackHeader, Card, PrimaryButton, ScreenContainer, StarRating, Text, TextField } from "@/components";
import { Feedback, Medico, Turno } from "@/domain";
import { crearFeedback, getMedico, getPacienteActual, getTurnoParaCalificar } from "@/services";
import { useTheme } from "@/theme";
import { etiquetaTipoConsulta, formatFechaLarga, nombreConTitulo } from "@/utils/format";

type Criterio = keyof Feedback["criterios"];
type Puntaje = 1 | 2 | 3 | 4 | 5;

const CRITERIOS: { key: Criterio; label: string }[] = [
  { key: "puntualidad", label: "Puntualidad" },
  { key: "atencion", label: "Atención" },
  { key: "trato", label: "Trato" },
  { key: "claridadExplicacion", label: "Claridad de la explicación" },
  { key: "experienciaGeneral", label: "Experiencia general" },
];

const SIN_PUNTAJE: Record<Criterio, number> = {
  puntualidad: 0,
  atencion: 0,
  trato: 0,
  claridadExplicacion: 0,
  experienciaGeneral: 0,
};

/** Formulario de calificación de un turno cumplido: estrellas generales, criterios y comentario opcional. */
export default function CalificarScreen() {
  const { turnoId } = useLocalSearchParams<{ turnoId: string }>();
  const { theme } = useTheme();
  const router = useRouter();

  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [turno, setTurno] = useState<Turno | null | undefined>(undefined);
  const [medico, setMedico] = useState<Medico | undefined>();
  const [estrellas, setEstrellas] = useState(0);
  const [criterios, setCriterios] = useState<Record<Criterio, number>>(SIN_PUNTAJE);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setEstrellas(0);
      setCriterios(SIN_PUNTAJE);
      setComentario("");
      setError(null);
      (async () => {
        const p = await getPacienteActual();
        const t = await getTurnoParaCalificar(p.id, turnoId);
        setPacienteId(p.id);
        setTurno(t ?? null);
        if (t) setMedico(await getMedico(t.medicoId));
      })();
    }, [turnoId]),
  );

  const completo = estrellas > 0 && Object.values(criterios).every((v) => v > 0);

  const enviar = async () => {
    if (!pacienteId || !completo) return;
    setError(null);
    setEnviando(true);
    try {
      await crearFeedback(pacienteId, turnoId, {
        estrellas: estrellas as Puntaje,
        criterios,
        comentario,
      });
      Alert.alert("¡Gracias!", "Tu opinión fue enviada.", [{ text: "Listo", onPress: () => router.back() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar tu opinión.");
    } finally {
      setEnviando(false);
    }
  };

  if (turno === null) {
    return (
      <ScreenContainer>
        <BackHeader titulo="Calificar consulta" />
        <Text style={{ color: theme.colors.mutedForeground }}>
          Este turno no está disponible para calificar: solo se pueden calificar turnos cumplidos una vez.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenContainer>
        <BackHeader titulo="Calificar consulta" />

        {turno && (
          <Card style={{ marginBottom: 20 }}>
            <Text style={[styles.nombre, { color: theme.colors.foreground }]}>{medico ? nombreConTitulo(medico) : "Profesional"}</Text>
            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
              {etiquetaTipoConsulta(turno.tipoConsulta)} · {formatFechaLarga(turno.fecha)}
            </Text>
          </Card>
        )}

        <Text variant="heading" style={[styles.pregunta, { color: theme.colors.foreground }]}>¿Cómo fue tu consulta?</Text>
        <View style={styles.centrado}>
          <StarRating value={estrellas} onChange={setEstrellas} size={32} label="Calificación general" />
        </View>

        <Card style={{ marginVertical: 20 }}>
          {CRITERIOS.map((c, i) => (
            <View key={c.key} style={[styles.criterio, i > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
              <Text style={[styles.criterioLabel, { color: theme.colors.foreground }]}>{c.label}</Text>
              <StarRating
                value={criterios[c.key]}
                onChange={(v) => setCriterios((prev) => ({ ...prev, [c.key]: v }))}
                size={18}
                label={c.label}
              />
            </View>
          ))}
        </Card>

        <TextField
          label="Comentario (opcional)"
          value={comentario}
          onChangeText={setComentario}
          placeholder="Contanos cómo te atendieron"
          multiline
          maxLength={500}
        />
        {error ? <Text style={{ color: theme.colors.danger, marginBottom: 12 }}>{error}</Text> : null}
        <PrimaryButton label="Enviar opinión" onPress={enviar} disabled={!completo} loading={enviando} />
        {!completo && (
          <Text style={[styles.ayuda, { color: theme.colors.mutedForeground }]}>Calificá la consulta y cada criterio para enviar.</Text>
        )}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  nombre: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  pregunta: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  centrado: { alignItems: "center" },
  criterio: { paddingVertical: 4 },
  criterioLabel: { fontSize: 13, fontWeight: "600", marginTop: 6 },
  ayuda: { fontSize: 12, textAlign: "center", marginTop: 10 },
});
