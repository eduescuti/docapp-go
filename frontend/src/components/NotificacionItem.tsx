import { Pressable, StyleSheet, View } from "react-native";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  ClipboardList,
  FileCheck,
  Pill,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Notificacion, TipoNotificacion } from "@/domain";
import { useTheme } from "@/theme";
import { alPresionar } from "@/utils/presionado";
import { Text } from "./Text";

const ICONOS: Record<TipoNotificacion, LucideIcon> = {
  recordatorio_turno: Bell,
  turno_confirmado: CalendarCheck,
  turno_rechazado: CalendarX,
  turno_cancelado: CalendarX,
  turno_reprogramado: CalendarClock,
  resultado_disponible: FileCheck,
  nueva_receta: Pill,
  nueva_orden: ClipboardList,
};

interface NotificacionItemProps {
  notificacion: Notificacion;
  onPress?: () => void;
}

/** Fila de notificación: ícono por tipo, punto de "no leída" y tiempo relativo. */
export function NotificacionItem({ notificacion: n, onPress }: NotificacionItemProps) {
  const { theme } = useTheme();
  const Icono = ICONOS[n.tipo];
  const hace = formatDistanceToNow(parseISO(n.fecha), { addSuffix: true, locale: es });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${n.leida ? "" : "No leída. "}${n.titulo}. ${n.mensaje}. ${hace}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: n.leida ? "transparent" : `${theme.colors.primary}14`,
          borderRadius: theme.radii.md,
        },
        alPresionar(pressed, 0.99),
      ]}
    >
      <View style={[styles.icono, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.full }]}>
        <Icono size={18} color={theme.colors.accentForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.tituloRow}>
          <Text style={[styles.titulo, { color: theme.colors.foreground, fontWeight: n.leida ? "500" : "700" }]} numberOfLines={1}>
            {n.titulo}
          </Text>
          {!n.leida && <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />}
        </View>
        <Text style={[styles.mensaje, { color: theme.colors.mutedForeground }]}>{n.mensaje}</Text>
        <Text style={[styles.hace, { color: theme.colors.mutedForeground }]}>{hace}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, padding: 12, minHeight: 44 },
  icono: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  tituloRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titulo: { fontSize: 14, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  mensaje: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  hace: { fontSize: 11, marginTop: 4 },
});
