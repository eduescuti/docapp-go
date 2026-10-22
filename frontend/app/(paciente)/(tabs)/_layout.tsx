import { Calendar, FileText, Home, Menu as MenuIcon, Pill } from "lucide-react-native";

import { BarraPestanas } from "@/components";
import { BarraInferiorContext } from "@/components/BarraInferiorContext";
import { PestanasDeslizables } from "@/navigation/PestanasDeslizables";
import { useTheme } from "@/theme";

const TAMANIO_ICONO = 24;

/**
 * Las cinco pestañas del paciente: se pasa de una a otra tocando la barra de abajo o deslizando a
 * izquierda y derecha, con la pantalla siguiendo al dedo. El deslizar solo se activa con gestos
 * claramente horizontales (ver `PestanasDeslizables`), así el scroll vertical no cambia de pestaña.
 */
export default function PestanasPacienteLayout() {
  const { theme } = useTheme();

  return (
    <BarraInferiorContext.Provider value>
      <PestanasDeslizables
        tabBar={(props) => <BarraPestanas {...props} />}
        // "history": volver regresa a la pestaña anterior, no siempre a Inicio.
        backBehavior="history"
        screenOptions={{ sceneStyle: { backgroundColor: theme.colors.background } }}
      >
        <PestanasDeslizables.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarAccessibilityLabel: "Inicio",
            tabBarIcon: ({ color }: { color: string }) => <Home color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="turnos"
          options={{
            title: "Turnos",
            tabBarAccessibilityLabel: "Mis turnos",
            tabBarIcon: ({ color }: { color: string }) => <Calendar color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="estudios"
          options={{
            title: "Estudios",
            tabBarAccessibilityLabel: "Mis estudios",
            tabBarIcon: ({ color }: { color: string }) => <FileText color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="recetas"
          options={{
            title: "Recetas",
            tabBarAccessibilityLabel: "Mis recetas",
            tabBarIcon: ({ color }: { color: string }) => <Pill color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="menu"
          options={{
            title: "Menú",
            tabBarAccessibilityLabel: "Menú",
            tabBarIcon: ({ color }: { color: string }) => <MenuIcon color={color} size={TAMANIO_ICONO} />,
          }}
        />
      </PestanasDeslizables>
    </BarraInferiorContext.Provider>
  );
}
