import { Redirect } from "expo-router";

import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { listo, isAuthenticated, rol } = useAuth();

  // Mientras revisa si quedó una sesión guardada en el teléfono no redirige (sigue el splash).
  if (!listo) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (rol === "doctor") return <Redirect href="/(doctor)" />;
  if (rol === "admin") return <Redirect href="/(admin)" />;
  return <Redirect href="/(paciente)" />;
}
