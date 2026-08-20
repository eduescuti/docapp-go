import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, LogOut, User } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  History,
  MapPin,
  Settings,
  Shield,
  Star,
  Stethoscope,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, Card, Chip, ScreenContainer } from "@/components";
import { Paciente, PlanMedico } from "@/domain";
import { getPacienteActual, getPlanMedico } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { ThemeId, themes, useTheme } from "@/theme";
import { iniciales } from "@/utils/format";

interface MenuItem {
  icon: LucideIcon;
  label: string;
}

const ITEMS: MenuItem[] = [
  { icon: User, label: "Mi perfil" },
  { icon: CreditCard, label: "Mi plan médico" },
  { icon: Stethoscope, label: "Mis recetas" },
  { icon: FileText, label: "Órdenes médicas" },
  { icon: Heart, label: "Médicos favoritos" },
  { icon: MapPin, label: "Instituciones favoritas" },
  { icon: Bell, label: "Notificaciones" },
  { icon: History, label: "Historial" },
  { icon: Star, label: "Feedback" },
  { icon: Shield, label: "Seguridad" },
  { icon: Settings, label: "Configuración" },
  { icon: HelpCircle, label: "Ayuda" },
];

export default function MenuScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [plan, setPlan] = useState<PlanMedico | null>(null);

  useFocusEffect(
    useCallback(() => {
      getPacienteActual().then(async (p) => {
        setPaciente(p);
        setPlan((await getPlanMedico(p.planMedicoId)) ?? null);
      });
    }, []),
  );

  const handleCerrarSesion = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fonts.heading }]}>Menú</Text>

      <Card style={styles.profileCard}>
        <Avatar iniciales={paciente ? iniciales(paciente.nombre, paciente.apellido) : "--"} size={56} />
        <View>
          <Text style={[styles.profileNombre, { color: theme.colors.foreground }]}>
            {paciente ? `${paciente.nombre} ${paciente.apellido}` : "Cargando..."}
          </Text>
          <Text style={[styles.profileSub, { color: theme.colors.mutedForeground }]}>
            {plan?.nombre} · {paciente?.numeroAfiliado}
          </Text>
        </View>
      </Card>

      <View style={styles.grid}>
        {ITEMS.map((item) => (
          <Card key={item.label} padded={false} style={styles.gridItem} accessibilityLabel={item.label}>
            <View style={[styles.gridIcon, { backgroundColor: theme.colors.accent }]}>
              <item.icon size={20} color={theme.colors.accentForeground} />
            </View>
            <Text style={[styles.gridLabel, { color: theme.colors.foreground }]}>{item.label}</Text>
          </Card>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: theme.colors.mutedForeground }]}>Tema visual</Text>
      <View style={styles.themeRow}>
        {(Object.keys(themes) as ThemeId[]).map((id) => (
          <Chip key={id} label={themes[id].name} selected={themeId === id} onPress={() => setThemeId(id)} />
        ))}
      </View>

      <Card style={styles.logoutCard} onPress={handleCerrarSesion} accessibilityLabel="Cerrar sesión">
        <View style={styles.logoutRow}>
          <View style={styles.logoutLeft}>
            <LogOut size={18} color={theme.colors.danger} />
            <Text style={[styles.logoutLabel, { color: theme.colors.danger }]}>Cerrar sesión</Text>
          </View>
          <ChevronRight size={16} color={theme.colors.danger} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 28 },
  profileNombre: { fontSize: 16, fontWeight: "700" },
  profileSub: { fontSize: 13, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  gridItem: {
    width: "47%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  gridIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  gridLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 12 },
  themeRow: { flexDirection: "row", gap: 8, marginBottom: 28 },
  logoutCard: { marginBottom: 24 },
  logoutRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoutLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutLabel: { fontSize: 14, fontWeight: "600" },
});
