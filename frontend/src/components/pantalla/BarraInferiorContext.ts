import { createContext } from "react";

/**
 * ¿La pantalla se muestra encima de una barra de pestañas? Si sí, la barra ya cubre el área de abajo
 * del teléfono (safe area); si no, la pantalla tiene que dejarla libre ella. Por defecto sí hay barra.
 *
 * Está en su propio archivo (y no junto a `ScreenContainer`) para que Fast Refresh no tenga que
 * recargar de más cuando cambia un componente.
 */
export const BarraInferiorContext = createContext(true);
