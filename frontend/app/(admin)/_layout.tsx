import { Redirect, Tabs } from "expo-router";
import { Building2, CreditCard, LayoutDashboard } from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";

export default function AdminLayout() {
  const { theme } = useTheme();
  const { rol } = useAuth();

  // Control de permisos por rol (CLAUDE.md §11): cada grupo solo es accesible para su rol.
  if (rol !== "admin") return <Redirect href="/" />;

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
          title: "Panel",
          tabBarAccessibilityLabel: "Panel de administración",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="obras-sociales"
        options={{
          title: "Obras sociales",
          tabBarAccessibilityLabel: "Obras sociales y planes",
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="instituciones"
        options={{
          title: "Instituciones",
          tabBarAccessibilityLabel: "Hospitales e instituciones",
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
