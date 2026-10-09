import { ReactNode, useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, Linking, Pressable, StyleSheet, View } from "react-native";
import { Calendar, CheckCircle2, ChevronRight, Clock, MapPin, Stethoscope, Trash2 } from "lucide-react-native";

import {
  Avatar,
  BottomSheet,
  Card,
  Confirmacion,
  PrimaryButton,
  ScreenContainer,
  StatusBadge,
  TabSwitch,
  Text,
} from "@/components";
import { Especialidad, Institucion, Medico, Sede, Turno } from "@/domain";
import {
  cancelarTurno,
  getEspecialidad,
  getInstitucion,
  getMedico,
  getPacienteActual,
  getSede,
  listMisTurnos,
  ocultarTurnoDelHistorial,
  vaciarHistorialTurnos,
} from "@/services";
import { useTheme } from "@/theme";
import { etiquetaTipoConsulta, formatFechaCorta, formatFechaLarga, iniciales, nombreConTitulo } from "@/utils/format";

type Filtro = "proximos" | "historial";
type Confirmando = "cancelar" | "ocultar" | null;

interface TurnoDetalle {
  turno: Turno;
  medico?: Medico;
  especialidad?: Especialidad;
  sede?: Sede;
  institucion?: Institucion;
}

async function conDetalle(turno: Turno): Promise<TurnoDetalle> {
  const [medico, sede] = await Promise.all([getMedico(turno.medicoId), getSede(turno.sedeId)]);
  const [especialidad, institucion] = await Promise.all([
    medico ? getEspecialidad(medico.especialidadId) : undefined,
    sede ? getInstitucion(sede.institucionId) : undefined,
  ]);
  return { turno, medico, especialidad, sede, institucion };
}

export default function TurnosScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("proximos");
  const [proximos, setProximos] = useState<TurnoDetalle[]>([]);
  const [historial, setHistorial] = useState<TurnoDetalle[]>([]);
  const [abierto, setAbierto] = useState<TurnoDetalle | null>(null);
  const [confirmando, setConfirmando] = useState<Confirmando>(null);
  const [vaciando, setVaciando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const paciente = await getPacienteActual();
    setPacienteId(paciente.id);
    const mis = await listMisTurnos(paciente.id);
    const [p, h] = await Promise.all([Promise.all(mis.proximos.map(conDetalle)), Promise.all(mis.historial.map(conDetalle))]);
    setProximos(p);
    setHistorial(h);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  // El aviso de éxito se va solo a los 3 segundos.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3000);
    return () => clearTimeout(t);
  }, [aviso]);

  const abrir = (item: TurnoDetalle) => {
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

  const lista = filtro === "proximos" ? proximos : historial;
  const nombreMedico = (item: TurnoDetalle) => (item.medico ? nombreConTitulo(item.medico) : "Profesional");
  const esProximo = abierto ? proximos.some((p) => p.turno.id === abierto.turno.id) : false;

  return (
    <ScreenContainer scroll={false}>
      <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>Mis Turnos</Text>

      <TabSwitch
        opciones={[
          { valor: "proximos", etiqueta: "Próximos" },
          { valor: "historial", etiqueta: "Historial" },
        ]}
        valor={filtro}
        onChange={setFiltro}
      />

      {aviso ? (
        <View style={[styles.aviso, { backgroundColor: `${theme.colors.success}1F` }]} accessibilityLiveRegion="polite">
          <CheckCircle2 size={16} color={theme.colors.success} />
          <Text style={[styles.avisoTexto, { color: theme.colors.foreground }]}>{aviso}</Text>
        </View>
      ) : null}

      <FlatList
        data={lista}
        keyExtractor={({ turno }) => turno.id}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          filtro === "historial" && historial.length > 0 ? (
            <View style={styles.encabezadoHistorial}>
              <Text style={[styles.cantidad, { color: theme.colors.mutedForeground }]}>
                {historial.length} {historial.length === 1 ? "turno" : "turnos"}
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
            {filtro === "proximos" ? "No tenés turnos próximos." : "Tu historial de turnos está vacío."}
          </Text>
        }
        renderItem={({ item }) => (
          <Card
            style={styles.tarjeta}
            onPress={() => abrir(item)}
            accessibilityLabel={`Turno con ${nombreMedico(item)}, ${formatFechaCorta(item.turno.fecha)} a las ${item.turno.hora}. Ver detalle`}
          >
            <View style={styles.fila}>
              <Avatar
                uri={item.medico?.avatarUrl}
                iniciales={item.medico ? iniciales(item.medico.nombre, item.medico.apellido) : "?"}
                size={44}
              />
              <View style={styles.flex}>
                <Text style={[styles.nombre, { color: theme.colors.foreground }]} numberOfLines={1}>
                  {nombreMedico(item)}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                  {[item.especialidad?.nombre, item.institucion?.nombre].filter(Boolean).join(" · ")}
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

      {/* Detalle del turno y sus acciones, con segunda confirmación antes de cancelar o eliminar. */}
      <BottomSheet
        visible={!!abierto}
        titulo={confirmando === "cancelar" ? "Cancelar turno" : confirmando === "ocultar" ? "Eliminar del historial" : "Detalle del turno"}
        extraTitulo={abierto && !confirmando ? <StatusBadge estado={abierto.turno.estado} /> : undefined}
        onClose={cerrar}
        pie={
          abierto && !confirmando ? (
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
                <Text style={[styles.nombreDetalle, { color: theme.colors.foreground }]}>{nombreMedico(abierto)}</Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  {[abierto.especialidad?.nombre, abierto.medico ? `Mat. ${abierto.medico.matricula}` : null].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.colors.mutedForeground} />
            </Pressable>

            <Seccion icono={Calendar} titulo="Fecha y horario">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                {formatFechaLarga(abierto.turno.fecha)} · {abierto.turno.hora} h
              </Text>
            </Seccion>

            <Seccion icono={Stethoscope} titulo="Tipo de consulta">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{etiquetaTipoConsulta(abierto.turno.tipoConsulta)}</Text>
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
  titulo: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
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
  nombre: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  pieTarjeta: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  dato: { flexDirection: "row", alignItems: "center", gap: 6 },
  datoTexto: { fontSize: 13 },
  detalle: { gap: 4 },
  nombreDetalle: { fontSize: 16, fontWeight: "700" },
  seccion: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 4 },
  seccionTitulo: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  valor: { fontSize: 15, fontWeight: "500" },
  enlace: { alignSelf: "flex-start", minHeight: 36, justifyContent: "center" },
  enlaceTexto: { fontSize: 14, fontWeight: "600" },
});
