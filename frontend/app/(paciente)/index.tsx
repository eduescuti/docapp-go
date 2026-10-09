import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Bell, Calendar, Clock, FileText, MapPin, Search, Stethoscope } from "lucide-react-native";

import {
  Avatar,
  Card,
  Carrusel,
  CredencialPlan,
  IconBadge,
  MapaCentros,
  NotificacionesSheet,
  PedidoVuelo,
  PrimaryButton,
  PuntoMapa,
  ScreenContainer,
  SectionHeader,
  StatusBadge,
  Text,
} from "@/components";
import { Especialidad, Institucion, Medico, Notificacion, Paciente, PlanMedico, Sede, Turno } from "@/domain";
import { CENTRO_CABA, useUbicacion } from "@/hooks/useUbicacion";
import {
  getEspecialidad,
  getInstitucion,
  getMedico,
  getPacienteActual,
  getPlanMedico,
  getProximoTurno,
  getSede,
  buscarCentros,
  listNotificacionesPaciente,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "@/services";
import { useTheme } from "@/theme";
import { formatFechaCorta, iniciales, nombreConTitulo } from "@/utils/format";

interface ProximoTurnoInfo {
  turno: Turno;
  medico: Medico;
  especialidad?: Especialidad;
  institucion?: Institucion;
  sede?: Sede;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  // Ancho de la pantalla menos el margen de ScreenContainer (24 por lado).
  const { width: anchoPantalla } = useWindowDimensions();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [proximo, setProximo] = useState<ProximoTurnoInfo | null>(null);
  const [plan, setPlan] = useState<PlanMedico | undefined>();
  // El carrusel solo avanza solo mientras el Inicio está a la vista.
  const [enFoco, setEnFoco] = useState(false);
  const [puntosMapa, setPuntosMapa] = useState<PuntoMapa[]>([]);
  const [volarA, setVolarA] = useState<PedidoVuelo | null>(null);
  const [errorMapa, setErrorMapa] = useState(false);
  // Solo usa la ubicación si el permiso ya se dio (en el mapa): el Inicio no muestra el aviso del sistema.
  const { coordenada } = useUbicacion({ pedirPermiso: false });
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [panelAbierto, setPanelAbierto] = useState(false);

  const recargarNotificaciones = useCallback(async (pacienteId: string) => {
    setNotificaciones(await listNotificacionesPaciente(pacienteId));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setEnFoco(true);

      (async () => {
        const p = await getPacienteActual();
        if (!activo) return;
        setPaciente(p);
        recargarNotificaciones(p.id);
        getPlanMedico(p.planMedicoId).then((pl) => activo && setPlan(pl));

        const turno = await getProximoTurno(p.id);
        if (turno) {
          const medico = await getMedico(turno.medicoId);
          if (medico && activo) {
            // La institución sale de la sede del turno: el médico puede atender en varias.
            const [especialidad, sede] = await Promise.all([getEspecialidad(medico.especialidadId), getSede(turno.sedeId)]);
            const institucion = sede ? await getInstitucion(sede.institucionId) : undefined;
            setProximo({ turno, medico, especialidad, institucion, sede });
          }
        } else if (activo) {
          setProximo(null);
        }
      })();

      return () => {
        activo = false;
        setEnFoco(false);
      };
    }, [recargarNotificaciones]),
  );

  // Los marcadores de la vista previa: los mismos centros que ve el paciente en el mapa.
  const planMedicoId = paciente?.planMedicoId;
  useEffect(() => {
    if (!planMedicoId) return;
    let activo = true;
    buscarCentros({ planMedicoId }).then((centros) => {
      if (!activo) return;
      setPuntosMapa(
        centros.map((c) => ({ id: c.institucion.id, latitud: c.sede.latitud, longitud: c.sede.longitud, tipo: c.institucion.tipo })),
      );
    });
    return () => {
      activo = false;
    };
  }, [planMedicoId]);

  // Si hay ubicación, la vista previa se centra en el paciente.
  useEffect(() => {
    if (coordenada) setVolarA({ id: Date.now(), coordenada, zoom: 13 });
  }, [coordenada]);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <ScreenContainer style={styles.contenido}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.mutedForeground }]}>
            Hola{paciente ? `, ${paciente.nombre}` : ""} 👋
          </Text>
          <Text variant="heading" style={[styles.headerTitle, { color: theme.colors.foreground }]}>
            ¿Cómo te sentís?
          </Text>
        </View>
        <Pressable
          onPress={() => setPanelAbierto(true)}
          accessibilityRole="button"
          accessibilityLabel={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
          style={({ pressed }) => [
            styles.bellButton,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Bell size={20} color={theme.colors.foreground} />
          {noLeidas > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.danger, borderColor: theme.colors.card }]}>
              <Text style={styles.badgeText}>{noLeidas}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <NotificacionesSheet
        visible={panelAbierto}
        notificaciones={notificaciones}
        onClose={() => setPanelAbierto(false)}
        onPressNotificacion={async (n) => {
          if (!n.leida && paciente) {
            await marcarNotificacionLeida(n.id);
            recargarNotificaciones(paciente.id);
          }
        }}
        onMarcarTodas={async () => {
          if (!paciente) return;
          await marcarTodasLeidas(paciente.id);
          recargarNotificaciones(paciente.id);
        }}
        onVerTodas={() => {
          setPanelAbierto(false);
          router.push("/cuenta/notificaciones");
        }}
      />

      <View style={styles.section}>
        {/* Próximo turno y credencial del plan: se alternan solas cada 4 s y se pueden deslizar.
            Sin turno próximo, queda solo la credencial. */}
        <Carrusel
          activo={enFoco}
          anchoInicial={anchoPantalla - 48}
          paginas={[
            ...(proximo
              ? [
                  {
                    clave: "turno",
                    titulo: "Próximo turno",
                    etiqueta: "Mostrar el próximo turno",
                    contenido: <TarjetaProximoTurno proximo={proximo} />,
                  },
                ]
              : []),
            {
              clave: "plan",
              titulo: "Mi plan médico",
              etiqueta: "Mostrar la credencial del plan",
              contenido: (
                <CredencialPlan
                  plan={plan}
                  afiliado={paciente ? `${paciente.nombre} ${paciente.apellido}` : ""}
                  dni={paciente?.dni ?? ""}
                  onPress={() => router.push("/cuenta/plan")}
                  style={styles.credencial}
                />
              ),
            },
          ]}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Accesos rápidos" />
        <View style={styles.quickAccessGrid}>
          <QuickAccess icon={Search} label="Buscar" onPress={() => router.push("/(paciente)/buscar")} />
          <QuickAccess icon={Stethoscope} label="Turnos" onPress={() => router.push("/(paciente)/turnos")} />
          <QuickAccess icon={FileText} label="Estudios" onPress={() => router.push("/(paciente)/estudios")} />
          <QuickAccess icon={MapPin} label="Centros" onPress={() => router.push("/mapa")} />
        </View>
      </View>

      <View style={[styles.section, styles.seccionMapa]}>
        <SectionHeader title="Instituciones cercanas" actionLabel="Ver mapa" onActionPress={() => router.push("/mapa")} />
        {/* Vista previa del mapa: sin gestos; tocarla abre el mapa completo. Ocupa el alto que
            sobra para que el Inicio entre en una sola pantalla. */}
        <Card padded={false} style={[styles.mapaPreview, { backgroundColor: theme.mapa.tierra }]}>
          {errorMapa ? (
            <View style={[styles.mapaFallback, { backgroundColor: theme.colors.muted }]}>
              <MapPin size={28} color={theme.colors.primary} />
            </View>
          ) : (
            <MapaCentros
              style={StyleSheet.absoluteFill}
              interactivo={false}
              puntos={puntosMapa}
              seleccionadoId={null}
              ubicacion={coordenada}
              centroInicial={coordenada ?? CENTRO_CABA}
              volarA={volarA}
              onSeleccionar={() => {}}
              onError={() => setErrorMapa(true)}
              onListo={() => setErrorMapa(false)}
            />
          )}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => router.push("/mapa")}
            accessibilityRole="button"
            accessibilityLabel="Abrir el mapa de centros de salud"
          />
        </Card>
      </View>
    </ScreenContainer>
  );
}

