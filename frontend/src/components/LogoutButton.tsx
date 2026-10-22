import { useRouter } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import { PrimaryButton } from "./PrimaryButton";

/** Cierra la sesión y vuelve al login. Compartido por los modos médico y admin. */
export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <PrimaryButton
      label="Cerrar sesión"
      variant="outline"
      onPress={() => {
        logout();
        router.replace("/(auth)/login");
      }}
      accessibilityLabel="Cerrar sesión"
    />
  );
}
