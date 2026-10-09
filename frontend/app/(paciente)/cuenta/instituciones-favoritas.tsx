import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Building2, FlaskConical, Heart, Hospital, Phone, Stethoscope } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { BackHeader, Card, EmptyState, IconBadge, PrimaryButton, ScreenContainer, Text } from "@/components";
import { Institucion, Paciente, TipoInstitucion } from "@/domain";
import { getInstitucion, getPacienteActual, quitarInstitucionFavorita } from "@/services";
import { useTheme } from "@/theme";

const TIPOS: Record<TipoInstitucion, { label: string; icon: LucideIcon }> = {
  hospital: { label: "Hospital", icon: Hospital },
  clinica: { label: "Clínica", icon: Building2 },
  centro_medico: { label: "Centro médico", icon: Stethoscope },
  laboratorio: { label: "Laboratorio", icon: FlaskConical },
};

/** Instituciones que el paciente marcó como favoritas, con acceso directo a cómo llegar. */
export default function InstitucionesFavoritasScreen() {
  const { theme } = useTheme();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [instituciones, setInstituciones] = useState<Institucion[] | null>(null);

  const cargar = useCallback(async () => {
    const p = await getPacienteActual();
    const lista = await Promise.all(p.institucionesFavoritasIds.map(getInstitucion));
    setPaciente(p);
    setInstituciones(lista.filter((i): i is Institucion => i !== undefined));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const quitar = async (institucionId: string) => {
    if (!paciente) return;
    await quitarInstitucionFavorita(paciente.id, institucionId);
    cargar();
  };

  return (
    <ScreenContainer>
      <BackHeader titulo="Instituciones favoritas" />
      {instituciones?.length === 0 && (
        <EmptyState icon={Heart} titulo="Sin favoritas todavía" descripcion="Las instituciones que marques como favoritas van a aparecer acá." />
      )}
      {instituciones?.map((inst) => {
        const tipo = TIPOS[inst.tipo];
        const sede = inst.sedes[0];
        const telefono = sede?.telefono;
        return (
          <Card key={inst.id} style={styles.card}>
            <View style={styles.row}>
              <IconBadge icon={tipo.icon} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.nombre, { color: theme.colors.foreground }]}>{inst.nombre}</Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  {tipo.label}
                  {sede ? ` · ${sede.direccion}, ${sede.ciudad}` : ""}
                </Text>
              </View>
              <Pressable
                onPress={() => quitar(inst.id)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${inst.nombre} de favoritas`}
                hitSlop={8}
                style={styles.heart}
              >
                <Heart size={22} color={theme.colors.danger} fill={theme.colors.danger} />
              </Pressable>
            </View>
            {sede && (
              <View style={styles.acciones}>
                {/* El REFES no trae teléfono: "Llamar" aparece solo si la sede lo tiene cargado. */}
                {telefono ? (
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      label="Llamar"
                      variant="outline"
                      onPress={() => Linking.openURL(`tel:${telefono.replace(/\s/g, "")}`)}
                      accessibilityLabel={`Llamar a ${inst.nombre}`}
                    />
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Cómo llegar"
                    onPress={() =>
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${sede.latitud},${sede.longitud}`)
                    }
                    accessibilityLabel={`Cómo llegar a ${inst.nombre}`}
                  />
                </View>
              </View>
            )}
            {telefono ? (
              <View style={styles.telRow}>
                <Phone size={12} color={theme.colors.mutedForeground} />
                <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 0 }]}>{telefono}</Text>
              </View>
            ) : null}
          </Card>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  nombre: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  heart: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  acciones: { flexDirection: "row", gap: 10, marginTop: 14 },
  telRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "center" },
});
