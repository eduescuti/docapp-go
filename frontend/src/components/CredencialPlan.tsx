import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { ShieldCheck } from "lucide-react-native";

import type { PlanMedico } from "@/domain";
import { useTheme } from "@/theme";
import { Text } from "./Text";

interface CredencialPlanProps {
  plan?: PlanMedico;
  /** "Sofía Martínez" */
  afiliado: string;
  dni: string;
  /** Si se pasa, la credencial es un botón (en el Inicio abre "Mi plan médico"). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Credencial del plan médico del paciente (Mi plan y el carrusel del Inicio). */
export function CredencialPlan({ plan, afiliado, dni, onPress, style }: CredencialPlanProps) {
  const { theme } = useTheme();
  const color = theme.colors.primaryForeground;
  const descripcion = `Credencial: ${plan?.nombre ?? ""}, ${afiliado}, DNI ${dni}`;

  const contenido = (
    <>
      <View style={styles.encabezado}>
        <Text style={[styles.aseguradora, { color }]}>{plan?.aseguradora ?? "—"}</Text>
        <ShieldCheck size={24} color={color} />
      </View>
      <Text variant="heading" style={[styles.plan, { color }]}>{plan?.nombre ?? "Cargando..."}</Text>
      <View style={styles.pie}>
        <View>
          <Text style={[styles.etiqueta, { color }]}>Afiliado/a</Text>
          <Text style={[styles.valor, { color }]}>{afiliado}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.etiqueta, { color }]}>DNI</Text>
          <Text style={[styles.valor, { color }]}>{dni}</Text>
        </View>
      </View>
    </>
  );

  const fondo = { backgroundColor: theme.colors.primary, borderRadius: theme.radii.lg * 1.5 };

  if (!onPress) {
    return (
      <View style={[styles.base, fondo, style]} accessible accessibilityLabel={descripcion}>
        {contenido}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${descripcion}. Ver mi plan médico`}
      style={({ pressed }) => [styles.base, fondo, { opacity: pressed ? 0.9 : 1 }, style]}
    >
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { padding: 20, gap: 8 },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aseguradora: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, opacity: 0.9 },
  plan: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  // marginTop auto: si la tarjeta queda más alta (carrusel del Inicio), el pie va abajo de todo.
  pie: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: "auto" },
  etiqueta: { fontSize: 11, opacity: 0.8 },
  valor: { fontSize: 14, fontWeight: "700", marginTop: 2 },
});
