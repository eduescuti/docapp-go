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
