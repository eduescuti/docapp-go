import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ClipboardPlus,
  Lock,
  MapPin,
  NotebookText,
  Pill,
  StickyNote,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import {
  Avatar,
  BackHeader,
  BottomSheet,
  Card,
  Chip,
  Colapsable,
  Confirmacion,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  StatusBadge,
  Text,
  TextField,
} from "@/components";
import { EstadoOrden, EstadoTurno, Medico, NotaPaciente, OrdenLaboratorio, Paciente, PlanMedico, Receta } from "@/domain";
import {
  confirmarTurno,
  crearNotaPaciente,
  getMedicoActual,
  getPaciente,
  getPlanMedico,
  listAgendaMedico,
  listNotasPaciente,
  listOrdenesEmitidas,
  listRecetasEmitidas,
  rechazarTurno,
  TurnoDeAgenda,
} from "@/services";
import { useTheme } from "@/theme";
import { tomarAviso } from "@/utils/avisoAlVolver";
import { formatFechaCorta, formatFechaHora, formatFechaLarga, hoyIso, iniciales } from "@/utils/format";

interface Ficha {
  medico: Medico;
  paciente: Paciente;
  plan?: PlanMedico;
  turnos: TurnoDeAgenda[];
  recetas: Receta[];
  ordenes: OrdenLaboratorio[];
  notas: NotaPaciente[];
}

type TipoEntrada = "turno" | "receta" | "orden";

/** Un renglón de la libreta: una atención, una receta o una orden que este profesional registró. */
interface EntradaLibreta {
  id: string;
  tipo: TipoEntrada;
  fecha: string;
  titulo: string;
  detalle: string;
  estado?: EstadoTurno | EstadoOrden;
}

const ICONO_ENTRADA: Record<TipoEntrada, LucideIcon> = { turno: Calendar, receta: Pill, orden: ClipboardList };
const FILTROS: { valor: TipoEntrada | null; etiqueta: string }[] = [
  { valor: null, etiqueta: "Todo" },
  { valor: "turno", etiqueta: "Turnos" },
  { valor: "receta", etiqueta: "Recetas" },
  { valor: "orden", etiqueta: "Órdenes" },
];

const esProximo = ({ turno }: TurnoDeAgenda, hoy: string) =>
  turno.fecha >= hoy && turno.estado !== "cancelado" && turno.estado !== "completado" && turno.estado !== "rechazado";

