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
import { StyleSheet, View } from "react-native";

import { Avatar, Card, ScreenContainer, SectionHeader, Text } from "@/components";
import { Paciente, PlanMedico } from "@/domain";
import { getPacienteActual, getPlanMedico, listNotificacionesPaciente } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";
import { iniciales } from "@/utils/format";

type RutaCuenta =
  | "/cuenta/perfil"
  | "/cuenta/plan"
  | "/cuenta/recetas"
  | "/cuenta/ordenes"
  | "/cuenta/medicos-favoritos"
  | "/cuenta/instituciones-favoritas"
  | "/cuenta/notificaciones"
  | "/cuenta/historial"
  | "/cuenta/feedback"
  | "/cuenta/seguridad"
  | "/cuenta/configuracion"
  | "/cuenta/ayuda";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  ruta: RutaCuenta;
}

interface Seccion {
  titulo: string;
  items: MenuItem[];
}

/** Agrupado por tema para dar jerarquía (CLAUDE.md §8: el menú no puede sentirse genérico). */
const SECCIONES: Seccion[] = [
  {
    titulo: "Mi salud",
    items: [
      { icon: CreditCard, label: "Mi plan médico", ruta: "/cuenta/plan" },
      { icon: Stethoscope, label: "Mis recetas", ruta: "/cuenta/recetas" },
      { icon: FileText, label: "Órdenes médicas", ruta: "/cuenta/ordenes" },
      { icon: History, label: "Historial", ruta: "/cuenta/historial" },
    ],
  },
  {
    titulo: "Favoritos y avisos",
    items: [
      { icon: Heart, label: "Médicos favoritos", ruta: "/cuenta/medicos-favoritos" },
      { icon: MapPin, label: "Instituciones favoritas", ruta: "/cuenta/instituciones-favoritas" },
      { icon: Bell, label: "Notificaciones", ruta: "/cuenta/notificaciones" },
      { icon: Star, label: "Feedback", ruta: "/cuenta/feedback" },
    ],
  },
  {
    titulo: "Cuenta",
    items: [
      { icon: User, label: "Mi perfil", ruta: "/cuenta/perfil" },
      { icon: Shield, label: "Seguridad", ruta: "/cuenta/seguridad" },
      { icon: Settings, label: "Configuración", ruta: "/cuenta/configuracion" },
      { icon: HelpCircle, label: "Ayuda", ruta: "/cuenta/ayuda" },
    ],
  },
];

export default function MenuScreen() {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [plan, setPlan] = useState<PlanMedico | null>(null);
  const [noLeidas, setNoLeidas] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getPacienteActual().then(async (p) => {
        setPaciente(p);
        const [pl, notifs] = await Promise.all([getPlanMedico(p.planMedicoId), listNotificacionesPaciente(p.id)]);
        setPlan(pl ?? null);
        setNoLeidas(notifs.filter((n) => !n.leida).length);
      });
    }, []),
  );

  const handleCerrarSesion = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <ScreenContainer>
      <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>Menú</Text>

      <Card style={styles.profileCard} onPress={() => router.push("/cuenta/perfil")} accessibilityLabel="Ver mi perfil">
        <View style={styles.profileRow}>
          <Avatar iniciales={paciente ? iniciales(paciente.nombre, paciente.apellido) : "--"} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileNombre, { color: theme.colors.foreground }]}>
              {paciente ? `${paciente.nombre} ${paciente.apellido}` : "Cargando..."}
            </Text>
            <Text style={[styles.profileSub, { color: theme.colors.mutedForeground }]}>
              {plan?.nombre} · DNI {paciente?.dni}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.mutedForeground} />
        </View>
      </Card>

      {SECCIONES.map((seccion) => (
        <View key={seccion.titulo} style={styles.seccion}>
          <SectionHeader title={seccion.titulo} />
          <View style={styles.grid}>
            {seccion.items.map((item) => {
              const badge = item.ruta === "/cuenta/notificaciones" ? noLeidas : 0;
              return (
                <View key={item.label} style={styles.gridCell}>
                  <Card
                    padded={false}
                    style={styles.gridItem}
                    onPress={() => router.push(item.ruta)}
                    accessibilityLabel={badge > 0 ? `${item.label}, ${badge} sin leer` : item.label}
                  >
                    <View style={[styles.gridIcon, { backgroundColor: theme.colors.accent }]}>
                      <item.icon size={20} color={theme.colors.accentForeground} />
                    </View>
                    <Text style={[styles.gridLabel, { color: theme.colors.foreground }]} numberOfLines={2}>
                      {item.label}
                    </Text>
                    {badge > 0 && (
                      <View style={[styles.badge, { backgroundColor: theme.colors.danger }]}>
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    )}
                  </Card>
                </View>
              );
            })}
          </View>
        </View>
      ))}

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
  profileCard: { marginBottom: 24 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  profileNombre: { fontSize: 16, fontWeight: "700" },
  profileSub: { fontSize: 13, marginTop: 2 },
  seccion: { marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  gridCell: { width: "48%" },
  // Alto fijo: todas las tarjetas miden lo mismo aunque el texto ocupe una o dos líneas.
  gridItem: {
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 10,
  },
  gridIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  gridLabel: { fontSize: 13, lineHeight: 17, fontWeight: "600", textAlign: "center" },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  logoutCard: { marginTop: 4, marginBottom: 24 },
  logoutRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoutLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutLabel: { fontSize: 14, fontWeight: "600" },
});
