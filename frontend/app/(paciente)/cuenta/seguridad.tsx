import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ChevronRight, EyeOff, Fingerprint, KeyRound, ShieldCheck, Smartphone } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { BackHeader, Card, IconBadge, LogoutButton, ScreenContainer, SectionHeader, Text } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";
import { formatFechaHora } from "@/utils/format";

/** Seguridad: sesión activa, acceso a cambiar la contraseña y cómo se protegen los datos. */
export default function SeguridadScreen() {
  const { theme } = useTheme();
  const { sesion } = useAuth();
  const router = useRouter();

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
      <Proximamente icon={ShieldCheck} titulo="Verificación en dos pasos" />
      <Proximamente icon={Fingerprint} titulo="Ingreso con huella o rostro" />

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

function Proximamente({ icon, titulo }: { icon: LucideIcon; titulo: string }) {
  const { theme } = useTheme();
  return (
    <Card style={[styles.bloque, { opacity: 0.6 }]} accessible accessibilityLabel={`${titulo}, próximamente`}>
      <View style={styles.row}>
        <IconBadge icon={icon} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.titulo, { color: theme.colors.foreground }]}>{titulo}</Text>
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>Próximamente</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bloque: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  titulo: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  texto: { flex: 1, fontSize: 13, lineHeight: 19 },
});
