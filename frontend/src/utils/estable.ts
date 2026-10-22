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
