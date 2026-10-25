import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Calendar } from "lucide-react-native";

import { BackHeader, Card, PrimaryButton, ScreenContainer, SelectField, SelectOption, Text, TextField } from "@/components";
import { Medico, Paciente } from "@/domain";
import { crearOrden, getMedicoActual, getPaciente, LugarDeAtencion, listLugaresDeAtencion } from "@/services";
import { useTheme } from "@/theme";
import { dejarAviso } from "@/utils/avisoAlVolver";
import { formatFechaLarga, hoyIso } from "@/utils/format";

/**
 * El profesional le asigna una orden médica al paciente: qué estudios, con qué indicaciones y dónde hacerlos
 * (uno de sus lugares de atención). La fecha es la de hoy. El paciente la ve en Estudios › Órdenes.
 */
export default function NuevaOrdenScreen() {
  const { pacienteId } = useLocalSearchParams<{ pacienteId: string }>();
  const { theme } = useTheme();
  const router = useRouter();

  const [medico, setMedico] = useState<Medico | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [lugares, setLugares] = useState<LugarDeAtencion[]>([]);
  const [estudios, setEstudios] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [institucionId, setInstitucionId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Las pestañas dejan la pantalla montada: cada vez que se abre, el formulario arranca vacío.
  useFocusEffect(
    useCallback(() => {
      setEstudios("");
      setIndicaciones("");
      setError(null);
      (async () => {
        const m = await getMedicoActual();
        const [p, l] = await Promise.all([getPaciente(pacienteId), listLugaresDeAtencion(m.sedesIds)]);
        setMedico(m);
        setPaciente(p ?? null);
        setLugares(l);
        // Si atiende en un solo lugar, queda elegido.
        const instituciones = new Set(l.map((x) => x.institucion.id));
        setInstitucionId(instituciones.size === 1 ? l[0].institucion.id : null);
      })();
    }, [pacienteId]),
  );

  // Un lugar por institución (un hospital puede tener varias sedes del mismo profesional).
  const opciones: SelectOption[] = lugares
    .filter((l, i) => lugares.findIndex((x) => x.institucion.id === l.institucion.id) === i)
    .map((l) => ({ value: l.institucion.id, label: l.institucion.nombre, description: `${l.sede.direccion}, ${l.sede.ciudad}` }));

  const listaEstudios = estudios.split("\n").map((e) => e.trim()).filter(Boolean);
  const completo = listaEstudios.length > 0 && indicaciones.trim().length > 0 && !!institucionId;

  const guardar = async () => {
    if (!medico || !paciente || !institucionId) return;
    setError(null);
    setGuardando(true);
    try {
      await crearOrden({
        medicoId: medico.id,
        pacienteId: paciente.id,
        institucionId,
        estudiosSolicitados: listaEstudios,
        indicaciones,
      });
      dejarAviso(`Asignaste la orden a ${paciente.nombre}. Ya la ve en Estudios › Órdenes.`);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo asignar la orden.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenContainer>
        <BackHeader
          titulo="Asignar orden médica"
          subtitulo={paciente ? `Para ${paciente.nombre} ${paciente.apellido}` : undefined}
        />

        <Card style={styles.fecha}>
          <Calendar size={16} color={theme.colors.primary} />
          <Text style={[styles.fechaTexto, { color: theme.colors.foreground }]}>Emitida hoy, {formatFechaLarga(hoyIso())}</Text>
        </Card>

        <TextField
          label="Estudios solicitados"
          value={estudios}
          onChangeText={setEstudios}
          placeholder={"Hemograma completo\nGlucemia en ayunas"}
          hint="Escribí un estudio por renglón."
          multiline
          maxLength={600}
        />
        <TextField
          label="Indicaciones"
          value={indicaciones}
          onChangeText={setIndicaciones}
          placeholder="Ayuno de 8 horas. Llevar la orden impresa o en el celular."
          hint="Lo que el paciente tiene que saber antes de ir."
          multiline
          maxLength={600}
        />
        <SelectField
          label="Dónde hacerlos"
          placeholder={opciones.length === 0 ? "No tenés lugares de atención" : "Elegí el hospital"}
          options={opciones}
          value={institucionId}
          onChange={setInstitucionId}
        />

        {error ? (
          <Text style={[styles.error, { color: theme.colors.danger }]} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <View style={styles.pie}>
          <PrimaryButton label="Asignar orden" onPress={guardar} disabled={!completo || !paciente} loading={guardando} />
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
