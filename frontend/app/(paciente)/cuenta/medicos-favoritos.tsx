import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Heart, Star } from "lucide-react-native";

import { Avatar, BackHeader, Card, EmptyState, ScreenContainer, Text } from "@/components";
import { Especialidad, Medico, Paciente } from "@/domain";
import { getMedico, getPacienteActual, listEspecialidades, quitarMedicoFavorito } from "@/services";
import { useTheme } from "@/theme";
import { iniciales, nombreConTitulo } from "@/utils/format";

/** Profesionales que el paciente marcó como favoritos. */
export default function MedicosFavoritosScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [medicos, setMedicos] = useState<Medico[] | null>(null);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

  const cargar = useCallback(async () => {
    const p = await getPacienteActual();
    const [lista, esp] = await Promise.all([Promise.all(p.medicosFavoritosIds.map(getMedico)), listEspecialidades()]);
    setPaciente(p);
    setMedicos(lista.filter((m): m is Medico => m !== undefined));
    setEspecialidades(esp);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const quitar = async (medicoId: string) => {
    if (!paciente) return;
    await quitarMedicoFavorito(paciente.id, medicoId);
    cargar();
  };

  return (
    <ScreenContainer>
      <BackHeader titulo="Médicos favoritos" />
      {medicos?.length === 0 && (
        <EmptyState icon={Heart} titulo="Sin favoritos todavía" descripcion="Los profesionales que marques como favoritos van a aparecer acá." />
      )}
      {medicos?.map((m) => (
        <Card key={m.id} style={styles.card}>
          <View style={styles.row}>
            {/* El perfil y el corazón son botones hermanos: en web un <button> no puede ir dentro de otro. */}
            <Pressable
              onPress={() => router.push(`/medico/${m.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${nombreConTitulo(m)}`}
              style={({ pressed }) => [styles.row, styles.perfil, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Avatar uri={m.avatarUrl} iniciales={iniciales(m.nombre, m.apellido)} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.nombre, { color: theme.colors.foreground }]}>{nombreConTitulo(m)}</Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  {especialidades.find((e) => e.id === m.especialidadId)?.nombre}
                </Text>
                <View style={styles.rating}>
                  <Star size={12} color="#EAB308" fill="#EAB308" />
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 0 }]}>
                    {m.valoracion.toFixed(1)} ({m.cantidadValoraciones})
                  </Text>
                </View>
              </View>
            </Pressable>
            <Pressable
              onPress={() => quitar(m.id)}
              accessibilityRole="button"
              accessibilityLabel={`Quitar a ${nombreConTitulo(m)} de favoritos`}
              hitSlop={8}
              style={styles.heart}
            >
              <Heart size={22} color={theme.colors.danger} fill={theme.colors.danger} />
            </Pressable>
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  perfil: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  heart: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
