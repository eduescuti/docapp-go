import { Redirect, Stack } from "expo-router";

import { BarraInferiorContext } from "@/components/BarraInferiorContext";
import { CapaProfundidad } from "@/components/CapaProfundidad";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme";
import { OPCIONES_STACK, PRESENTACION_BASE, rutaInicio } from "@/utils/navigation";

// Aunque se entre directo a una pantalla de detalle (p. ej. un link), las pestañas quedan debajo.
export const unstable_settings = { initialRouteName: "(tabs)" };

/**
 * Modo paciente. Las cinco pestañas (Inicio, Turnos, Estudios, Recetas, Menú) viven en `(tabs)` y se
 * recorren deslizando; el resto de las pantallas (perfil, mapa, reservar, detalle de profesional,
 * páginas del Menú) se abren encima, con su propio botón de volver.
 */
export default function PacienteLayout() {
  const { theme } = useTheme();
  const { rol } = useAuth();

  // Control de permisos por rol (CLAUDE.md §11): cada grupo solo es accesible para su rol.
  if (rol !== "paciente") return <Redirect href={rutaInicio(rol)} />;

  return (
    // Las pantallas de este Stack no tienen la barra de pestañas abajo (las pestañas la vuelven a poner).
    <BarraInferiorContext.Provider value={false}>
      <Stack
        screenOptions={{ ...OPCIONES_STACK, contentStyle: { backgroundColor: theme.colors.background } }}
        screenLayout={({ children }) => <CapaProfundidad>{children}</CapaProfundidad>}
      >
        <Stack.Screen name="(tabs)" options={PRESENTACION_BASE} />
      </Stack>
    </BarraInferiorContext.Provider>
  );
}
