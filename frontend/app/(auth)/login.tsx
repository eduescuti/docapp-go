import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { HeartPulse } from "lucide-react-native";

import { Card, PasswordField, PrimaryButton, ScreenContainer, Text, TextField } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";

/**
 * Inicio de sesión único para los tres roles: el rol lo determina la cuenta
 * (DNI + contraseña), no un selector en pantalla.
 */
export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const puedeEnviar = dni.trim().length > 0 && password.length > 0;

  const handleIngresar = async () => {
    if (!puedeEnviar) return;
    setError(null);
    setCargando(true);
    try {
      await login(dni, password);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenContainer style={styles.container}>
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

        <Card>
          <Text variant="heading" style={[styles.cardTitle, { color: theme.colors.foreground }]}>
            Ingresar a mi cuenta
          </Text>

          <TextField
            label="DNI"
            value={dni}
            onChangeText={(t) => {
              setDni(t);
              setError(null);
            }}
            placeholder="Ej. 12345678"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            returnKeyType="next"
          />
          <PasswordField
            label="Contraseña"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
            placeholder="Tu contraseña"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleIngresar}
          />

          {error ? (
            <View
              style={[styles.errorBox, { backgroundColor: `${theme.colors.danger}1A`, borderRadius: theme.radii.md }]}
              accessibilityLiveRegion="polite"
            >
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label="Iniciar sesión"
            onPress={handleIngresar}
            disabled={!puedeEnviar}
            loading={cargando}
            accessibilityLabel="Iniciar sesión"
          />
        </Card>

        <Pressable
          onPress={() => router.push("/(auth)/registro")}
          accessibilityRole="button"
          accessibilityLabel="Crear una cuenta"
          style={styles.registroLink}
        >
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>
            ¿No tenés cuenta?{" "}
            <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>Crear cuenta</Text>
          </Text>
        </Pressable>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 72, paddingBottom: 48 },
  hero: { alignItems: "center", marginBottom: 32 },
  iconWrapper: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    transform: [{ rotate: "-4deg" }],
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center" },
  cardTitle: { fontSize: 17, fontWeight: "600", textAlign: "center", marginBottom: 20 },
  errorBox: { padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13 },
  registroLink: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 20 },
});
