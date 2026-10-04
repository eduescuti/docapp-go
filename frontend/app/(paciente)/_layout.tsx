import { Redirect, Tabs } from "expo-router";
import { Calendar, FileText, Home, Menu as MenuIcon, Search } from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";

/** Rutas del grupo que no aparecen como pestaña (se abren desde otras pantallas). */
const RUTAS_OCULTAS = [
  "medico/[id]",
  "reservar/[medicoId]",
  "mapa",
  "cuenta/perfil",
  "cuenta/plan",
  "cuenta/recetas",
  "cuenta/ordenes",
  "cuenta/medicos-favoritos",
  "cuenta/instituciones-favoritas",
  "cuenta/notificaciones",
  "cuenta/historial",
  "cuenta/feedback",
  "cuenta/calificar/[turnoId]",
  "cuenta/seguridad",
  "cuenta/configuracion",
  "cuenta/ayuda",
];

export default function PacienteLayout() {
  const { theme } = useTheme();
  const { rol } = useAuth();

  // Control de permisos por rol (CLAUDE.md §11): cada grupo solo es accesible para su rol.
  if (rol !== "paciente") return <Redirect href="/" />;

  return (
    <Tabs
      // "history": volver regresa a la pantalla anterior (p. ej. al Menú), no siempre a Inicio.
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
      {RUTAS_OCULTAS.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
