import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { BellOff, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Notificacion } from "@/domain";
import { useTheme } from "@/theme";
import { NotificacionItem } from "./NotificacionItem";
import { PrimaryButton } from "./PrimaryButton";
import { SheetModal } from "./SheetModal";
import { Text } from "./Text";

interface NotificacionesSheetProps {
  visible: boolean;
  notificaciones: Notificacion[];
  onClose: () => void;
  onPressNotificacion: (n: Notificacion) => void;
  onMarcarTodas: () => void;
  onVerTodas: () => void;
}

/** Panel inferior que abre la campana del Inicio con las notificaciones recientes. */
export function NotificacionesSheet({
  visible,
  notificaciones,
  onClose,
  onPressNotificacion,
  onMarcarTodas,
  onVerTodas,
}: NotificacionesSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      etiquetaFondo="Cerrar notificaciones"
      style={[
        styles.sheet,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderTopLeftRadius: theme.radii.lg * 2,
          borderTopRightRadius: theme.radii.lg * 2,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
      <View style={styles.header}>
        <View>
          <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>Notificaciones</Text>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
            {noLeidas > 0 ? `${noLeidas} sin leer` : "Estás al día"}
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={8} style={styles.close}>
          <X size={20} color={theme.colors.mutedForeground} />
        </Pressable>
      </View>

      {notificaciones.length === 0 ? (
        <View style={styles.vacio}>
          <BellOff size={28} color={theme.colors.mutedForeground} />
          <Text style={{ color: theme.colors.mutedForeground }}>No tenés notificaciones.</Text>
        </View>
      ) : (
        <ScrollView style={styles.lista} contentContainerStyle={{ gap: 4 }}>
          {notificaciones.map((n) => (
            <NotificacionItem key={n.id} notificacion={n} onPress={() => onPressNotificacion(n)} />
          ))}
        </ScrollView>
      )}

      <View style={styles.acciones}>
        {noLeidas > 0 && (
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Marcar leídas" variant="outline" onPress={onMarcarTodas} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Ver todas" onPress={onVerTodas} />
        </View>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: "80%", borderWidth: 1, paddingHorizontal: 16, paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8, marginBottom: 8 },
  titulo: { fontSize: 18, fontWeight: "700" },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  lista: { flexGrow: 0 },
  vacio: { alignItems: "center", gap: 8, paddingVertical: 32 },
  acciones: { flexDirection: "row", gap: 12, marginTop: 12, paddingHorizontal: 8 },
});
