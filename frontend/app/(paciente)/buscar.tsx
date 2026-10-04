import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { Search, SlidersHorizontal, Star } from "lucide-react-native";

import { Avatar, Card, Chip, ScreenContainer, Text } from "@/components";
import { Especialidad, Medico } from "@/domain";
import { listEspecialidades, searchMedicos, getPacienteActual } from "@/services";
import { useTheme } from "@/theme";
import { iniciales, nombreConTitulo } from "@/utils/format";

export default function BuscarScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadId, setEspecialidadId] = useState<string | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [planMedicoId, setPlanMedicoId] = useState<string | undefined>();

  useEffect(() => {
    listEspecialidades().then(setEspecialidades);
    getPacienteActual().then((p) => setPlanMedicoId(p.planMedicoId));
  }, []);

  const buscar = useCallback(async () => {
    const resultado = await searchMedicos({
      query,
      especialidadId: especialidadId ?? undefined,
      planMedicoId,
    });
    setMedicos(resultado);
  }, [query, especialidadId, planMedicoId]);

  useEffect(() => {
    if (planMedicoId) buscar();
  }, [planMedicoId, buscar]);

  return (
    <ScreenContainer scroll={false} style={styles.container}>
      <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>Buscar</Text>

      <View style={styles.searchRow}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}>
          <Search size={18} color={theme.colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={buscar}
            placeholder="Médicos, especialidades..."
            placeholderTextColor={theme.colors.mutedForeground}
            accessibilityLabel="Buscar médicos o especialidades"
            style={[styles.searchInput, { color: theme.colors.foreground }]}
          />
        </View>
        <View style={[styles.filterButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <SlidersHorizontal size={20} color={theme.colors.foreground} />
        </View>
      </View>

      <FlatList
        data={[{ id: null, nombre: "Todos" } as Especialidad & { id: null }, ...especialidades]}
        horizontal
        keyExtractor={(item) => item.id ?? "todos"}
        showsHorizontalScrollIndicator={false}
        style={styles.chipList}
        contentContainerStyle={{ gap: 8, alignItems: "center" }}
        renderItem={({ item }) => (
          <Chip
            label={item.nombre}
            selected={especialidadId === item.id}
            onPress={() => setEspecialidadId(item.id)}
          />
        )}
      />

      <FlatList
        data={medicos}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.mutedForeground, marginTop: 24 }}>
            No encontramos médicos con esos filtros.
          </Text>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => router.push(`/medico/${item.id}`)}
            accessibilityLabel={`Ver perfil de ${item.nombre} ${item.apellido}`}
            style={styles.medicoCard}
          >
            <View style={styles.medicoRow}>
              <Avatar uri={item.avatarUrl} iniciales={iniciales(item.nombre, item.apellido)} size={64} />
              <View style={{ flex: 1 }}>
                <View style={styles.medicoHeader}>
                  <Text style={[styles.medicoNombre, { color: theme.colors.foreground }]}>
                    {nombreConTitulo(item)}
                  </Text>
                  <View style={styles.rating}>
                    <Star size={12} color="#EAB308" fill="#EAB308" />
                    <Text style={styles.ratingText}>{item.valoracion.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={[styles.medicoSub, { color: theme.colors.mutedForeground }]}>
                  {especialidades.find((e) => e.id === item.especialidadId)?.nombre}
                </Text>
              </View>
            </View>
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 0 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, minHeight: 48, fontSize: 14 },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipList: { flexGrow: 0, flexShrink: 0, marginBottom: 16 },
  listContent: { paddingBottom: 32 },
  medicoCard: { marginBottom: 16 },
  medicoRow: { flexDirection: "row", gap: 16 },
  medicoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  medicoNombre: { fontSize: 15, fontWeight: "600" },
  medicoSub: { fontSize: 12, marginTop: 4 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontWeight: "600", color: "#EAB308" },
});
