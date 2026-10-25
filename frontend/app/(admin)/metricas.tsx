import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CalendarCheck, Hourglass, Star } from "lucide-react-native";

import {
  Avatar,
  Card,
  HorizontalBarChart,
  ScreenContainer,
  SectionHeader,
  StarRating,
  StatCard,
  Text,
} from "@/components";
import { Conteo, getMetricasAdmin, MetricasAdmin } from "@/services";
import { useTheme } from "@/theme";
import { iniciales, nombreConTitulo } from "@/utils/format";

/** Métricas del administrador: turnos por estado, especialidad e institución, y los profesionales mejor valorados. */
export default function AdminMetricasScreen() {
  const { theme } = useTheme();
  const [metricas, setMetricas] = useState<MetricasAdmin | null>(null);

  // Se recarga al volver a la pestaña: los turnos cambian mientras se usa la app.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      getMetricasAdmin().then((m) => {
        if (activo) setMetricas(m);
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  const grafico = (datos: Conteo[] | undefined, unidad: string) => (
    <Card style={styles.card}>
      {!datos ? (
        <Text style={{ color: theme.colors.mutedForeground }}>Cargando...</Text>
      ) : datos.length === 0 ? (
        <Text style={{ color: theme.colors.mutedForeground }}>Todavía no hay datos.</Text>
      ) : (
        <HorizontalBarChart data={datos.map((d) => ({ label: d.etiqueta, value: d.cantidad }))} unidad={unidad} />
      )}
    </Card>
  );

  return (
    <ScreenContainer>
      <Text style={[styles.overline, { color: theme.colors.mutedForeground }]}>Administrador</Text>
      <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>
        Métricas
      </Text>

      <View style={styles.stats}>
        <StatCard icon={CalendarCheck} valor={metricas?.turnos ?? "–"} etiqueta="Turnos" />
        <StatCard icon={Hourglass} valor={metricas?.pendientes ?? "–"} etiqueta="Por confirmar" />
        <StatCard
          icon={Star}
          valor={metricas ? metricas.valoracionPromedio.toFixed(1).replace(".", ",") : "–"}
          etiqueta="Valoración media"
        />
      </View>

      <SectionHeader title="Turnos por estado" />
      {grafico(metricas?.turnosPorEstado, "turnos")}

      <SectionHeader title="Turnos por especialidad" />
      {grafico(metricas?.turnosPorEspecialidad, "turnos")}

      <SectionHeader title="Instituciones con más turnos" />
      {grafico(metricas?.turnosPorInstitucion, "turnos")}

      <SectionHeader title="Profesionales mejor valorados" />
      <Card style={styles.card}>
        {!metricas ? (
          <Text style={{ color: theme.colors.mutedForeground }}>Cargando...</Text>
        ) : (
          metricas.mejorValorados.map(({ medico, especialidad }, i) => (
            <View
              key={medico.id}
              style={[styles.ranking, i > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}
              accessible
              accessibilityLabel={`Puesto ${i + 1}: ${nombreConTitulo(medico)}, ${especialidad ?? medico.profesion}, ${medico.valoracion.toFixed(1)} estrellas en ${medico.cantidadValoraciones} opiniones`}
            >
              <Text variant="heading" style={[styles.puesto, { color: theme.colors.primary }]}>
                {i + 1}
              </Text>
              <Avatar uri={medico.avatarUrl} iniciales={iniciales(medico.nombre, medico.apellido)} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.nombre, { color: theme.colors.foreground }]} numberOfLines={1}>
                  {nombreConTitulo(medico)}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                  {especialidad ?? medico.profesion}
                </Text>
                <View style={styles.estrellas}>
                  <StarRating value={Math.round(medico.valoracion)} size={12} label="Valoración" />
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 0 }]}>
                    {medico.valoracion.toFixed(1).replace(".", ",")} · {medico.cantidadValoraciones} opiniones
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overline: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: "700", marginTop: 2, marginBottom: 24 },
  stats: { flexDirection: "row", gap: 10, marginBottom: 28 },
  card: { marginBottom: 28 },
  ranking: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  puesto: { width: 18, fontSize: 16, fontWeight: "700", textAlign: "center" },
  nombre: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  estrellas: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
});