/** Tarjeta del próximo turno (primera página del carrusel del Inicio). */
function TarjetaProximoTurno({ proximo }: { proximo: ProximoTurnoInfo }) {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <Card style={styles.tarjetaTurno}>
      <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />
      {/* Solo la parte de arriba es tocable: si la tarjeta entera fuera un botón, en web
          "Ver turno" y "Cómo llegar" quedarían anidados dentro de otro <button>. */}
      <Pressable
        onPress={() => router.push(`/medico/${proximo.medico.id}`)}
        accessibilityRole="button"
        accessibilityLabel="Ver próximo turno"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View style={styles.turnoRow}>
          <View style={styles.turnoDoctor}>
            <Avatar uri={proximo.medico.avatarUrl} iniciales={iniciales(proximo.medico.nombre, proximo.medico.apellido)} />
            <View>
              <Text style={[styles.doctorName, { color: theme.colors.foreground }]}>
                {nombreConTitulo(proximo.medico)}
              </Text>
              <Text style={[styles.doctorSpecialty, { color: theme.colors.mutedForeground }]}>
                {[proximo.especialidad?.nombre, proximo.institucion?.nombre].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>
          <StatusBadge estado={proximo.turno.estado} />
        </View>
        <View style={styles.turnoMeta}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={theme.colors.primary} />
            <Text style={[styles.metaText, { color: theme.colors.mutedForeground }]}>
              {formatFechaCorta(proximo.turno.fecha)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={theme.colors.primary} />
            <Text style={[styles.metaText, { color: theme.colors.mutedForeground }]}>{proximo.turno.hora}</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.turnoAcciones}>
        <View style={styles.turnoAccionBoton}>
          <PrimaryButton
            label="Ver turno"
            variant="outline"
            onPress={() => router.push("/(paciente)/turnos")}
            accessibilityLabel="Ver turno"
          />
        </View>
        {proximo.sede ? (
          <View style={styles.turnoAccionBoton}>
            <PrimaryButton
              label="Cómo llegar"
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${proximo.sede!.latitud},${proximo.sede!.longitud}`,
                )
              }
              accessibilityLabel="Cómo llegar a la sede del turno"
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function QuickAccess({ icon, label, onPress }: { icon: typeof Search; label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.quickAccessItem}>
      <Card onPress={onPress} accessibilityLabel={label} padded={false} style={styles.quickAccessCard}>
        <IconBadge icon={icon} size={56} />
      </Card>
      <Text style={[styles.quickAccessLabel, { color: theme.colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: { fontSize: 13, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  contenido: { flexGrow: 1 },
  section: { marginBottom: 20 },
  tarjetaTurno: { flex: 1 },
  credencial: { flex: 1 },
  seccionMapa: { flex: 1, marginBottom: 0 },
  accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  turnoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  turnoDoctor: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, marginRight: 8 },
  doctorName: { fontSize: 15, fontWeight: "600" },
  doctorSpecialty: { fontSize: 12, marginTop: 2 },
  turnoMeta: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },
  turnoAcciones: { flexDirection: "row", gap: 8, marginTop: 16 },
  turnoAccionBoton: { flex: 1 },
  quickAccessGrid: { flexDirection: "row", justifyContent: "space-between" },
  quickAccessItem: { alignItems: "center", gap: 8, width: 68 },
  quickAccessCard: { borderRadius: 999, alignItems: "center", justifyContent: "center" },
  quickAccessLabel: { fontSize: 11, fontWeight: "500", textAlign: "center" },
  mapaPreview: { flex: 1, minHeight: 160 },
  mapaFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
});
