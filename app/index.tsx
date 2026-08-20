import { Redirect } from "expo-router";

import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { isAuthenticated, rol } = useAuth();

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (rol === "doctor") return <Redirect href="/(doctor)" />;
  if (rol === "admin") return <Redirect href="/(admin)" />;
  return <Redirect href="/(paciente)" />;
}
