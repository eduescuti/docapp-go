import { Redirect, Tabs } from "expo-router";
import { CalendarDays, UserRound, Users } from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";

export default function DoctorLayout() {
  const { theme } = useTheme();
  const { rol } = useAuth();

  // Control de permisos por rol (CLAUDE.md §11): cada grupo solo es accesible para su rol.
  if (rol !== "doctor") return <Redirect href="/" />;

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Agenda",
          tabBarAccessibilityLabel: "Agenda",
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          title: "Pacientes",
          tabBarAccessibilityLabel: "Mis pacientes",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarAccessibilityLabel: "Mi perfil profesional",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="paciente/[id]" options={{ href: null }} />
    </Tabs>
  );
}
