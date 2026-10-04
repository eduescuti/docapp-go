import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ClipboardList, MapPin } from "lucide-react-native";

import { BackHeader, Card, EmptyState, IconBadge, ScreenContainer, StatusBadge, Text } from "@/components";
import { Institucion, Medico, OrdenLaboratorio } from "@/domain";
import { getInstitucion, getMedico, getPacienteActual, listOrdenesPaciente } from "@/services";
import { useTheme } from "@/theme";
import { formatFechaLarga, nombreConTitulo } from "@/utils/format";

interface OrdenDetalle {
  orden: OrdenLaboratorio;
  medico?: Medico;
  institucion?: Institucion;
}

/** Órdenes médicas (de laboratorio y estudios) que le indicaron al paciente. */
export default function OrdenesScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<OrdenDetalle[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await getPacienteActual();
        const ordenes = await listOrdenesPaciente(p.id);
        const detalle = await Promise.all(
          ordenes.map(async (orden) => ({
            orden,
            medico: await getMedico(orden.medicoId),
            institucion: await getInstitucion(orden.institucionId),
          })),
        );
        setItems(detalle.sort((a, b) => b.orden.fecha.localeCompare(a.orden.fecha)));
      })();
    }, []),
  );

  return (
    <ScreenContainer>
      <BackHeader titulo="Órdenes médicas" />
      {items?.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          titulo="No tenés órdenes médicas"
          descripcion="Las órdenes de laboratorio y estudios que te indiquen van a aparecer acá."
        />
      )}
      {items?.map(({ orden, medico, institucion }) => (
        <Card key={orden.id} style={styles.card}>
          <View style={styles.header}>
            <IconBadge icon={ClipboardList} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>
                {orden.estudiosSolicitados.join(", ")}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                {medico ? nombreConTitulo(medico) : "Profesional"} · {formatFechaLarga(orden.fecha)}
              </Text>
            </View>
            <StatusBadge estado={orden.estado} />
          </View>
          {institucion && (
            <View style={styles.lugar}>
              <MapPin size={14} color={theme.colors.primary} />
              <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 0 }]}>{institucion.nombre}</Text>
            </View>
          )}
          {orden.indicaciones ? (
            <View style={[styles.indicaciones, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.md }]}>
              <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Indicaciones</Text>
              <Text style={{ color: theme.colors.foreground, fontSize: 13 }}>{orden.indicaciones}</Text>
            </View>
          ) : null}
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  titulo: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  lugar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  label: { fontSize: 11, marginBottom: 2 },
  indicaciones: { padding: 12, marginTop: 12 },
});
