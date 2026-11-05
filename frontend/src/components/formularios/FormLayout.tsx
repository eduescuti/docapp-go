import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

interface FormLayoutProps {
  /** Queda fijo arriba: nunca se va de pantalla. */
  header: React.ReactNode;
  children: React.ReactNode;
  /** Acciones principales, pegadas al final de la pantalla. */
  footer?: React.ReactNode;
}

/**
 * Layout de formularios de registro: encabezado fijo, contenido que ocupa el alto
 * disponible y botón abajo. Si el formulario entra en pantalla no se puede scrollear
 * (sin rebote ni overscroll). Solo habilita el scroll cuando realmente no entra —
 * teclado abierto o pantallas muy chicas — para que ningún campo quede inalcanzable.
 */
export function FormLayout({ header, children, footer }: FormLayoutProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>{header}</View>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.root}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 24 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  footer: { paddingTop: 16, gap: 12 },
});
