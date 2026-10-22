import { Stack } from "expo-router";

import { CapaProfundidad } from "@/components/CapaProfundidad";
import { useTheme } from "@/theme";
import { OPCIONES_STACK, PRESENTACION_BASE } from "@/utils/navigation";

export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{ ...OPCIONES_STACK, contentStyle: { backgroundColor: theme.colors.background } }}
      screenLayout={({ children }) => <CapaProfundidad>{children}</CapaProfundidad>}
    >
      <Stack.Screen name="login" options={PRESENTACION_BASE} />
      <Stack.Screen name="registro" />
      <Stack.Screen name="registro-paciente" />
      <Stack.Screen name="registro-medico" />
    </Stack>
  );
}
