import { Tabs } from "expo-router";
import { Calendar, FileText, Home, Menu as MenuIcon, Search } from "lucide-react-native";

import { useTheme } from "@/theme";

export default function PacienteLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
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
          title: "Inicio",
          tabBarAccessibilityLabel: "Inicio",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="turnos"
        options={{
          title: "Turnos",
          tabBarAccessibilityLabel: "Mis turnos",
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="estudios"
        options={{
          title: "Estudios",
          tabBarAccessibilityLabel: "Mis estudios",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          title: "Buscar",
          tabBarAccessibilityLabel: "Buscar médicos",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menú",
          tabBarAccessibilityLabel: "Menú",
          tabBarIcon: ({ color, size }) => <MenuIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="medico/[id]" options={{ href: null }} />
      <Tabs.Screen name="reservar/[medicoId]" options={{ href: null }} />
      <Tabs.Screen name="mapa" options={{ href: null }} />
    </Tabs>
  );
}
