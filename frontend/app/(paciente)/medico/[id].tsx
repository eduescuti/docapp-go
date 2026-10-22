import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Heart, Star } from "lucide-react-native";

import { Card, Text } from "@/components";
import { Especialidad, Medico } from "@/domain";
import {
  alternarMedicoFavorito,
  esMedicoFavorito,
  getEspecialidad,
  getMedico,
} from "@/services";
import { useTheme } from "@/theme";
import { nombreConTitulo } from "@/utils/format";

export default function MedicoProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [medico, setMedico] = useState<Medico | null>(null);
  const [especialidad, setEspecialidad] = useState<Especialidad | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);

  useEffect(() => {
    if (!id) return;

    getMedico(id).then((m) => {
      if (!m) return;
      setMedico(m);
      getEspecialidad(m.especialidadId).then((e) => setEspecialidad(e ?? null));
    });

    esMedicoFavorito(id).then(setEsFavorito);
  }, [id]);

  const handleToggleFavorito = async () => {
    if (!id) return;
    const nuevoEstado = await alternarMedicoFavorito(id);
    setEsFavorito(nuevoEstado);
  };

  if (!medico) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.heroImageWrapper}>
        {medico.avatarUrl && <Image source={{ uri: medico.avatarUrl }} style={styles.heroImage} />}
        <View style={[styles.heroOverlay, { backgroundColor: theme.colors.background }]} />
      </View>

      {/* Botón Volver (Izquierda) */}
      <View style={[styles.backButtonWrapper, { top: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          style={[styles.actionButton, { backgroundColor: `${theme.colors.card}CC`, borderColor: theme.colors.border }]}
        >
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
      </View>

      {/* Botón Favorito (Derecha) */}
      <View style={[styles.favoriteButtonWrapper, { top: insets.top + 12 }]}>
        <Pressable
          onPress={handleToggleFavorito}
          accessibilityRole="button"
          accessibilityLabel={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          hitSlop={8}
          style={[styles.actionButton, { backgroundColor: `${theme.colors.card}CC`, borderColor: theme.colors.border }]}
        >
          <Heart
            size={20}
            color={esFavorito ? "#EF4444" : theme.colors.foreground}
            fill={esFavorito ? "#EF4444" : "transparent"}
          />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
            {nombreConTitulo(medico)}
          </Text>
          <View style={styles.ratingBadge}>
            <Star size={14} color="#EAB308" fill="#EAB308" />
            <Text style={styles.ratingText}>{medico.valoracion.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={[styles.especialidad, { color: theme.colors.primary }]}>{especialidad?.nombre}</Text>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.foreground }]}>{medico.aniosExperiencia}+</Text>
            <Text style={[styles.statLabel, { color: theme.colors.mutedForeground }]}>Años Exp.</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.foreground }]}>{medico.cantidadValoraciones}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.mutedForeground }]}>Pacientes</Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Sobre el/la profesional</Text>
        <Text style={[styles.descripcion, { color: theme.colors.mutedForeground }]}>{medico.descripcion}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroImageWrapper: { height: 220, width: "100%" },
  heroImage: { width: "100%", height: "100%", opacity: 0.85 },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 100, opacity: 0.001 },
  backButtonWrapper: { position: "absolute", left: 24, zIndex: 10 },
  favoriteButtonWrapper: { position: "absolute", right: 24, zIndex: 10 },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, paddingHorizontal: 24, marginTop: -24 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 },
  nombre: { fontSize: 22, fontWeight: "700", flex: 1 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: { fontSize: 13, fontWeight: "700", color: "#CA8A04" },
  especialidad: { fontSize: 14, fontWeight: "600", marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 10, textTransform: "uppercase", marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  descripcion: { fontSize: 13, lineHeight: 20 },
});