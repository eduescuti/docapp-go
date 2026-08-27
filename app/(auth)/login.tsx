import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { HeartPulse } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Chip, PrimaryButton, Text } from "@/components";
import { useAuth, Rol } from "@/hooks/useAuth";
import { useTheme } from "@/theme";
import { planesMedicosMock } from "@/mocks";

const ROLES: { id: Rol; label: string }[] = [
  { id: "paciente", label: "Paciente" },
  { id: "doctor", label: "Médico" },
  { id: "admin", label: "Administrador" },
];

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [rolSeleccionado, setRolSeleccionado] = useState<Rol>("paciente");
  const [dni, setDni] = useState("34567890");
  const [planId, setPlanId] = useState(planesMedicosMock[0].id);

  const handleIngresar = () => {
    login(rolSeleccionado);
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 48 }]}>
      <View style={styles.hero}>
        <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary, borderRadius: theme.radii.lg }]}>
          <HeartPulse size={36} color={theme.colors.primaryForeground} />
        </View>
        <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>
          DocApp Go
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>
          Gestioná tus turnos, estudios y recetas en una sola app.
        </Text>
      </View>

      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <Chip key={r.id} label={r.label} selected={rolSeleccionado === r.id} onPress={() => setRolSeleccionado(r.id)} />
        ))}
      </View>

      <Card style={styles.card}>
        <Text variant="heading" style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Ingresar a mi cuenta
        </Text>

        <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>DNI o Pasaporte</Text>
        <TextInput
          value={dni}
          onChangeText={setDni}
          keyboardType="number-pad"
          placeholder="Ej. 34567890"
          placeholderTextColor={theme.colors.mutedForeground}
          accessibilityLabel="DNI o Pasaporte"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.muted,
              borderColor: theme.colors.border,
              color: theme.colors.foreground,
              borderRadius: theme.radii.md,
            },
          ]}
        />

        {rolSeleccionado === "paciente" && (
          <>
            <Text style={[styles.label, { color: theme.colors.mutedForeground, marginTop: 16 }]}>
              Plan Médico / Obra Social
            </Text>
            <View style={styles.planList}>
              {planesMedicosMock.map((plan) => (
                <Chip key={plan.id} label={plan.nombre} selected={planId === plan.id} onPress={() => setPlanId(plan.id)} />
              ))}
            </View>
          </>
        )}

        <View style={{ marginTop: 24 }}>
          <PrimaryButton label="Iniciar Sesión" onPress={handleIngresar} accessibilityLabel="Iniciar sesión" />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 32,
  },
  hero: {
    alignItems: "center",
  },
  iconWrapper: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    transform: [{ rotate: "-4deg" }],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  card: {
    marginTop: 24,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 48,
  },
  planList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
