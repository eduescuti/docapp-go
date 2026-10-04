import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { FileText, History, Pill, Stethoscope } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { BackHeader, Card, Chip, EmptyState, ScreenContainer, StatusBadge, Text } from "@/components";
import { EventoHistorial, getHistorialPaciente, getPacienteActual, TipoEventoHistorial } from "@/services";
import { useTheme } from "@/theme";
import { formatFechaLarga } from "@/utils/format";

const ICONOS: Record<TipoEventoHistorial, LucideIcon> = { consulta: Stethoscope, estudio: FileText, receta: Pill };

type Filtro = "todo" | TipoEventoHistorial;
const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "consulta", label: "Consultas" },
  { id: "estudio", label: "Estudios" },
  { id: "receta", label: "Recetas" },
];

/** Línea de tiempo con consultas cumplidas, estudios y recetas del paciente. */
export default function HistorialScreen() {
  const { theme } = useTheme();
  const [eventos, setEventos] = useState<EventoHistorial[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todo");

  useFocusEffect(
    useCallback(() => {
      getPacienteActual().then((p) => getHistorialPaciente(p.id)).then(setEventos);
    }, []),
  );

  const visibles = eventos?.filter((e) => filtro === "todo" || e.tipo === filtro) ?? [];

  return (
    <ScreenContainer>
      <BackHeader titulo="Historial" />

      <View style={styles.filtros}>
        {FILTROS.map((f) => (
          <Chip key={f.id} label={f.label} selected={filtro === f.id} onPress={() => setFiltro(f.id)} />
        ))}
      </View>

      {eventos && visibles.length === 0 && (
        <EmptyState icon={History} titulo="Sin registros" descripcion="Tus consultas, estudios y recetas van a quedar registrados acá." />
      )}

      {visibles.map((e, i) => {
        const Icono = ICONOS[e.tipo];
        const ultimo = i === visibles.length - 1;
        return (
          <View key={`${e.tipo}-${e.id}`} style={styles.evento}>
            <View style={styles.linea}>
              <View style={[styles.punto, { backgroundColor: theme.colors.accent, borderColor: theme.colors.primary }]}>
                <Icono size={14} color={theme.colors.accentForeground} />
              </View>
              {!ultimo && <View style={[styles.conector, { backgroundColor: theme.colors.border }]} />}
            </View>
            <Card style={styles.card}>
              <Text style={[styles.fecha, { color: theme.colors.primary }]}>{formatFechaLarga(e.fecha)}</Text>
              <View style={styles.tituloRow}>
                <Text style={[styles.titulo, { color: theme.colors.foreground }]}>{e.titulo}</Text>
                {e.estado && <StatusBadge estado={e.estado} />}
              </View>
              {e.detalle ? <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]}>{e.detalle}</Text> : null}
            </Card>
          </View>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filtros: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  evento: { flexDirection: "row", gap: 12 },
  linea: { alignItems: "center", width: 32 },
  punto: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  conector: { flex: 1, width: 2, marginVertical: 4 },
  card: { flex: 1, marginBottom: 14 },
  fecha: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  tituloRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  titulo: { fontSize: 14, fontWeight: "600", flex: 1 },
  detalle: { fontSize: 12, marginTop: 4 },
});
