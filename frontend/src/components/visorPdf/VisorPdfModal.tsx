import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileWarning, Minus, Plus, X } from "lucide-react-native";

import { useTheme } from "@/theme";

import { Text } from "../Text";
import { VisorPdf } from "./VisorPdf";

const ZOOMS = [1, 1.5, 2, 3];

interface VisorPdfModalProps {
  visible: boolean;
  titulo: string;
  /** PDF como string binario. Null mientras se carga. */
  datos: string | null;
  onClose: () => void;
}

/** Pantalla completa para leer un estudio: zoom con botones (y pellizcando en el celular) y scroll libre. */
export function VisorPdfModal({ visible, titulo, datos, onClose }: VisorPdfModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [nivel, setNivel] = useState(0);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre un estudio, arranca de cero.
  useEffect(() => {
    if (visible) {
      setNivel(0);
      setListo(false);
      setError(null);
    }
  }, [visible, datos]);

  const botonZoom = (icono: typeof Plus, etiqueta: string, onPress: () => void, deshabilitado: boolean) => {
    const Icono = icono;
    return (
      <Pressable
        onPress={onPress}
        disabled={deshabilitado}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        accessibilityState={{ disabled: deshabilitado }}
        style={[styles.botonZoom, { borderColor: theme.colors.border, opacity: deshabilitado ? 0.4 : 1 }]}
      >
        <Icono size={18} color={theme.colors.foreground} />
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.pantalla, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={[styles.barra, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar estudio" hitSlop={8} style={styles.cerrar}>
            <X size={22} color={theme.colors.foreground} />
          </Pressable>
          <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]} numberOfLines={1}>
            {titulo}
          </Text>
          {botonZoom(Minus, "Alejar", () => setNivel((n) => Math.max(0, n - 1)), nivel === 0 || !listo)}
          <Text style={[styles.porcentaje, { color: theme.colors.mutedForeground }]}>{Math.round(ZOOMS[nivel] * 100)}%</Text>
          {botonZoom(Plus, "Acercar", () => setNivel((n) => Math.min(ZOOMS.length - 1, n + 1)), nivel === ZOOMS.length - 1 || !listo)}
        </View>

        <View style={styles.cuerpo}>
          {datos && !error ? (
            <VisorPdf datos={datos} zoom={ZOOMS[nivel]} onListo={() => setListo(true)} onError={setError} style={StyleSheet.absoluteFill} />
          ) : null}
          {error ? (
            <View style={[StyleSheet.absoluteFill, styles.estado]}>
              <FileWarning size={32} color={theme.colors.mutedForeground} />
              <Text style={[styles.estadoTexto, { color: theme.colors.mutedForeground }]}>
                {error} Revisá tu conexión e intentá de nuevo.
              </Text>
            </View>
          ) : !listo ? (
            <View style={[StyleSheet.absoluteFill, styles.estado, { backgroundColor: theme.colors.muted }]} pointerEvents="none">
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={[styles.estadoTexto, { color: theme.colors.mutedForeground }]}>Abriendo el estudio...</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  barra: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  cerrar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  titulo: { flex: 1, fontSize: 16, fontWeight: "700" },
  botonZoom: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  porcentaje: { width: 44, textAlign: "center", fontSize: 12, fontWeight: "600" },
  cuerpo: { flex: 1 },
  estado: { alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  estadoTexto: { fontSize: 14, textAlign: "center" },
});
