import { Keyboard } from "react-native";

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
