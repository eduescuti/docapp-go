import { ReactNode, useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CheckCircle2, ChevronRight, Clock, History, MapPin, Trash2 } from "lucide-react-native";

import {
  Avatar,
  BottomSheet,
  CampoBusqueda,
  Card,
  Chip,
  Confirmacion,
  EncabezadoTab,
  PrimaryButton,
  ReservaTurno,
  ScreenContainer,
  StatusBadge,
  TabSwitch,
  Text,
} from "@/components";
import { EstadoTurno } from "@/domain";
import {
  cancelarTurno,
  getPacienteActual,
  listMisTurnos,
  ocultarTurnoDelHistorial,
  TurnoConDetalle,
  vaciarHistorialTurnos,
} from "@/services";
import { useTheme } from "@/theme";
import { conservarSiIgual } from "@/utils/estable";
import { formatFechaCorta, formatFechaLarga, iniciales, nombreConTitulo } from "@/utils/format";
import { etiquetaEstado } from "@/components/StatusBadge";

type Filtro = "reservar" | "proximos";

/** El turno nace pendiente: el profesional lo tiene que confirmar. */
const AVISO_SOLICITADO = "Solicitaste tu turno. Queda pendiente hasta que el profesional lo confirme.";
type Confirmando = "cancelar" | "ocultar" | null;

