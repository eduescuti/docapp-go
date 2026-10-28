import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { MessageSquareHeart } from "lucide-react-native";

import { BackHeader, Card, EmptyState, PrimaryButton, ScreenContainer, SectionHeader, StarRating, Text } from "@/components";
import { Feedback, Medico, Turno } from "@/domain";
import { getMedico, getPacienteActual, listFeedbackPaciente, listTurnosParaCalificar } from "@/services";
import { useTheme } from "@/theme";
import { tomarAviso } from "@/utils/avisoAlVolver";
import { formatFechaLarga, nombreConTitulo } from "@/utils/format";

/**
 * Feedback: turnos cumplidos para calificar y opiniones ya enviadas. Solo se puede
 * opinar sobre un turno real cumplido con ese profesional (regla #6).
 */
export default function FeedbackScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [pendientes, setPendientes] = useState<{ turno: Turno; medico?: Medico }[]>([]);
  const [enviados, setEnviados] = useState<{ feedback: Feedback; medico?: Medico }[]>([]);
  const [cargado, setCargado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setAviso(tomarAviso());
      (async () => {
        const p = await getPacienteActual();
        const [turnos, feedbacks] = await Promise.all([listTurnosParaCalificar(p.id), listFeedbackPaciente(p.id)]);
        setPendientes(await Promise.all(turnos.map(async (turno) => ({ turno, medico: await getMedico(turno.medicoId) }))));
        setEnviados(await Promise.all(feedbacks.map(async (feedback) => ({ feedback, medico: await getMedico(feedback.medicoId) }))));
        setCargado(true);
      })();
    }, []),
  );

  return (
    <ScreenContainer>
      <BackHeader titulo="Feedback" subtitulo="Tu opinión ayuda a otros pacientes" />

      {aviso ? (
        <Text style={[styles.aviso, { color: theme.colors.success }]} accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : null}

      <SectionHeader title="Para calificar" />
      {cargado && pendientes.length === 0 && (
        <EmptyState
          icon={MessageSquareHeart}
          titulo="No tenés consultas para calificar"
          descripcion="Después de cada turno cumplido vas a poder contar cómo te fue."
        />
      )}
      {pendientes.map(({ turno, medico }) => (
        <Card key={turno.id} style={styles.card}>
          <Text style={[styles.nombre, { color: theme.colors.foreground }]}>{medico ? nombreConTitulo(medico) : "Profesional"}</Text>
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
            {formatFechaLarga(turno.fecha)} · {turno.hora} h
          </Text>
          <View style={{ marginTop: 12 }}>
            <PrimaryButton
              label="Calificar"
              onPress={() => router.push(`/cuenta/calificar/${turno.id}`)}
              accessibilityLabel={`Calificar consulta con ${medico ? nombreConTitulo(medico) : "el profesional"}`}
            />
          </View>
        </Card>
      ))}

      {enviados.length > 0 && (
        <>
          <View style={{ height: 16 }} />
          <SectionHeader title="Tus opiniones" />
          {enviados.map(({ feedback, medico }) => (
            <Card key={feedback.id} style={styles.card}>
              <View style={styles.enviadoHeader}>
                <Text style={[styles.nombre, { color: theme.colors.foreground, flex: 1 }]}>
                  {medico ? nombreConTitulo(medico) : "Profesional"}
                </Text>
                <StarRating value={feedback.estrellas} size={14} />
              </View>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{formatFechaLarga(feedback.fecha)}</Text>
              {feedback.comentario ? (
                <Text style={[styles.comentario, { color: theme.colors.foreground }]}>“{feedback.comentario}”</Text>
              ) : null}
            </Card>
          ))}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  aviso: { fontSize: 13, marginBottom: 12 },
  nombre: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  enviadoHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  comentario: { fontSize: 13, marginTop: 10, fontStyle: "italic", lineHeight: 19 },
});
