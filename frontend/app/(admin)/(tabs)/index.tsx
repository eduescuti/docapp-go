import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Stethoscope, User, Users } from "lucide-react-native";

import { Card, HorizontalBarChart, LogoutButton, ScreenContainer, SectionHeader, StatCard, Text } from "@/components";
import { ConteoObraSocial, EstadisticasUso, getEstadisticasUso, getPacientesPorObraSocial } from "@/services";
import { useTheme } from "@/theme";

/** Panel del administrador: uso de la app y distribución de pacientes por obra social. */
export default function AdminPanelScreen() {
  const { theme } = useTheme();
  const [uso, setUso] = useState<EstadisticasUso | null>(null);
  const [porObraSocial, setPorObraSocial] = useState<ConteoObraSocial[]>([]);

  // Se recarga al volver a la pestaña para reflejar obras sociales recién cargadas.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      Promise.all([getEstadisticasUso(), getPacientesPorObraSocial()]).then(([u, p]) => {
        if (!activo) return;
        setUso(u);
        setPorObraSocial(p);
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  return (
    <ScreenContainer>
      <Text style={[styles.overline, { color: theme.colors.mutedForeground }]}>Administrador</Text>
      <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>
        Panel general
      </Text>

      <SectionHeader title="Personas en la app" />
      <View style={styles.stats}>
        <StatCard icon={User} valor={uso?.pacientes ?? "–"} etiqueta="Pacientes" />
        <StatCard icon={Stethoscope} valor={uso?.profesionales ?? "–"} etiqueta="Profesionales" />
        <StatCard icon={Users} valor={uso?.total ?? "–"} etiqueta="Total" />
      </View>

      <SectionHeader title="Pacientes por obra social" />
      <Card style={{ marginBottom: 28 }}>
        {porObraSocial.length === 0 ? (
          <Text style={{ color: theme.colors.mutedForeground }}>Cargando...</Text>
        ) : (
          <HorizontalBarChart
            data={porObraSocial.map((c) => ({ label: c.obraSocial, value: c.cantidad }))}
            unidad="pacientes"
          />
        )}
      </Card>

      <LogoutButton />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overline: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: "700", marginTop: 2, marginBottom: 24 },
  stats: { flexDirection: "row", gap: 10, marginBottom: 28 },
});
