import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export interface CarpetaMes<T> {
  /** "2026-10" */
  clave: string;
  /** "Octubre" */
  nombre: string;
  items: T[];
}

export interface CarpetaAnio<T> {
  anio: string;
  meses: CarpetaMes<T>[];
  cantidad: number;
}

/** De cada ítem archivado: su fecha propia (ordena adentro de la carpeta) y cuándo se archivó (define la carpeta). */
type DatosArchivo<T> = (item: T) => { fecha: string; archivadoEl: string };

/**
 * Agrupa lo archivado (estudios, órdenes, recetas) en carpetas por año y, adentro, por mes en que se
 * archivó. Solo existen las carpetas que tienen algo (las más nuevas primero).
 */
export function agruparEnCarpetas<T>(archivados: T[], datos: DatosArchivo<T>): CarpetaAnio<T>[] {
  const porMes = new Map<string, T[]>();
  for (const item of archivados) {
    const clave = datos(item).archivadoEl.slice(0, 7);
    porMes.set(clave, [...(porMes.get(clave) ?? []), item]);
  }
  const anios = new Map<string, CarpetaMes<T>[]>();
  for (const [clave, lista] of [...porMes].sort((a, b) => b[0].localeCompare(a[0]))) {
    const nombre = format(parseISO(`${clave}-01`), "LLLL", { locale: es });
    const mes: CarpetaMes<T> = {
      clave,
      nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      items: [...lista].sort((x, y) => datos(y).fecha.localeCompare(datos(x).fecha)),
    };
    const anio = clave.slice(0, 4);
    anios.set(anio, [...(anios.get(anio) ?? []), mes]);
  }
  return [...anios].map(([anio, meses]) => ({ anio, meses, cantidad: meses.reduce((n, m) => n + m.items.length, 0) }));
}
