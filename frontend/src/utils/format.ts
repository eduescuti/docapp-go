import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/** "2026-08-24" -> "Lun 24 Ago" */
export function formatFechaCorta(fechaIso: string): string {
  const capitalizada = format(parseISO(fechaIso), "EEE dd MMM", { locale: es });
  return capitalizada.replace(/^\w/, (c) => c.toUpperCase());
}

/** "2026-08-24" -> "24 de agosto de 2026" */
export function formatFechaLarga(fechaIso: string): string {
  return format(parseISO(fechaIso), "dd 'de' MMMM 'de' yyyy", { locale: es });
}

export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}
