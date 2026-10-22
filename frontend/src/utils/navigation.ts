import { Platform } from "react-native";
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

/**
 * Transición de las pantallas que se abren encima de otras (detalle, registro, páginas del Menú).
 * En Android la pantalla nueva sube un poco mientras aparece con un fundido, y "volver" la baja y la
 * desvanece; mientras tanto, la de abajo retrocede en profundidad (ver `CapaProfundidad`). No hay sombra
 * ni oscurecimiento. En iOS se puede volver también deslizando desde el borde izquierdo.
 *
 * En Android, `transparentModal` hace que el stack deje **montada** la pantalla de abajo. Con la
 * presentación normal la saca de pantalla y, al volver, tiene que volver a agregarla y medirla entera
 * antes de dibujarla: ese era el blanco que se veía antes de la animación. Las pantallas siguen siendo
 * opacas (tienen fondo propio), así que se ven igual. La primera pantalla de cada stack tiene que declarar
 * `presentation: "card"` (ver `PRESENTACION_BASE`).
 */
export const OPCIONES_STACK = {
  headerShown: false,
  // En iOS ya es el push nativo, con su paralaje y el gesto de volver.
  animation: Platform.OS === "android" ? "fade_from_bottom" : "default",
  presentation: Platform.OS === "android" ? "transparentModal" : "card",
  gestureEnabled: true,
  // El gesto de volver solo desde el borde: desde cualquier lado chocaría con el mapa y los scrolls horizontales.
  fullScreenGestureEnabled: false,
} as const;

/** Para la primera pantalla de un stack: no se superpone a nada, así que va como pantalla común. */
export const PRESENTACION_BASE = { presentation: "card", animation: "none" } as const;
