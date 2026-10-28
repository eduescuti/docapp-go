import { CalendarDays, House, UserRound, Users } from "lucide-react-native";

import { BarraPestanas } from "@/components";
import { BarraInferiorContext } from "@/components/BarraInferiorContext";
import { PestanasDeslizables } from "@/navigation/PestanasDeslizables";
import { useTheme } from "@/theme";

const TAMANIO_ICONO = 24;

/** Las cuatro pestañas del profesional: se pasa de una a otra tocando la barra o deslizando. Ver `(paciente)/(tabs)/_layout.tsx`. */
export default function PestanasDoctorLayout() {
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
            title: "Inicio",
            tabBarAccessibilityLabel: "Inicio",
            tabBarIcon: ({ color }: { color: string }) => <House color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="agenda"
          options={{
            title: "Agenda",
            tabBarAccessibilityLabel: "Agenda: calendario de turnos",
            tabBarIcon: ({ color }: { color: string }) => <CalendarDays color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="pacientes"
          options={{
            title: "Pacientes",
            tabBarAccessibilityLabel: "Mis pacientes",
            tabBarIcon: ({ color }: { color: string }) => <Users color={color} size={TAMANIO_ICONO} />,
          }}
        />
        <PestanasDeslizables.Screen
          name="perfil"
          options={{
            title: "Perfil",
            tabBarAccessibilityLabel: "Mi perfil profesional",
            tabBarIcon: ({ color }: { color: string }) => <UserRound color={color} size={TAMANIO_ICONO} />,
          }}
        />
      </PestanasDeslizables>
    </BarraInferiorContext.Provider>
  );
}
