import { useCallback, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Fingerprint, HeartPulse } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";

import { Card, PasswordField, PrimaryButton, ScreenContainer, Text, TextField } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";
import {
  estaBiometriaHabilitada,
  guardarSesionBiometrica,
  habilitarBiometriaAutomatica,
  obtenerDatosSesionBiometrica,
} from "@/services/biometria";

// La huella se pide sola una vez por apertura de la app; después queda el ícono para reintentar.
let huellaAutomaticaIntentada = false;

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login, loginBiometrico } = useAuth();
  const router = useRouter();

  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [biometriaHabilitada, setBiometriaHabilitada] = useState(false);
  const [dniGuardado, setDniGuardado] = useState<string | null>(null);

  // La huella solo se considera activa si está habilitada en el teléfono Y el DNI en pantalla coincide con la cuenta configurada
  const coincideDni = dni.trim().length > 0 && dni.trim() === dniGuardado;
  const huellaValidaParaEsteUsuario = biometriaHabilitada && coincideDni;

  // Revisa si el usuario activó la huella en Seguridad cada vez que la pantalla vuelve al foco
  useFocusEffect(
    useCallback(() => {
      chequearBiometria();
    }, [])
  );

  const chequearBiometria = async () => {
    try {
      const habilitada = await estaBiometriaHabilitada();
      const sesion = await obtenerDatosSesionBiometrica();
      if (habilitada && sesion.dni) {
        setBiometriaHabilitada(true);
        setDniGuardado(sesion.dni);
        setDni(sesion.dni);
        if (!huellaAutomaticaIntentada) {
          huellaAutomaticaIntentada = true;
          ingresarConHuella(sesion.dni, true);
        }
      } else {
        setBiometriaHabilitada(false);
        setDniGuardado(null);
      }
    } catch {
      setBiometriaHabilitada(false);
    }
  };

  const puedeEnviar = dni.trim().length > 0 && password.length > 0;

  const handleIngresar = async () => {
    if (!puedeEnviar) return;
    setError(null);
    setCargando(true);
    try {
      const sesion = await login(dni, password);
      // Si cierra sesión después, no se le vuelve a pedir la huella sola en esta apertura de la app.
      huellaAutomaticaIntentada = true;
      // Registra el DNI como el último usuario logueado en este dispositivo
      await guardarSesionBiometrica(dni.trim());
      // Si el teléfono tiene huella registrada, el ingreso con huella queda activo sin pedírselo al usuario.
      try {
        if ((await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync())) {
          await habilitarBiometriaAutomatica(sesion.rol === "paciente");
        }
      } catch {
        // Sin sensor disponible: se sigue con contraseña.
      }
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  /**
   * Ingreso con huella. `automatico`: lo dispara la app al abrirse con el DNI guardado, así que no
   * muestra avisos si algo no está disponible (el usuario sigue con su contraseña).
   */
  const ingresarConHuella = async (dniAUsar: string, automatico = false) => {
    setError(null);
    const dniIngresado = dniAUsar.trim();

    if (!automatico) {
      // 1. Validar que el DNI no esté vacío
      if (!dniIngresado) {
        setError("Ingresá tu DNI para verificar si tenés habilitado el acceso biométrico.");
        return;
      }

      // 2. Si el DNI en pantalla fue modificado o no tiene huella asociada
      if (dniIngresado !== dniGuardado || !biometriaHabilitada) {
        Alert.alert(
          "Huella no configurada para este DNI",
          `El usuario con DNI ${dniIngresado} no tiene configurado el ingreso biométrico en este dispositivo. Iniciá sesión con tu contraseña: la huella se activa sola.`
        );
        return;
      }
    }

    // 3. Chequeo de hardware en el teléfono
    let tieneSensor = false;
    try {
      tieneSensor = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
    } catch {
      tieneSensor = false;
    }
    if (!tieneSensor) {
      if (!automatico) {
        Alert.alert(
          "Sensor no disponible",
          "Tu dispositivo no tiene sensor biométrico activo o no tenés huellas configuradas en Android."
        );
      }
      return;
    }

    // 4. Lectura física de la huella
    let resultado;
    try {
      resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: "Accedé a DocApp Go con tu huella",
        cancelLabel: "Cancelar",
        fallbackLabel: "Usar contraseña",
        disableDeviceFallback: false,
      });
    } catch {
      setError("Error al comunicarse con el sensor biométrico.");
      return;
    }

    if (!resultado.success) {
      if (resultado.error !== "user_cancel" && resultado.error !== "system_cancel") {
        setError("No se reconoció la huella digital.");
      }
      return;
    }

    // 5. Ingreso directo: el sensor ya certificó la identidad para el DNI ingresado
    try {
      setCargando(true);
      await loginBiometrico(dniIngresado);
      router.replace("/");
    } catch (errLogin) {
      setError(errLogin instanceof Error ? errLogin.message : "Error al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  const handleAutenticacionBiometrica = () => ingresarConHuella(dni);

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

          <View style={styles.botonesFila}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Iniciar sesión"
                onPress={handleIngresar}
                disabled={!puedeEnviar}
                loading={cargando}
                accessibilityLabel="Iniciar sesión"
              />
            </View>

            {/* Ícono de huella digital integrado junto al botón */}
            <TouchableOpacity
              onPress={handleAutenticacionBiometrica}
              style={[
                styles.biometriaIconBoton,
                {
                  borderColor: huellaValidaParaEsteUsuario ? theme.colors.primary : theme.colors.border,
                  backgroundColor: huellaValidaParaEsteUsuario ? `${theme.colors.primary}18` : theme.colors.card,
                  opacity: huellaValidaParaEsteUsuario ? 1 : 0.6,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión con huella"
            >
              <Fingerprint
                size={26}
                color={huellaValidaParaEsteUsuario ? theme.colors.primary : theme.colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
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
  botonesFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  biometriaIconBoton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  registroLink: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 20 },
});