import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BadgeCheck, Clock, MapPin, Star } from "lucide-react-native";

import { Avatar, Card, LogoutButton, ScreenContainer, SectionHeader, Text } from "@/components";
import { Especialidad, Medico, Sede } from "@/domain";
import { getEspecialidad, getMedicoActual, getSede } from "@/services";
import { useTheme } from "@/theme";
import { iniciales } from "@/utils/format";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** Perfil profesional: datos de matrícula, lugares y horarios de atención. */
export default function DoctorPerfilScreen() {
  const { theme } = useTheme();
  const [medico, setMedico] = useState<Medico | null>(null);
  const [especialidad, setEspecialidad] = useState<Especialidad | undefined>();
  const [sedes, setSedes] = useState<Sede[]>([]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        const m = await getMedicoActual();
        const [esp, ...s] = await Promise.all([getEspecialidad(m.especialidadId), ...m.sedesIds.map(getSede)]);
        if (!activo) return;
        setMedico(m);
        setEspecialidad(esp);
        setSedes(s.filter((x): x is Sede => x !== undefined));
      })();
      return () => {
        activo = false;
      };
    }, []),
  );

  if (!medico) {
    return (
      <ScreenContainer>
        <Text style={{ color: theme.colors.mutedForeground }}>Cargando...</Text>
      </ScreenContainer>
    );
  }

  const nombreSede = (id: string) => sedes.find((s) => s.id === id)?.nombre ?? "Sede";

  return (
    <ScreenContainer>
      <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>Mi perfil</Text>

      <Card style={styles.perfil}>
        <Avatar uri={medico.avatarUrl} iniciales={iniciales(medico.nombre, medico.apellido)} size={72} />
        <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
          {medico.nombre} {medico.apellido}
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>
          {medico.profesion}
          {especialidad ? ` · ${especialidad.nombre}` : ""}
        </Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.full }]}>
            <BadgeCheck size={14} color={theme.colors.accentForeground} />
            <Text style={[styles.badgeText, { color: theme.colors.accentForeground }]}>Mat. {medico.matricula}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.full }]}>
            <Star size={14} color={theme.colors.foreground} />
            <Text style={[styles.badgeText, { color: theme.colors.foreground }]}>
              {medico.valoracion.toFixed(1)} ({medico.cantidadValoraciones})
            </Text>
          </View>
        </View>
        <Text style={[styles.descripcion, { color: theme.colors.mutedForeground }]}>{medico.descripcion}</Text>
      </Card>

      <SectionHeader title="Lugares de atención" />
      {sedes.map((s) => (
        <Card key={s.id} style={styles.item}>
          <View style={styles.itemRow}>
            <MapPin size={16} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{s.nombre}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                {s.direccion}, {s.ciudad}
              </Text>
            </View>
          </View>
        </Card>
      ))}

      <View style={{ height: 16 }} />
      <SectionHeader title="Horarios de atención" />
      {medico.horarios.map((h) => (
        <Card key={`${h.diaSemana}-${h.horaInicio}-${h.sedeId}`} style={styles.item}>
          <View style={styles.itemRow}>
            <Clock size={16} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>
                {DIAS[h.diaSemana]} · {h.horaInicio} a {h.horaFin}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{nombreSede(h.sedeId)}</Text>
            </View>
          </View>
        </Card>
      ))}

      <View style={{ marginTop: 24 }}>
        <LogoutButton />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  perfil: { alignItems: "center", gap: 8, marginBottom: 28, paddingVertical: 24 },
  nombre: { fontSize: 20, fontWeight: "700", marginTop: 4 },
  badges: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  descripcion: { fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 19 },
  item: { marginBottom: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
});
