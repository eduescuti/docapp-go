import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check, Eye, EyeOff, X } from "lucide-react-native";

import { useTheme } from "@/theme";
import { evaluarPassword, PASSWORD_MIN_LENGTH, ReglasPassword } from "@/utils/validation";

import { Text } from "./Text";
import { TextField, TextFieldProps } from "./TextField";

interface PasswordFieldProps extends Omit<TextFieldProps, "secureTextEntry" | "right"> {
  /** Muestra el checklist de requisitos de seguridad (para registro, no para login). */
  mostrarRequisitos?: boolean;
}

const REQUISITOS: { key: keyof ReglasPassword; label: string }[] = [
  { key: "largo", label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres` },
  { key: "mayuscula", label: "Una letra mayúscula" },
  { key: "numero", label: "Un número" },
  { key: "especial", label: "Un carácter especial" },
];

export function PasswordField({ mostrarRequisitos, value = "", ...rest }: PasswordFieldProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const reglas = evaluarPassword(value);

  return (
    <View>
      <TextField
        {...rest}
        value={value}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        right={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            hitSlop={8}
            style={styles.toggle}
          >
            {visible ? (
              <EyeOff size={18} color={theme.colors.mutedForeground} />
            ) : (
              <Eye size={18} color={theme.colors.mutedForeground} />
            )}
          </Pressable>
        }
      />
      {mostrarRequisitos && (
        <View style={styles.reqList} accessibilityLabel="Requisitos de la contraseña">
          {REQUISITOS.map(({ key, label }) => {
            const ok = reglas[key];
            const color = ok ? theme.colors.success : theme.colors.mutedForeground;
            return (
              <View key={key} style={styles.reqRow}>
                {ok ? <Check size={14} color={color} /> : <X size={14} color={color} />}
                <Text style={[styles.reqText, { color }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  reqList: { flexDirection: "row", flexWrap: "wrap", marginTop: -4, marginBottom: 12, rowGap: 4 },
  reqRow: { width: "50%", flexDirection: "row", alignItems: "center", gap: 6 },
  reqText: { fontSize: 12 },
});
