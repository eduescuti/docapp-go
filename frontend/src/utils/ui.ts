import { Keyboard, Platform } from "react-native";
import type { Href } from "expo-router";

import { Rol } from "@/domain";

// ---------- Navegación ----------

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
 * Transición de las pantallas que se abren encima de otras. En Android suben con un fundido mientras la de abajo
 * retrocede (`CapaProfundidad`), y `transparentModal` la deja montada para que no se vea en blanco al volver.
 */
export const OPCIONES_STACK = {
  headerShown: false,
  animation: Platform.OS === "android" ? "fade_from_bottom" : "default",
  presentation: Platform.OS === "android" ? "transparentModal" : "card",
  gestureEnabled: true,
  fullScreenGestureEnabled: false,
} as const;

/** Para la primera pantalla de un stack: no se superpone a nada, así que va como pantalla común. */
export const PRESENTACION_BASE = { presentation: "card", animation: "none" } as const;

// ---------- Teclado ----------

/**
 * Corre `accion` (navegar) sin campo enfocado ni teclado abierto: si hay teclado, espera a que se cierre, porque
 * cerrarlo mientras anima la pantalla hace que Android la redimensione a mitad de camino y se entrecorte.
 */
export function sinTeclado(accion: () => void) {
  if (!Keyboard.isVisible()) {
    Keyboard.dismiss();
    accion();
    return;
  }
  let listo = false;
  const seguir = () => {
    if (listo) return;
    listo = true;
    suscripcion.remove();
    accion();
  };
  const suscripcion = Keyboard.addListener("keyboardDidHide", seguir);
  setTimeout(seguir, 400);
  Keyboard.dismiss();
}

// ---------- Aviso al volver a una pantalla ----------

/**
 * Aviso de una sola vez para la pantalla a la que se vuelve (p. ej. "Asignaste la receta"): se deja antes de
 * `router.back()` y el destino lo toma al volver a la vista, sin navegar con parámetros.
 */
let pendiente: string | null = null;

export const dejarAviso = (texto: string): void => {
  pendiente = texto;
};

export const tomarAviso = (): string | null => {
  const texto = pendiente;
  pendiente = null;
  return texto;
};

// ---------- Recargar datos sin redibujar ----------

/**
 * Para `setX((anterior) => conservarSiIgual(anterior, nuevo))`: si los datos recargados no cambiaron, devuelve el
 * mismo objeto y React se saltea el render, que entrecortaba la animación de "volver".
 */
export function conservarSiIgual<T>(anterior: T, nuevo: T): T {
  return JSON.stringify(anterior) === JSON.stringify(nuevo) ? anterior : nuevo;
}

// ---------- Feedback al tocar ----------

/**
 * Feedback al tocar: se achica apenas en vez de bajar la opacidad, porque en Android la opacidad dibuja la vista en
 * una capa aparte y la sombra de tarjetas y botones se ve como un borde gris.
 */
export function alPresionar(presionado: boolean, escala = 0.98) {
  return { transform: [{ scale: presionado ? escala : 1 }] };
}

// ---------- Pista del carrusel ----------

/**
 * La pista de deslizamiento del carrusel del Inicio se muestra una sola vez por sesión: se vuelve a
 * mostrar después de cerrar sesión y entrar de nuevo.
 */
let mostrada = false;

export const pistaYaMostrada = (): boolean => mostrada;

export const marcarPistaMostrada = (): void => {
  mostrada = true;
};

export const reiniciarPistaCarrusel = (): void => {
  mostrada = false;
};
