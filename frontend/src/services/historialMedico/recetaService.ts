import { Especialidad, Medico, Receta } from "@/domain";
import { hoyIso } from "@/utils/format";

import { api } from "../apiClient";
import { agruparEnCarpetas, CarpetaAnio } from "./carpetas";

// Recetas contra el backend (`docs/04-api.md#recetas`). El estado (activa / pasada) se calcula con `vigenteHasta`.

/** Hace un GET de todas las recetas del paciente, archivadas o no (historial médico). */
export async function listRecetasPaciente(): Promise<Receta[]> {
  return api<Receta[]>("/api/pacientes/yo/recetas/todas");
}

/** Una receta es activa hasta su último día de consumo inclusive; después pasa a pasadas. */
export const esRecetaActiva = (receta: Receta): boolean => receta.vigenteHasta >= hoyIso();

/** Una receta con el profesional y su especialidad ya resueltos, como la devuelve el endpoint con joins. */
export interface RecetaConDetalle {
  receta: Receta;
  medico?: Medico;
  especialidad?: Especialidad;
}

export interface MisRecetas {
  /** Las que hay que tomar ahora, las que vencen antes primero. */
  activas: RecetaConDetalle[];
  /** Las que ya vencieron y no se archivaron, las más recientes primero. */
  pasadas: RecetaConDetalle[];
  /** Las archivadas, en carpetas año → mes de archivo. */
  archivadas: CarpetaAnio<RecetaConDetalle>[];
}

/** Hace un GET de las recetas del paciente separadas en activas, pasadas y archivadas (en carpetas año → mes). */
export async function listMisRecetas(): Promise<MisRecetas> {
  const { activas, pasadas, archivadas } = await api<{ activas: RecetaConDetalle[]; pasadas: RecetaConDetalle[]; archivadas: RecetaConDetalle[] }>(
    "/api/pacientes/yo/recetas",
  );
  return {
    activas,
    pasadas,
    archivadas: agruparEnCarpetas(archivadas, ({ receta }) => ({ fecha: receta.fecha, archivadoEl: receta.archivadoEl ?? receta.fecha })),
  };
}

/** Hace un PATCH que archiva o desarchiva una receta. */
const archivar = (recetaId: string, archivada: boolean) =>
  api<Receta>(`/api/recetas/${encodeURIComponent(recetaId)}`, { metodo: "PATCH", cuerpo: { archivada } });

/** Hace un PATCH que archiva la receta con la fecha de hoy, que define su carpeta año → mes. Solo se archivan las pasadas. */
export async function archivarReceta(recetaId: string): Promise<Receta> {
  return archivar(recetaId, true);
}

/** Hace un PATCH que desarchiva la receta y la devuelve a Pasadas. */
export async function desarchivarReceta(recetaId: string): Promise<Receta> {
  return archivar(recetaId, false);
}

/** Hace un GET de las recetas que el profesional de la sesión le emitió a un paciente (regla 7). */
export async function listRecetasEmitidas(pacienteId: string): Promise<Receta[]> {
  return api<Receta[]>(`/api/medicos/yo/pacientes/${encodeURIComponent(pacienteId)}/recetas`);
}

export interface DatosNuevaReceta {
  /** Lo pone el backend con el profesional de la sesión; se mantiene por compatibilidad. */
  medicoId: string;
  pacienteId: string;
  /** Nombre del medicamento ("Amoxicilina 500mg"). */
  medicacion: string;
  dosis: string;
  /** Cómo tomarla ("Cada 8 horas"). */
  frecuencia: string;
  /** Duración del tratamiento, en días. Define hasta cuándo la receta es activa. */
  duracionDias: number;
  indicaciones: string;
}

/**
 * Hace un POST de una receta nueva del profesional de la sesión para un paciente, con la fecha de hoy. Es activa hasta
 * la fecha de emisión más la duración del tratamiento (`vigenteHasta`). El paciente recibe un aviso.
 */
export async function crearReceta({ medicoId: _medicoId, ...datos }: DatosNuevaReceta): Promise<Receta> {
  if (!datos.medicacion.trim()) throw new Error("Indicá el medicamento.");
  if (!datos.dosis.trim()) throw new Error("Indicá la dosis.");
  if (!datos.frecuencia.trim()) throw new Error("Indicá cómo tomarla.");
  if (!Number.isInteger(datos.duracionDias) || datos.duracionDias < 1 || datos.duracionDias > 365) {
    throw new Error("La duración tiene que ser de 1 a 365 días.");
  }
  return api<Receta>("/api/recetas", {
    metodo: "POST",
    cuerpo: {
      ...datos,
      medicacion: datos.medicacion.trim(),
      dosis: datos.dosis.trim(),
      frecuencia: datos.frecuencia.trim(),
      indicaciones: datos.indicaciones.trim() || undefined,
    },
  });
}
