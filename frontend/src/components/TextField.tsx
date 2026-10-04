import React, { forwardRef } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** Elemento a la derecha del input (p. ej. botón de mostrar contraseña). */
  right?: React.ReactNode;
}

/** Input con etiqueta, ayuda y error, con los tokens del tema activo. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, right, style, multiline, ...rest },
  ref,
) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.muted,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.colors.mutedForeground}
          multiline={multiline}
          style={[
            styles.input,
            { color: theme.colors.foreground, fontFamily: theme.fonts.body },
            multiline && styles.multiline,
            style,
          ]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.helper, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: theme.colors.mutedForeground }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "500", marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, minHeight: 48 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  helper: { fontSize: 12, marginTop: 6 },
});
