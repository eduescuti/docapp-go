import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Calendar, ClipboardList, FileText, Lock, Pill, StickyNote } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import {
  Avatar,
  BackHeader,
  Card,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  StatusBadge,
  Text,
  TextField,
} from "@/components";
import { Estudio, Medico, NotaPaciente, Paciente, PlanMedico, Receta, Turno } from "@/domain";
import {
  crearNotaPaciente,
  getMedicoActual,
  getPaciente,
  getPlanMedico,
  listEstudiosSolicitados,
  listNotasPaciente,
  listRecetasEmitidas,
  listTurnosMedico,
} from "@/services";
import { useTheme } from "@/theme";
import { etiquetaTipoConsulta, formatFechaCorta, formatFechaHora, hoyIso, iniciales } from "@/utils/format";

interface Ficha {
  medico: Medico;
  paciente: Paciente;
  plan?: PlanMedico;
  turnos: Turno[];
  recetas: Receta[];
  estudios: Estudio[];
  notas: NotaPaciente[];
}

/**
 * Ficha del paciente vista por el profesional. Solo muestra lo que ese profesional
 * generó (turnos, recetas, estudios y notas propias) y solo si existe un vínculo
 * real por turnos (CLAUDE.md §10, regla 8).
 */
export default function DoctorPacienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [nuevaNota, setNuevaNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorNota, setErrorNota] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const medico = await getMedicoActual();
    const [paciente, turnosMedico] = await Promise.all([getPaciente(id), listTurnosMedico(medico.id)]);
    const turnos = turnosMedico.filter((t) => t.pacienteId === id);
    if (!paciente || turnos.length === 0) {
      setSinAcceso(true);
      return;
    }
    const [plan, recetas, estudios, notas] = await Promise.all([
      getPlanMedico(paciente.planMedicoId),
      listRecetasEmitidas(medico.id, paciente.id),
      listEstudiosSolicitados(medico.id, paciente.id),
      listNotasPaciente(medico.id, paciente.id),
    ]);
    setSinAcceso(false);
    setFicha({ medico, paciente, plan, turnos, recetas, estudios, notas });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const handleGuardarNota = async () => {
    if (!ficha) return;
    setErrorNota(null);
    setGuardando(true);
    try {
      await crearNotaPaciente(ficha.medico.id, ficha.paciente.id, nuevaNota);
      setNuevaNota("");
      setFicha({ ...ficha, notas: await listNotasPaciente(ficha.medico.id, ficha.paciente.id) });
    } catch (e) {
      setErrorNota(e instanceof Error ? e.message : "No se pudo guardar la nota.");
    } finally {
      setGuardando(false);
    }
  };

  if (sinAcceso) {
    return (
      <ScreenContainer>
        <BackHeader titulo="Paciente" />
        <Card style={styles.sinAcceso}>
          <Lock size={28} color={theme.colors.mutedForeground} />
          <Text style={{ color: theme.colors.mutedForeground, textAlign: "center" }}>
            No tenés acceso a la ficha de este paciente porque no tiene turnos con vos.
          </Text>
        </Card>
      </ScreenContainer>
    );
  }

  if (!ficha) {
    return (
      <ScreenContainer>
        <BackHeader titulo="Paciente" />
        <Text style={{ color: theme.colors.mutedForeground }}>Cargando...</Text>
      </ScreenContainer>
    );
  }

  const { paciente, plan, turnos, recetas, estudios, notas } = ficha;
  const hoy = hoyIso();
  const proximos = turnos.filter((t) => t.fecha >= hoy && t.estado !== "cancelado" && t.estado !== "completado");
  const historial = turnos
    .filter((t) => !proximos.includes(t))
    .sort((a, b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`));

  return (
    <ScreenContainer>
      <BackHeader titulo="Ficha del paciente" />

      <Card style={{ marginBottom: 28 }}>
        <View style={styles.perfilRow}>
          <Avatar iniciales={iniciales(paciente.nombre, paciente.apellido)} size={56} />
          <View style={{ flex: 1 }}>
            <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
              {paciente.nombre} {paciente.apellido}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>DNI {paciente.dni}</Text>
          </View>
        </View>
        <Dato label="Cobertura" valor={plan?.nombre ?? "—"} />
      </Card>

      <SectionHeader title="Próximos turnos" />
      {proximos.length === 0 ? (
        <Vacio texto="No tiene turnos próximos con vos." />
      ) : (
        proximos.map((t) => <TurnoItem key={t.id} turno={t} />)
      )}

      <View style={{ height: 16 }} />
      <SectionHeader title="Historial con vos" />
      {historial.length === 0 && recetas.length === 0 && estudios.length === 0 ? (
        <Vacio texto="Todavía no hay atenciones registradas." />
      ) : (
        <>
          {historial.map((t) => (
            <TurnoItem key={t.id} turno={t} />
          ))}
          {recetas.map((r) => (
            <ItemHistorial
              key={r.id}
              icon={Pill}
              titulo={`Receta: ${r.medicacion}`}
              detalle={`${formatFechaCorta(r.fecha)} · ${r.dosis}, ${r.frecuencia.toLowerCase()}`}
            />
          ))}
          {estudios.map((e) => (
            <ItemHistorial
              key={e.id}
              icon={FileText}
              titulo={`Estudio: ${e.tipo}`}
              detalle={formatFechaCorta(e.fecha)}
            />
          ))}
        </>
      )}

      <View style={{ height: 16 }} />
      <SectionHeader title="Notas" />
      <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: -8, marginBottom: 12 }]}>
        Solo vos podés ver las notas que escribís.
      </Text>
      <TextField
        label="Nueva nota"
        value={nuevaNota}
        onChangeText={setNuevaNota}
        placeholder="Indicaciones, observaciones de la consulta..."
        multiline
        maxLength={1000}
        error={errorNota ?? undefined}
      />
      <PrimaryButton
        label="Guardar nota"
        onPress={handleGuardarNota}
        disabled={!nuevaNota.trim()}
        loading={guardando}
      />
      <View style={{ height: 16 }} />
      {notas.length === 0 ? (
        <Vacio texto="Todavía no escribiste notas sobre este paciente." />
      ) : (
        notas.map((n) => (
          <Card key={n.id} style={styles.item}>
            <View style={styles.notaHeader}>
              <StickyNote size={14} color={theme.colors.primary} />
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{formatFechaHora(n.fecha)}</Text>
            </View>
            <Text style={{ color: theme.colors.foreground, fontSize: 14, lineHeight: 20 }}>{n.texto}</Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

function TurnoItem({ turno }: { turno: Turno }) {
  const { theme } = useTheme();
  return (
    <Card style={styles.item}>
      <View style={styles.itemRow}>
        <Calendar size={16} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>
            {etiquetaTipoConsulta(turno.tipoConsulta)}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
            {formatFechaCorta(turno.fecha)} · {turno.hora}
          </Text>
        </View>
        <StatusBadge estado={turno.estado} />
      </View>
    </Card>
  );
}

function ItemHistorial({ icon: Icon, titulo, detalle }: { icon: LucideIcon; titulo: string; detalle: string }) {
  const { theme } = useTheme();
  return (
    <Card style={styles.item}>
      <View style={styles.itemRow}>
        <Icon size={16} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{titulo}</Text>
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{detalle}</Text>
        </View>
      </View>
    </Card>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.datoRow, { borderTopColor: theme.colors.border }]}>
      <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 0 }]}>{label}</Text>
      <Text style={[styles.datoValor, { color: theme.colors.foreground }]} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

function Vacio({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.vacio}>
      <ClipboardList size={16} color={theme.colors.mutedForeground} />
      <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, flex: 1 }}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  perfilRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  nombre: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  datoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  datoValor: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  item: { marginBottom: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 14, fontWeight: "600" },
  notaHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  vacio: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sinAcceso: { alignItems: "center", gap: 12, paddingVertical: 32 },
});