/** Arma la libreta: turnos pasados, recetas y órdenes, del más reciente al más viejo. */
function armarLibreta(historial: TurnoDeAgenda[], recetas: Receta[], ordenes: OrdenLaboratorio[]): EntradaLibreta[] {
  return [
    ...historial.map(
      ({ turno, institucion, sede }): EntradaLibreta => ({
        id: turno.id,
        tipo: "turno",
        fecha: turno.fecha,
        titulo: `Turno de las ${turno.hora}`,
        detalle: institucion?.nombre ?? sede?.nombre ?? "",
        estado: turno.estado,
      }),
    ),
    ...recetas.map(
      (r): EntradaLibreta => ({
        id: r.id,
        tipo: "receta",
        fecha: r.fecha,
        titulo: r.medicacion,
        detalle: `${r.dosis} · ${r.frecuencia.toLowerCase()} · ${r.duracion}`,
      }),
    ),
    ...ordenes.map(
      (o): EntradaLibreta => ({
        id: o.id,
        tipo: "orden",
        fecha: o.fecha,
        titulo: o.estudiosSolicitados.join(", "),
        detalle: o.indicaciones || "Sin indicaciones",
        estado: o.estado,
      }),
    ),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/**
 * Ficha del paciente vista por el profesional. Solo muestra lo que ese profesional generó (turnos, recetas,
 * órdenes y notas propias) y solo si existe un vínculo real por turnos (CLAUDE.md §10, regla 8). Desde acá
 * confirma o rechaza las solicitudes de turno y le asigna órdenes y recetas al paciente.
 */
export default function DoctorPacienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const router = useRouter();

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [nuevaNota, setNuevaNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorNota, setErrorNota] = useState<string | null>(null);
  const [libretaAbierta, setLibretaAbierta] = useState(false);
  const [filtroLibreta, setFiltroLibreta] = useState<TipoEntrada | null>(null);
  const [aRechazar, setARechazar] = useState<TurnoDeAgenda | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorTurno, setErrorTurno] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const medico = await getMedicoActual();
    const [paciente, agenda] = await Promise.all([getPaciente(id), listAgendaMedico(medico.id)]);
    const turnos = agenda.filter(({ turno }) => turno.pacienteId === id);
    if (!paciente || turnos.length === 0) {
      setSinAcceso(true);
      return;
    }
    const [plan, recetas, ordenes, notas] = await Promise.all([
      getPlanMedico(paciente.planMedicoId),
      listRecetasEmitidas(medico.id, paciente.id),
      listOrdenesEmitidas(medico.id, paciente.id),
      listNotasPaciente(medico.id, paciente.id),
    ]);
    setSinAcceso(false);
    setFicha({ medico, paciente, plan, turnos, recetas, ordenes, notas });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      cargar();
      // Al volver de asignar una orden o una receta, se avisa que quedó guardada.
      const texto = tomarAviso();
      if (texto) setAviso(texto);
    }, [cargar]),
  );

  // Las pestañas dejan la pantalla montada: al abrir la ficha de otro paciente se limpia lo de la anterior.
  useEffect(() => {
    setFicha(null);
    setNuevaNota("");
    setErrorNota(null);
    setLibretaAbierta(false);
    setFiltroLibreta(null);
    setErrorTurno(null);
  }, [id]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

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

  const responder = async (item: TurnoDeAgenda, accion: "confirmar" | "rechazar") => {
    setErrorTurno(null);
    setProcesando(item.turno.id);
    try {
      if (accion === "confirmar") await confirmarTurno(item.turno.id);
      else await rechazarTurno(item.turno.id);
      setAviso(
        accion === "confirmar"
          ? `Confirmaste el turno del ${formatFechaLarga(item.turno.fecha)} a las ${item.turno.hora}.`
          : "Rechazaste el turno. El horario quedó libre.",
      );
      setARechazar(null);
      await cargar();
    } catch (e) {
      setErrorTurno(e instanceof Error ? e.message : "No se pudo actualizar el turno.");
      setARechazar(null);
    } finally {
      setProcesando(null);
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

  const { paciente, plan, turnos, recetas, ordenes, notas } = ficha;
  const hoy = hoyIso();
  const proximos = turnos.filter((t) => esProximo(t, hoy));
  const historial = turnos.filter((t) => !esProximo(t, hoy));
  const libreta = armarLibreta(historial, recetas, ordenes);
  const entradas = libreta.filter((e) => !filtroLibreta || e.tipo === filtroLibreta);

  return (
    <ScreenContainer>
      <BackHeader titulo="Ficha del paciente" />

      {aviso ? (
        <View style={[styles.aviso, { backgroundColor: `${theme.colors.success}1F` }]} accessibilityLiveRegion="polite">
          <CheckCircle2 size={16} color={theme.colors.success} />
          <Text style={[styles.avisoTexto, { color: theme.colors.foreground }]}>{aviso}</Text>
        </View>
      ) : null}

      <Card style={{ marginBottom: 16 }}>
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

      <View style={styles.acciones}>
        <Accion
          icon={ClipboardPlus}
          titulo="Asignar orden"
          detalle="Estudios e indicaciones"
          onPress={() => router.push(`/(doctor)/nueva-orden/${paciente.id}`)}
        />
        <Accion
          icon={Pill}
          titulo="Asignar receta"
          detalle="Medicación y dosis"
          onPress={() => router.push(`/(doctor)/nueva-receta/${paciente.id}`)}
        />
      </View>

      <SectionHeader title="Próximos turnos" />
      {errorTurno ? (
        <Text style={[styles.meta, { color: theme.colors.danger, marginBottom: 10 }]} accessibilityLiveRegion="polite">
          {errorTurno}
        </Text>
      ) : null}
      {proximos.length === 0 ? (
        <Vacio texto="No tiene turnos próximos con vos." />
      ) : (
        proximos.map((item) => (
          <Card key={item.turno.id} style={styles.item}>
            <View style={styles.itemRow}>
              <Calendar size={16} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>
                  {formatFechaCorta(item.turno.fecha)} · {item.turno.hora}
                </Text>
                <View style={styles.lugarRow}>
                  <MapPin size={12} color={theme.colors.mutedForeground} />
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 0 }]} numberOfLines={1}>
                    {item.institucion?.nombre ?? item.sede?.nombre ?? "Sede"}
                  </Text>
                </View>
              </View>
              <StatusBadge estado={item.turno.estado} />
            </View>
            {item.turno.estado === "pendiente" ? (
              <View style={[styles.respuesta, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 0 }]}>
                  El paciente solicitó este turno. ¿Lo confirmás?
                </Text>
                <View style={styles.botones}>
                  <View style={styles.boton}>
                    <PrimaryButton
                      label="Rechazar"
                      variant="outline"
                      onPress={() => setARechazar(item)}
                      disabled={procesando !== null}
                      accessibilityLabel={`Rechazar el turno del ${formatFechaLarga(item.turno.fecha)} a las ${item.turno.hora}`}
                    />
                  </View>
                  <View style={styles.boton}>
                    <PrimaryButton
                      label="Confirmar"
                      onPress={() => responder(item, "confirmar")}
                      loading={procesando === item.turno.id && !aRechazar}
                      disabled={procesando !== null && procesando !== item.turno.id}
                      accessibilityLabel={`Confirmar el turno del ${formatFechaLarga(item.turno.fecha)} a las ${item.turno.hora}`}
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </Card>
        ))
      )}

      <View style={{ height: 16 }} />
      <SectionHeader title="Historial con vos" />
      {/* La libreta: cerrada no ocupa lugar; se abre al tocarla. */}
      <Pressable
        onPress={() => setLibretaAbierta((abierta) => !abierta)}
        accessibilityRole="button"
        accessibilityLabel={`Libreta de atenciones, ${libreta.length} ${libreta.length === 1 ? "registro" : "registros"}. ${libretaAbierta ? "Cerrar" : "Abrir"}`}
        accessibilityState={{ expanded: libretaAbierta }}
        style={[
          styles.tapa,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderLeftColor: theme.colors.primary,
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        <View style={styles.anillos}>
          {[0, 1, 2].map((n) => (
            <View key={n} style={[styles.anillo, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} />
          ))}
        </View>
        <View style={[styles.tapaIcono, { backgroundColor: theme.colors.accent }]}>
          <NotebookText size={20} color={theme.colors.accentForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading" style={[styles.itemTitulo, { color: theme.colors.foreground }]}>
            Libreta de atenciones
          </Text>
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
            {libreta.length === 0
              ? "Todavía no hay registros"
              : `${libreta.length} ${libreta.length === 1 ? "registro" : "registros"} · último el ${formatFechaCorta(libreta[0].fecha)}`}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: libretaAbierta ? "180deg" : "0deg" }] }}>
          <ChevronDown size={20} color={theme.colors.mutedForeground} />
        </View>
      </Pressable>

      <Colapsable abierto={libretaAbierta}>
        <View
          style={[
            styles.hoja,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
          ]}
        >
          {libreta.length === 0 ? (
            <Text style={[styles.meta, { color: theme.colors.mutedForeground, padding: 14 }]}>
              Acá vas a ver las atenciones, recetas y órdenes que le registres.
            </Text>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
                {FILTROS.map((f) => (
                  <Chip
                    key={f.etiqueta}
                    label={f.etiqueta}
                    selected={filtroLibreta === f.valor}
                    onPress={() => setFiltroLibreta(f.valor)}
                  />
                ))}
              </ScrollView>
              {entradas.length === 0 ? (
                <Text style={[styles.meta, { color: theme.colors.mutedForeground, padding: 14 }]}>No hay registros de este tipo.</Text>
              ) : (
                entradas.map((entrada) => <Renglon key={entrada.id} entrada={entrada} />)
              )}
            </>
          )}
        </View>
      </Colapsable>

      <View style={{ height: 24 }} />
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

      <BottomSheet visible={!!aRechazar} titulo="Rechazar turno" onClose={() => !procesando && setARechazar(null)}>
        {aRechazar ? (
          <Confirmacion
            mensaje={`¿Rechazar el turno del ${formatFechaLarga(aRechazar.turno.fecha)} a las ${aRechazar.turno.hora}? El paciente lo va a ver como rechazado y el horario queda libre.`}
            textoConfirmar="Sí, rechazar turno"
            textoVolver="No, volver"
            onConfirmar={() => responder(aRechazar, "rechazar")}
            onVolver={() => setARechazar(null)}
            cargando={procesando === aRechazar.turno.id}
          />
        ) : null}
      </BottomSheet>
    </ScreenContainer>
  );
}

