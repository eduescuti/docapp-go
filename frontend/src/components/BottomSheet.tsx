import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { SheetModal } from "./SheetModal";
import { Text } from "./Text";

interface BottomSheetProps {
  visible: boolean;
  titulo: string;
  onClose: () => void;
  /** A la derecha del título (p. ej. el estado del turno). */
  extraTitulo?: React.ReactNode;
  children: React.ReactNode;
  /** Botones fijos abajo, fuera del scroll. */
  pie?: React.ReactNode;
}

/** Panel que sube desde abajo con un detalle y sus acciones (turnos, estudios). */
export function BottomSheet({ visible, titulo, onClose, extraTitulo, children, pie }: BottomSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      style={[
        styles.hoja,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderTopLeftRadius: theme.radii.lg * 2,
          borderTopRightRadius: theme.radii.lg * 2,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={[styles.manija, { backgroundColor: theme.colors.border }]} />
      <View style={styles.encabezado}>
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]} numberOfLines={2}>
          {titulo}
        </Text>
        {extraTitulo}
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={8} style={styles.cerrar}>
          <X size={20} color={theme.colors.mutedForeground} />
        </Pressable>
      </View>
      <ScrollView style={styles.contenido} contentContainerStyle={styles.contenidoInterno}>
        {children}
      </ScrollView>
      {pie ? <View style={styles.pie}>{pie}</View> : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  hoja: { maxHeight: "85%", borderWidth: 1, paddingHorizontal: 24, paddingTop: 8 },
  manija: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  titulo: { flex: 1, fontSize: 18, fontWeight: "700" },
  cerrar: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -10 },
  contenido: { flexGrow: 0 },
  contenidoInterno: { paddingBottom: 4 },
  pie: { gap: 10, marginTop: 16 },
});
