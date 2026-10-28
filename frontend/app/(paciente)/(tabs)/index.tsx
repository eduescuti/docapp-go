import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Bell, Calendar, Clock, FileText, MapPin, Pill, Stethoscope } from "lucide-react-native";

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
import { Especialidad, Institucion, Medico, Notificacion, Paciente, PlanConObraSocial, Sede, Turno } from "@/domain";
import { useTabsEnFoco } from "@/hooks/useTabsEnFoco";
import { CENTRO_CABA, useUbicacion } from "@/hooks/useUbicacion";
import {
  getPacienteActual,
  getPlanMedico,
  getProximoTurno,
  buscarCentros,
  listNotificacionesPaciente,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "@/services";
import { useTheme } from "@/theme";
import { conservarSiIgual } from "@/utils/estable";
import { alPresionar } from "@/utils/presionado";
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
  const [plan, setPlan] = useState<PlanConObraSocial | undefined>();
  // El carrusel se muestra recién cuando se sabe si hay próximo turno: si no, aparece primero la credencial
  // del plan y el turno entra un par de segundos después.
  const [cargado, setCargado] = useState(false);
  // La pista de deslizamiento del carrusel solo corre mientras el Inicio está a la vista.
  const [enFoco, setEnFoco] = useState(false);
  const [puntosMapa, setPuntosMapa] = useState<PuntoMapa[]>([]);
  const [volarA, setVolarA] = useState<PedidoVuelo | null>(null);
  const [errorMapa, setErrorMapa] = useState(false);
  // El mapa de la vista previa es un WebView: es lo más pesado de las pestañas. Mientras hay otra pantalla encima
  // se suelta, y al volver se arma recién cuando termina la animación. Así volver no tiene que reconstruirlo
  // (eso dejaba la pantalla en blanco un rato antes de animar).
  const tabsEnFoco = useTabsEnFoco();
  const [mapaMontado, setMapaMontado] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMapaMontado(tabsEnFoco), tabsEnFoco ? 450 : 400);
    return () => clearTimeout(t);
  }, [tabsEnFoco]);
  // Solo usa la ubicación si el permiso ya se dio (en el mapa): el Inicio no muestra el aviso del sistema.
  const { coordenada } = useUbicacion({ pedirPermiso: false });
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [panelAbierto, setPanelAbierto] = useState(false);

  const recargarNotificaciones = useCallback(async (pacienteId: string) => {
    const lista = await listNotificacionesPaciente(pacienteId);
    setNotificaciones((anterior) => conservarSiIgual(anterior, lista));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setEnFoco(true);

      (async () => {
        const p = await getPacienteActual();
        if (!activo) return;
        recargarNotificaciones(p.id);

        // Plan y próximo turno (ya con profesional, especialidad y lugar) se piden juntos y se muestran juntos.
        const [pl, detalle] = await Promise.all([getPlanMedico(p.planMedicoId), getProximoTurno(p.id)]);
        const info: ProximoTurnoInfo | null = detalle?.medico
          ? { turno: detalle.turno, medico: detalle.medico, especialidad: detalle.especialidad, institucion: detalle.institucion, sede: detalle.sede }
          : null;
        if (!activo) return;
        setPaciente(p);
        setPlan(pl);
        setProximo((anterior) => conservarSiIgual(anterior, info));
        setCargado(true);
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
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
            alPresionar(pressed, 0.92),
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
        {/* Próximo turno y credencial del plan: se deslizan con el dedo (no avanzan solas). Una sola
            vez, a 1 s de entrar, se corren un poquito dos veces para indicar que se pueden deslizar.
            Sin turno próximo, queda solo la credencial. */}
        {cargado ? (
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
        ) : (
          // Mientras carga, un hueco del alto de la tarjeta para que el Inicio no salte cuando aparece.
          <View
            accessibilityLabel="Cargando tu próximo turno"
            style={[styles.carruselCargando, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.lg }]}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Accesos rápidos" />
        <View style={styles.quickAccessGrid}>
          <QuickAccess icon={Pill} label="Recetas" onPress={() => router.navigate("/recetas")} />
          <QuickAccess icon={Stethoscope} label="Turnos" onPress={() => router.navigate("/turnos")} />
          <QuickAccess icon={FileText} label="Estudios" onPress={() => router.navigate("/estudios")} />
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
          ) : !mapaMontado ? null : (
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
        accessibilityLabel={`Ver próximo turno de ${proximo.especialidad?.nombre ?? proximo.medico.profesion} con ${nombreConTitulo(proximo.medico)}`}
        style={({ pressed }) => alPresionar(pressed, 0.99)}
      >
        <View style={styles.turnoRow}>
          <View style={styles.turnoDoctor}>
            <Avatar uri={proximo.medico.avatarUrl} iniciales={iniciales(proximo.medico.nombre, proximo.medico.apellido)} />
            {/* Lo principal es el tipo de turno pedido (la especialidad); el profesional va debajo. */}
            <View style={styles.turnoTextos}>
              <Text variant="heading" style={[styles.tipoTurno, { color: theme.colors.foreground }]} numberOfLines={1}>
                {proximo.especialidad?.nombre ?? proximo.medico.profesion}
              </Text>
              <Text style={[styles.doctorName, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                {nombreConTitulo(proximo.medico)}
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
            // Lleva a Turnos → Próximos y abre el detalle de este turno; `t` cambia en cada toque para que se
            // vuelva a abrir aunque sea el mismo.
            onPress={() => router.navigate({ pathname: "/turnos", params: { abrirTurno: proximo.turno.id, t: String(Date.now()) } })}
            accessibilityLabel="Ver el detalle del próximo turno"
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

function QuickAccess({ icon, label, onPress }: { icon: typeof Pill; label: string; onPress: () => void }) {
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
  carruselCargando: { height: 211 },
  seccionMapa: { flex: 1, marginBottom: 0 },
  accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  turnoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  turnoDoctor: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, marginRight: 8 },
  turnoTextos: { flex: 1 },
  tipoTurno: { fontSize: 17, fontWeight: "700" },
  doctorName: { fontSize: 13, marginTop: 2 },
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
