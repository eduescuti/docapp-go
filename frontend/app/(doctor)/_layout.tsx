import { Redirect, Tabs } from "expo-router";
import { CalendarDays, House, UserRound, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";
import { rutaInicio } from "@/utils/navigation";

export default function DoctorLayout() {
  const { theme } = useTheme();
  const { rol } = useAuth();
  const insets = useSafeAreaInsets();

  // Control de permisos por rol (CLAUDE.md §11): cada grupo solo es accesible para su rol.
  if (rol !== "doctor") return <Redirect href={rutaInicio(rol)} />;

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
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarAccessibilityLabel: "Inicio",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarAccessibilityLabel: "Agenda: calendario de turnos",
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
      <Tabs.Screen name="nueva-orden/[pacienteId]" options={{ href: null }} />
      <Tabs.Screen name="nueva-receta/[pacienteId]" options={{ href: null }} />
    </Tabs>
  );
}