import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ChevronRight, EyeOff, Fingerprint, KeyRound, Smartphone } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";

import { BackHeader, Card, IconBadge, LogoutButton, ScreenContainer, SectionHeader, Text } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";
import { formatFechaHora } from "@/utils/format";
import { estaBiometriaHabilitada } from "@/services/biometria";

const TEXTO_HUELLA = {
  activa: "Activo: al abrir la app ingresás con tu huella",
  sinSensor: "No disponible: registrá una huella en los ajustes del teléfono",
  pendiente: "Se activa solo la próxima vez que ingreses con tu contraseña",
} as const;

/** Seguridad: sesión activa, acceso a cambiar la contraseña y cómo se protegen los datos. */
export default function SeguridadScreen() {
  const { theme } = useTheme();
  const { sesion } = useAuth();
  const router = useRouter();

  // La huella se activa sola al ingresar con contraseña: acá solo se informa el estado.
  const [estadoHuella, setEstadoHuella] = useState<"activa" | "sinSensor" | "pendiente">("pendiente");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [tieneHardware, estaRegistrado, habilitada] = await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
            estaBiometriaHabilitada(),
          ]);
          setEstadoHuella(!tieneHardware || !estaRegistrado ? "sinSensor" : habilitada ? "activa" : "pendiente");
        } catch {
          setEstadoHuella("sinSensor");
        }
      })();
    }, []),
  );

  return (
    <ScreenContainer>
      <BackHeader titulo="Seguridad" />

      <SectionHeader title="Sesión activa" />
      <Card style={styles.bloque}>
        <View style={styles.row}>
          <IconBadge icon={Smartphone} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: theme.colors.foreground }]}>Este dispositivo</Text>
            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
              DNI {sesion?.dni} · desde {sesion ? formatFechaHora(sesion.iniciadaEn) : "—"}
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="Acceso" />
      <Card style={styles.bloque} onPress={() => router.push("/cuenta/perfil")} accessibilityLabel="Cambiar contraseña">
        <View style={styles.row}>
          <IconBadge icon={KeyRound} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: theme.colors.foreground }]}>Cambiar contraseña</Text>
            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>Se hace desde Mi perfil</Text>
          </View>
          <ChevronRight size={18} color={theme.colors.mutedForeground} />
        </View>
      </Card>

      <Card style={styles.bloque} accessible accessibilityLabel={`Ingreso con huella digital. ${TEXTO_HUELLA[estadoHuella]}`}>
        <View style={styles.row}>
          <IconBadge icon={Fingerprint} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: theme.colors.foreground }]}>Ingreso con huella digital</Text>
            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{TEXTO_HUELLA[estadoHuella]}</Text>
          </View>
        </View>
      </Card>

      <View style={{ height: 16 }} />
      <SectionHeader title="Tus datos" />
      <Card style={styles.bloque}>
        <View style={styles.row}>
          <IconBadge icon={EyeOff} size={40} />
          <Text style={[styles.texto, { color: theme.colors.mutedForeground }]}>
            Tu información médica solo la ven vos y los profesionales que te atienden. Cada profesional ve únicamente
            lo relacionado con las consultas que tuvo con vos.
          </Text>
        </View>
      </Card>

      <View style={{ marginTop: 8 }}>
        <LogoutButton />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bloque: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  titulo: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  texto: { flex: 1, fontSize: 13, lineHeight: 19 },
});