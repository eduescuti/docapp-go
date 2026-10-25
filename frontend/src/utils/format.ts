import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import type { Medico } from "@/domain";

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

/** "2026-10-03T14:30" -> "03/10/2026 14:30" */
export function formatFechaHora(fechaHoraIso: string): string {
  return format(parseISO(fechaHoraIso), "dd/MM/yyyy HH:mm");
}

/** Fecha local de hoy en ISO "yyyy-MM-dd" (sin el corrimiento de zona horaria de toISOString). */
export function hoyIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** "Dr." o "Dra." según el género del profesional. */
export function tituloMedico(medico: Pick<Medico, "genero">): string {
  return medico.genero === "femenino" ? "Dra." : "Dr.";
}

/** "Dra. Elena Ruiz" */
export function nombreConTitulo(medico: Pick<Medico, "genero" | "nombre" | "apellido">): string {
  return `${tituloMedico(medico)} ${medico.nombre} ${medico.apellido}`;
}

/** "a 850 m" / "a 1,2 km" */
export function formatDistancia(km: number): string {
  if (km < 1) return `a ${Math.round((km * 1000) / 10) * 10} m`;
  return `a ${km.toFixed(1).replace(".", ",")} km`;
}