/** Un renglón de la libreta: la fecha en el margen y el registro a la derecha, como en una hoja rayada. */
function Renglon({ entrada }: { entrada: EntradaLibreta }) {
  const { theme } = useTheme();
  const Icono = ICONO_ENTRADA[entrada.tipo];
  const fecha = parseISO(entrada.fecha);
  return (
    <View
      style={[styles.renglon, { borderTopColor: theme.colors.border }]}
      accessible
      accessibilityLabel={`${formatFechaLarga(entrada.fecha)}. ${entrada.titulo}. ${entrada.detalle}`}
    >
      <View style={styles.margenFecha}>
        <Text variant="heading" style={[styles.dia, { color: theme.colors.foreground }]}>
          {format(fecha, "dd")}
        </Text>
        <Text style={[styles.mes, { color: theme.colors.mutedForeground }]}>{format(fecha, "MMM yy", { locale: es })}</Text>
      </View>
      {/* La línea del margen de la hoja. */}
      <View style={[styles.lineaMargen, { backgroundColor: `${theme.colors.danger}55` }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.renglonTitulo}>
          <Icono size={14} color={theme.colors.primary} />
          <Text style={[styles.itemTitulo, { color: theme.colors.foreground, flex: 1 }]} numberOfLines={2}>
            {entrada.titulo}
          </Text>
        </View>
        <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={2}>
          {entrada.detalle}
        </Text>
        {entrada.estado ? (
          <View style={{ marginTop: 6 }}>
            <StatusBadge estado={entrada.estado} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Accion({ icon: Icon, titulo, detalle, onPress }: { icon: LucideIcon; titulo: string; detalle: string; onPress: () => void }) {
  const { theme } = useTheme();
  // El flex va en un contenedor: con onPress, Card envuelve su vista en un Pressable que no recibe el estilo.
  return (
    <View style={styles.accionContenedor}>
      <Card style={styles.accion} onPress={onPress} accessibilityLabel={`${titulo}: ${detalle}`}>
        <View style={[styles.tapaIcono, { backgroundColor: theme.colors.accent }]}>
          <Icon size={20} color={theme.colors.accentForeground} />
        </View>
        <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{titulo}</Text>
        <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{detalle}</Text>
      </Card>
    </View>
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
  aviso: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  avisoTexto: { flex: 1, fontSize: 13 },
  perfilRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  nombre: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  datoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  datoValor: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  acciones: { flexDirection: "row", gap: 10, marginBottom: 28 },
  accionContenedor: { flex: 1 },
  accion: { gap: 6 },
  item: { marginBottom: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 14, fontWeight: "600" },
  lugarRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  respuesta: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 10 },
  botones: { flexDirection: "row", gap: 10 },
  boton: { flex: 1 },
  tapa: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderLeftWidth: 6, minHeight: 72, paddingVertical: 14, paddingRight: 14, paddingLeft: 10 },
  // Los anillos de la libreta quedan montados sobre el lomo (el borde izquierdo de color).
  anillos: { gap: 8, marginLeft: -12 },
  anillo: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  tapaIcono: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  hoja: { borderWidth: 1, marginTop: 8, paddingTop: 12, overflow: "hidden" },
  filtros: { gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  renglon: { flexDirection: "row", gap: 12, borderTopWidth: 1, paddingVertical: 12, paddingRight: 14, paddingLeft: 10 },
  margenFecha: { width: 44, alignItems: "center" },
  dia: { fontSize: 18, fontWeight: "700" },
  mes: { fontSize: 11, textTransform: "capitalize" },
  lineaMargen: { width: 2, alignSelf: "stretch", borderRadius: 1 },
  renglonTitulo: { flexDirection: "row", alignItems: "center", gap: 6 },
  notaHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  vacio: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sinAcceso: { alignItems: "center", gap: 12, paddingVertical: 32 },
});
