import type { Href } from "expo-router";

import { Rol } from "@/domain";

/**
 * Pantalla de inicio de cada rol. Se redirige a la ruta concreta y no a "/": en web
 * los grupos (paciente), (doctor) y (admin) comparten la URL "/" con `app/index.tsx`,
 * y redirigir a "/" sin sesión genera un bucle infinito.
 */
export function rutaInicio(rol: Rol | null): Href {
  if (rol === "paciente") return "/(paciente)";
  if (rol === "doctor") return "/(doctor)";
  if (rol === "admin") return "/(admin)";
  return "/(auth)/login";
}
