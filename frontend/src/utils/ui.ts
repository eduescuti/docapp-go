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

// ---------- Teclado ----------

/**
 * Corre `accion` (navegar) sin un campo enfocado ni teclado abierto. El campo pierde el foco siempre: si no,
 * la pantalla de abajo queda montada con el campo enfocado y su cursor se sigue viendo en la siguiente. Si
 * hay teclado, espera a que se cierre: cerrarlo y animar la pantalla a la vez hace que Android redimensione
 * la pantalla en medio de la animación y se entrecorte.
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
  // Por si el evento no llega (teclado físico, simulador): no se queda esperando.
  setTimeout(seguir, 400);
  Keyboard.dismiss();
}

// ---------- Aviso al volver a una pantalla ----------

/**
 * Aviso de una sola vez para la pantalla a la que se vuelve (p. ej. "Asignaste la receta" en la ficha del
 * paciente después de completar el formulario). Se deja antes de `router.back()` y la pantalla de destino lo
 * toma al volver a la vista: así no hace falta navegar con parámetros, que en las pestañas del profesional
 * desordenaba el historial de "volver".
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
 * Para actualizar un estado con datos recargados sin volver a dibujar la pantalla si no cambió nada:
 * `setX((anterior) => conservarSiIgual(anterior, nuevo))`. Si el contenido es igual, devuelve el mismo
 * objeto y React se saltea el render. Las pantallas recargan sus datos cada vez que vuelven a la vista
 * (por ejemplo, al volver de un detalle) y ese render de más, justo cuando empieza la animación de
 * "volver", la entrecortaba.
 */
export function conservarSiIgual<T>(anterior: T, nuevo: T): T {
  return JSON.stringify(anterior) === JSON.stringify(nuevo) ? anterior : nuevo;
}

// ---------- Feedback al tocar ----------

/**
 * Feedback de "presionado" de lo que se toca: se achica apenas, en vez de bajar la opacidad.
 *
 * No se usa opacidad porque en Android una vista con opacidad menor a 1 se dibuja en una capa aparte y las
 * sombras (elevación) de las tarjetas y botones se ven como un borde gris mientras se toca. Una escala no
 * obliga a dibujar esa capa.
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