/** Sin tildes ni mayúsculas, para que "cardiologia" encuentre "Cardiología". */
const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Todo lo que se puede buscar de un turno: tipo (especialidad), estado, fecha, horario, profesional y lugar. */
function textoBuscable({ turno, medico, especialidad, institucion }: TurnoConDetalle): string {
  const fecha = parseISO(turno.fecha);
  return normalizar(
    [
      especialidad?.nombre,
      medico?.profesion,
      medico ? `${nombreConTitulo(medico)} ${medico.apellido}` : undefined,
      etiquetaEstado(turno.estado),
      formatFechaCorta(turno.fecha),
      formatFechaLarga(turno.fecha),
      format(fecha, "EEEE d MMMM", { locale: es }),
      format(fecha, "dd/MM/yyyy"),
      turno.fecha,
      turno.hora,
      institucion?.nombre,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/**
 * Cada palabra buscada tiene que ser el comienzo de alguna palabra del turno: "cardio" encuentra
 * Cardiología y "26 oct" el 26 de octubre, pero "26" no encuentra el año 2026.
 */
function coincide(item: TurnoConDetalle, consulta: string): boolean {
  const buscadas = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (buscadas.length === 0) return true;
  const palabras = textoBuscable(item).split(/[\s,.·()-]+/);
  return buscadas.every((b) => palabras.some((p) => p.startsWith(b)));
}

const PLURAL_ESTADO: Partial<Record<EstadoTurno, string>> = {
  confirmado: "Confirmados",
  reprogramado: "Reprogramados",
  pendiente: "Pendientes",
  rechazado: "Rechazados",
  completado: "Completados",
  cancelado: "Cancelados",
};

/** Estados que se pueden filtrar en cada lista (los reprogramados solo si hay alguno). */
function estadosFiltrables(verHistorial: boolean, lista: TurnoConDetalle[]): EstadoTurno[] {
  if (verHistorial) return ["completado", "cancelado"];
  const base: EstadoTurno[] = ["confirmado", "pendiente", "rechazado"];
  return lista.some((t) => t.turno.estado === "reprogramado") ? ["confirmado", "reprogramado", "pendiente", "rechazado"] : base;
}

export default function TurnosScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  // Llega "proximos-<n>" después de reservar desde el perfil de un profesional.
  const { ver, sedeElegida, n } = useLocalSearchParams<{ ver?: string; sedeElegida?: string; n?: string }>();
  // Hospital que el paciente eligió en el mapa mientras reservaba.
  const sedeDelMapa = sedeElegida && n ? { sedeId: sedeElegida, n } : undefined;

  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("reservar");
  // El historial de turnos se abre desde el botón de arriba, aparte de las pestañas.
  const [verHistorial, setVerHistorial] = useState(false);
  const [proximos, setProximos] = useState<TurnoConDetalle[]>([]);
  const [historial, setHistorial] = useState<TurnoConDetalle[]>([]);
  const [abierto, setAbierto] = useState<TurnoConDetalle | null>(null);
  const [confirmando, setConfirmando] = useState<Confirmando>(null);
  const [vaciando, setVaciando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoTurno | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const paciente = await getPacienteActual();
    setPacienteId(paciente.id);
    // Un solo pedido: los turnos ya vienen con profesional, especialidad y lugar.
    const mis = await listMisTurnos(paciente.id);
    setProximos((anterior) => conservarSiIgual(anterior, mis.proximos));
    setHistorial((anterior) => conservarSiIgual(anterior, mis.historial));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  useEffect(() => {
    if (ver?.startsWith("proximos")) {
      setVerHistorial(false);
      setFiltro("proximos");
      setAviso(AVISO_SOLICITADO);
    }
  }, [ver]);

  // Al volver del mapa con un hospital elegido, se sigue con la reserva.
  useEffect(() => {
    if (n) {
      setVerHistorial(false);
      setFiltro("reservar");
    }
  }, [n]);

  // La búsqueda y el filtro son de cada lista: al cambiar de lista se limpian.
  useEffect(() => {
    setBusqueda("");
    setEstadoFiltro(null);
  }, [verHistorial, filtro]);

  // El aviso de éxito se va solo a los 3 segundos.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3000);
    return () => clearTimeout(t);
  }, [aviso]);

  const abrir = (item: TurnoConDetalle) => {
    setConfirmando(null);
    setAbierto(item);
  };

  const cerrar = () => {
    if (procesando) return;
    setAbierto(null);
    setConfirmando(null);
  };

  const confirmar = async () => {
    if (!abierto || !confirmando) return;
    setProcesando(true);
    try {
      if (confirmando === "cancelar") await cancelarTurno(abierto.turno.id);
      else await ocultarTurnoDelHistorial(abierto.turno.id);
      setAviso(confirmando === "cancelar" ? "Cancelaste el turno. Lo vas a ver en el historial." : "Eliminaste el turno de tu historial.");
      setAbierto(null);
      setConfirmando(null);
      await cargar();
    } finally {
      setProcesando(false);
    }
  };

  const vaciar = async () => {
    if (!pacienteId) return;
    setProcesando(true);
    try {
      await vaciarHistorialTurnos(pacienteId);
      setAviso("Eliminaste todo tu historial de turnos.");
      setVaciando(false);
      await cargar();
    } finally {
      setProcesando(false);
    }
  };

  const origen = verHistorial ? historial : proximos;
  const estados = estadosFiltrables(verHistorial, origen);
  const lista = origen.filter((t) => (!estadoFiltro || t.turno.estado === estadoFiltro) && coincide(t, busqueda));
  const hayFiltros = busqueda.trim().length > 0 || estadoFiltro !== null;
  /** El tipo de turno (la especialidad pedida) es lo principal; el profesional va debajo. */
  const tipoTurno = (item: TurnoConDetalle) => item.especialidad?.nombre ?? item.medico?.profesion ?? "Turno";
  const nombreMedico = (item: TurnoConDetalle) => (item.medico ? nombreConTitulo(item.medico) : "Profesional");
  const esProximo = abierto ? proximos.some((p) => p.turno.id === abierto.turno.id) : false;

  return (
    <ScreenContainer scroll={false}>
      <EncabezadoTab
        titulo={verHistorial ? "Historial de turnos" : "Turnos"}
        onVolver={verHistorial ? () => setVerHistorial(false) : undefined}
        etiquetaVolver="Volver a Turnos"
        accion={
          verHistorial ? undefined : (
            <Pressable
              onPress={() => setVerHistorial(true)}
              accessibilityRole="button"
              accessibilityLabel="Ver el historial de turnos"
              hitSlop={8}
              style={[styles.botonHistorial, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            >
              <History size={20} color={theme.colors.primary} />
            </Pressable>
          )
        }
      />

      {verHistorial ? null : (
        <TabSwitch
          opciones={[
            { valor: "reservar", etiqueta: "Reservar" },
            { valor: "proximos", etiqueta: "Próximos" },
          ]}
          valor={filtro}
          onChange={setFiltro}
        />
      )}

      {aviso ? (
        <View style={[styles.aviso, { backgroundColor: `${theme.colors.success}1F` }]} accessibilityLiveRegion="polite">
          <CheckCircle2 size={16} color={theme.colors.success} />
          <Text style={[styles.avisoTexto, { color: theme.colors.foreground }]}>{aviso}</Text>
        </View>
      ) : null}

      {!verHistorial && filtro === "reservar" ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ReservaTurno
            sedeDelMapa={sedeDelMapa}
            onReservado={async () => {
              setFiltro("proximos");
              setAviso(AVISO_SOLICITADO);
              await cargar();
            }}
          />
        </ScrollView>
      ) : (
      <>
      {origen.length > 0 ? (
        <View style={styles.filtros}>
          <CampoBusqueda
            valor={busqueda}
            onChange={setBusqueda}
            placeholder="Especialidad, estado, fecha, horario o profesional"
            accessibilityLabel="Buscar turnos por especialidad, estado, fecha, horario o profesional"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Todos" selected={estadoFiltro === null} onPress={() => setEstadoFiltro(null)} />
            {estados.map((estado) => (
              <Chip
                key={estado}
                label={`${PLURAL_ESTADO[estado]} · ${origen.filter((t) => t.turno.estado === estado).length}`}
                selected={estadoFiltro === estado}
                onPress={() => setEstadoFiltro(estadoFiltro === estado ? null : estado)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      <FlatList
        data={lista}
        keyExtractor={({ turno }) => turno.id}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          verHistorial && historial.length > 0 ? (
            <View style={styles.encabezadoHistorial}>
              <Text style={[styles.cantidad, { color: theme.colors.mutedForeground }]}>
                {hayFiltros ? `${lista.length} de ${historial.length}` : historial.length} {historial.length === 1 ? "turno" : "turnos"}
              </Text>
              <Pressable
                onPress={() => setVaciando(true)}
                accessibilityRole="button"
                accessibilityLabel="Eliminar todo el historial de turnos"
                hitSlop={8}
                style={styles.eliminarTodo}
              >
                <Trash2 size={16} color={theme.colors.danger} />
                <Text style={[styles.eliminarTodoTexto, { color: theme.colors.danger }]}>Eliminar todo</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Text style={[styles.vacio, { color: theme.colors.mutedForeground }]}>
            {hayFiltros
              ? "Ningún turno coincide con tu búsqueda."
              : verHistorial
                ? "Tu historial de turnos está vacío."
                : "No tenés turnos próximos. Reservá uno desde la pestaña Reservar."}
          </Text>
        }
        renderItem={({ item }) => (
          <Card
            style={styles.tarjeta}
            onPress={() => abrir(item)}
            accessibilityLabel={`${tipoTurno(item)} con ${nombreMedico(item)}, ${etiquetaEstado(item.turno.estado)}, ${formatFechaCorta(item.turno.fecha)} a las ${item.turno.hora}. Ver detalle`}
          >
            <View style={styles.fila}>
              <Avatar
                uri={item.medico?.avatarUrl}
                iniciales={item.medico ? iniciales(item.medico.nombre, item.medico.apellido) : "?"}
                size={44}
              />
              <View style={styles.flex}>
                <Text variant="heading" style={[styles.tipoTurno, { color: theme.colors.foreground }]} numberOfLines={1}>
                  {tipoTurno(item)}
                </Text>
                <Text style={[styles.nombre, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                  {nombreMedico(item)}
                </Text>
              </View>
              <StatusBadge estado={item.turno.estado} />
            </View>
            <View style={[styles.pieTarjeta, { borderTopColor: theme.colors.border }]}>
              <View style={styles.dato}>
                <Calendar size={14} color={theme.colors.primary} />
                <Text style={[styles.datoTexto, { color: theme.colors.mutedForeground }]}>{formatFechaCorta(item.turno.fecha)}</Text>
              </View>
              <View style={styles.dato}>
                <Clock size={14} color={theme.colors.primary} />
                <Text style={[styles.datoTexto, { color: theme.colors.mutedForeground }]}>{item.turno.hora}</Text>
              </View>
              <View style={styles.flex} />
              <ChevronRight size={18} color={theme.colors.mutedForeground} />
            </View>
          </Card>
        )}
      />
      </>
      )}

      {/* Detalle del turno y sus acciones, con segunda confirmación antes de cancelar o eliminar. */}
      <BottomSheet
        visible={!!abierto}
        titulo={confirmando === "cancelar" ? "Cancelar turno" : confirmando === "ocultar" ? "Eliminar del historial" : "Detalle del turno"}
        extraTitulo={abierto && !confirmando ? <StatusBadge estado={abierto.turno.estado} /> : undefined}
        onClose={cerrar}
        pie={
          abierto && !confirmando && abierto.turno.estado !== "rechazado" ? (
            esProximo ? (
              <PrimaryButton label="Cancelar turno" variant="outline" onPress={() => setConfirmando("cancelar")} />
            ) : (
              <PrimaryButton label="Eliminar del historial" variant="outline" onPress={() => setConfirmando("ocultar")} />
            )
          ) : undefined
        }
      >
        {abierto && confirmando ? (
          <Confirmacion
            mensaje={
              confirmando === "cancelar"
                ? `¿Seguro que querés cancelar tu turno con ${nombreMedico(abierto)} del ${formatFechaLarga(abierto.turno.fecha)} a las ${abierto.turno.hora}? El horario queda libre para otra persona.`
                : "¿Eliminar este turno de tu historial? Solo deja de verse en esta lista: tu historial médico y lo que registró el profesional no cambian."
            }
            textoConfirmar={confirmando === "cancelar" ? "Sí, cancelar turno" : "Sí, eliminar"}
            textoVolver={confirmando === "cancelar" ? "No, mantener turno" : "No, volver"}
            onConfirmar={confirmar}
            onVolver={() => setConfirmando(null)}
            cargando={procesando}
          />
        ) : abierto ? (
          <View style={styles.detalle}>
            <Pressable
              onPress={() => {
                if (!abierto.medico) return;
                cerrar();
                router.push(`/medico/${abierto.medico.id}`);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${nombreMedico(abierto)}`}
              style={styles.fila}
            >
              <Avatar
                uri={abierto.medico?.avatarUrl}
                iniciales={abierto.medico ? iniciales(abierto.medico.nombre, abierto.medico.apellido) : "?"}
                size={52}
              />
              <View style={styles.flex}>
                <Text variant="heading" style={[styles.nombreDetalle, { color: theme.colors.foreground }]}>{tipoTurno(abierto)}</Text>
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>{nombreMedico(abierto)}</Text>
                {abierto.medico ? (
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>Mat. {abierto.medico.matricula}</Text>
                ) : null}
              </View>
              <ChevronRight size={18} color={theme.colors.mutedForeground} />
            </Pressable>

            {abierto.turno.estado === "rechazado" ? (
              <Text style={[styles.meta, { color: theme.colors.danger, marginTop: 12 }]}>
                El profesional no aceptó esta solicitud o no la confirmó a tiempo. Podés pedir otro turno desde Reservar.
              </Text>
            ) : null}

            <Seccion icono={Calendar} titulo="Fecha y horario">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                {formatFechaLarga(abierto.turno.fecha)} · {abierto.turno.hora} h
              </Text>
            </Seccion>

            <Seccion icono={MapPin} titulo="Sede">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{abierto.institucion?.nombre ?? "Sede"}</Text>
              {abierto.sede ? (
                <>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                    {abierto.sede.direccion}, {abierto.sede.ciudad}
                  </Text>
                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${abierto.sede?.latitud},${abierto.sede?.longitud}`,
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Cómo llegar a la sede"
                    style={styles.enlace}
                  >
                    <Text style={[styles.enlaceTexto, { color: theme.colors.primary }]}>Cómo llegar</Text>
                  </Pressable>
                </>
              ) : null}
            </Seccion>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={vaciando} titulo="Eliminar historial" onClose={() => !procesando && setVaciando(false)}>
        <Confirmacion
          mensaje={`¿Eliminar ${historial.length === 1 ? "el turno" : `los ${historial.length} turnos`} de tu historial? Solo dejan de verse en esta lista: tu historial médico no cambia.`}
          textoConfirmar="Sí, eliminar todo"
          textoVolver="No, volver"
          onConfirmar={vaciar}
          onVolver={() => setVaciando(false)}
          cargando={procesando}
        />
      </BottomSheet>
    </ScreenContainer>
  );
}

function Seccion({ icono: Icono, titulo, children }: { icono: typeof Calendar; titulo: string; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.seccion, { borderTopColor: theme.colors.border }]}>
      <View style={styles.dato}>
        <Icono size={14} color={theme.colors.primary} />
        <Text style={[styles.seccionTitulo, { color: theme.colors.mutedForeground }]}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  botonHistorial: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  filtros: { gap: 10, marginBottom: 14 },
  chips: { gap: 8, alignItems: "center" },
  tipoTurno: { fontSize: 17, fontWeight: "700" },
  aviso: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  avisoTexto: { flex: 1, fontSize: 13 },
  lista: { paddingBottom: 32 },
  encabezadoHistorial: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cantidad: { fontSize: 13 },
  eliminarTodo: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
  eliminarTodoTexto: { fontSize: 13, fontWeight: "600" },
  vacio: { marginTop: 24, textAlign: "center" },
  tarjeta: { marginBottom: 12 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  nombre: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 2 },
  pieTarjeta: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  dato: { flexDirection: "row", alignItems: "center", gap: 6 },
  datoTexto: { fontSize: 13 },
  detalle: { gap: 4 },
  nombreDetalle: { fontSize: 18, fontWeight: "700" },
  seccion: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 4 },
  seccionTitulo: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  valor: { fontSize: 15, fontWeight: "500" },
  enlace: { alignSelf: "flex-start", minHeight: 36, justifyContent: "center" },
  enlaceTexto: { fontSize: 14, fontWeight: "600" },
});
