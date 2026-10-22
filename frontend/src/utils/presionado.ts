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
