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
