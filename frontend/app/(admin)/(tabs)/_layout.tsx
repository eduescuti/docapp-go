import { Building2, ChartColumn, CreditCard, LayoutDashboard } from "lucide-react-native";

import { BarraPestanas } from "@/components";
import { BarraInferiorContext } from "@/components/BarraInferiorContext";
import { PestanasDeslizables } from "@/navigation/PestanasDeslizables";
import { useTheme } from "@/theme";

const TAMANIO_ICONO = 24;

/** Las cuatro pestañas del admin: se pasa de una a otra tocando la barra o deslizando. Ver `(paciente)/(tabs)/_layout.tsx`. */
export default function PestanasAdminLayout() {
  const { theme } = useTheme();

  return (
    <BarraInferiorContext.Provider value>
      <PestanasDeslizables
        tabBar={(props) => <BarraPestanas {...props} />}
        // "history": volver regresa a la pestaña anterior, no siempre a la primera.
        backBehavior="history"
        screenOptions={{ sceneStyle: { backgroundColor: theme.colors.background } }}
      >
        <PestanasDeslizables.Screen
          name="index"
          options={{
            title: "Panel",
            tabBarAccessibilityLabel: "Panel de administración",
            tabBarIcon: ({ color }: { color: string }) => <LayoutDashboard color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="metricas"
          options={{
            title: "Métricas",
            tabBarAccessibilityLabel: "Métricas de uso y valoraciones",
            tabBarIcon: ({ color }: { color: string }) => <ChartColumn color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="obras-sociales"
          options={{
            title: "Obras sociales",
            tabBarAccessibilityLabel: "Obras sociales y planes",
            tabBarIcon: ({ color }: { color: string }) => <CreditCard color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="instituciones"
          options={{
            title: "Instituciones",
            tabBarAccessibilityLabel: "Hospitales e instituciones",
            tabBarIcon: ({ color }: { color: string }) => <Building2 color={color} size={TAMANIO_ICONO} />,
          }}
        />
      </PestanasDeslizables>
    </BarraInferiorContext.Provider>
  );
}
