import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Bell, Calendar, Clock, FileText, MapPin, Search, Stethoscope } from "lucide-react-native";

import {
  Avatar,
  Card,
  IconBadge,
  NotificacionesSheet,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  StatusBadge,
  Text,
} from "@/components";
import { Especialidad, Institucion, Medico, Notificacion, Paciente, Sede, Turno } from "@/domain";
import {
  getEspecialidad,
  getInstitucion,
  getMedico,
  getPacienteActual,
  getProximoTurno,
  listInstituciones,
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

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [proximo, setProximo] = useState<ProximoTurnoInfo | null>(null);
  const [institucionCercana, setInstitucionCercana] = useState<{ nombre: string; direccion: string } | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [panelAbierto, setPanelAbierto] = useState(false);

  const recargarNotificaciones = useCallback(async (pacienteId: string) => {
    setNotificaciones(await listNotificacionesPaciente(pacienteId));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      (async () => {
        const p = await getPacienteActual();
        if (!activo) return;
        setPaciente(p);
        recargarNotificaciones(p.id);

        const turno = await getProximoTurno(p.id);
        if (turno) {
          const medico = await getMedico(turno.medicoId);
          if (medico && activo) {
            const [especialidad, institucion] = await Promise.all([
              getEspecialidad(medico.especialidadId),
              getInstitucion(medico.institucionesIds[0]),
            ]);
            const sede = institucion?.sedes.find((s) => s.id === turno.sedeId);
            setProximo({ turno, medico, especialidad, institucion, sede });
          }
        } else if (activo) {
          setProximo(null);
        }

        const instituciones = await listInstituciones({ planMedicoId: p.planMedicoId });
        if (instituciones[0] && activo) {
          setInstitucionCercana({ nombre: instituciones[0].nombre, direccion: instituciones[0].sedes[0]?.direccion ?? "" });
        }
      })();

      return () => {
        activo = false;
      };
    }, [recargarNotificaciones]),
  );

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <ScreenContainer>
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
        <SectionHeader title="Próximo turno" />
        {proximo ? (
          <Card onPress={() => router.push(`/medico/${proximo.medico.id}`)} accessibilityLabel="Ver próximo turno">
            <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />
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
        ) : (
          <Card>
            <Text style={{ color: theme.colors.mutedForeground }}>No tenés turnos próximos.</Text>
          </Card>
        )}
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

      <View style={styles.section}>
        <SectionHeader title="Instituciones cercanas" actionLabel="Ver mapa" onActionPress={() => router.push("/mapa")} />
        <Card padded={false} onPress={() => router.push("/mapa")} accessibilityLabel="Ver instituciones cercanas en el mapa">
          <View style={[styles.mapPreview, { backgroundColor: theme.colors.muted }]}>
            <MapPin size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.institucionInfo}>
            <Text style={[styles.doctorName, { color: theme.colors.foreground }]}>
              {institucionCercana?.nombre ?? "Buscando instituciones..."}
            </Text>
            <Text style={[styles.doctorSpecialty, { color: theme.colors.mutedForeground }]}>
              {institucionCercana?.direccion}
            </Text>
          </View>
        </Card>
      </View>
    </ScreenContainer>
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
    marginBottom: 24,
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
  section: { marginBottom: 28 },
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
  mapPreview: { height: 120, alignItems: "center", justifyContent: "center" },
  institucionInfo: { padding: 16 },
});
