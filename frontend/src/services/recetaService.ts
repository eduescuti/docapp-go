import { format } from "date-fns";

import { Especialidad, Medico, Receta } from "@/domain";
import { especialidadesMock, medicosMock, recetasMock } from "@/mocks";
import { hoyIso } from "@/utils/format";

import { delay } from "./apiClient";
import { agruparEnCarpetas, CarpetaAnio } from "./carpetas";

// Estado en memoria: archivar cambia la receta hasta que exista backend real.
let recetas: Receta[] = [...recetasMock];

/** Todas las recetas del paciente, archivadas o no (historial médico). */
export async function listRecetasPaciente(pacienteId: string): Promise<Receta[]> {
  return delay(recetas.filter((r) => r.pacienteId === pacienteId));
}

/** Una receta es activa hasta su último día de consumo inclusive; después pasa a pasadas. */
export const esRecetaActiva = (receta: Receta): boolean => receta.vigenteHasta >= hoyIso();

/** Una receta con el profesional y su especialidad ya resueltos, como lo devolvería un endpoint con joins. */
export interface RecetaConDetalle {
  receta: Receta;
  medico?: Medico;
  especialidad?: Especialidad;
}

function conDetalle(receta: Receta): RecetaConDetalle {
  const medico = medicosMock.find((m) => m.id === receta.medicoId);
  return { receta, medico, especialidad: medico ? especialidadesMock.find((e) => e.id === medico.especialidadId) : undefined };
}

export interface MisRecetas {
  /** Las que hay que tomar ahora, las que vencen antes primero. */
  activas: RecetaConDetalle[];
  /** Las que ya vencieron y no se archivaron, las más recientes primero. */
  pasadas: RecetaConDetalle[];
  /** Las archivadas, en carpetas año → mes de archivo. */
  archivadas: CarpetaAnio<RecetaConDetalle>[];
}

/** Pestaña Recetas (Activas | Pasadas) y su Archivados, en un solo pedido. */
export async function listMisRecetas(pacienteId: string): Promise<MisRecetas> {
  const propias = recetas.filter((r) => r.pacienteId === pacienteId);
  return delay({
    activas: propias
      .filter((r) => esRecetaActiva(r) && !r.archivadoEl)
      .sort((a, b) => a.vigenteHasta.localeCompare(b.vigenteHasta))
      .map(conDetalle),
    pasadas: propias
      .filter((r) => !esRecetaActiva(r) && !r.archivadoEl)
      .sort((a, b) => b.vigenteHasta.localeCompare(a.vigenteHasta))
      .map(conDetalle),
    archivadas: agruparEnCarpetas(
      propias.filter((r) => r.archivadoEl).map(conDetalle),
      ({ receta }) => ({ fecha: receta.fecha, archivadoEl: receta.archivadoEl! }),
    ),
  });
}

/** Pasa la receta a Archivados, en la carpeta del día de hoy (año → mes). Solo se pueden archivar las pasadas. */
export async function archivarReceta(recetaId: string): Promise<Receta> {
  const receta = recetas.find((r) => r.id === recetaId);
  if (!receta) throw new Error("Receta no encontrada");
  if (esRecetaActiva(receta)) throw new Error("Solo se pueden archivar las recetas pasadas.");
  const archivada = { ...receta, archivadoEl: format(new Date(), "yyyy-MM-dd") };
  recetas = recetas.map((r) => (r.id === recetaId ? archivada : r));
  return delay(archivada);
}

/** La devuelve a Pasadas. */
export async function desarchivarReceta(recetaId: string): Promise<Receta> {
  const receta = recetas.find((r) => r.id === recetaId);
  if (!receta) throw new Error("Receta no encontrada");
  const desarchivada = { ...receta, archivadoEl: undefined };
  recetas = recetas.map((r) => (r.id === recetaId ? desarchivada : r));
  return delay(desarchivada);
}

/** Recetas que un profesional le emitió a un paciente (regla #7: siempre asociadas a quien las emitió). */
export async function listRecetasEmitidas(medicoId: string, pacienteId: string): Promise<Receta[]> {
  return delay(recetas.filter((r) => r.medicoId === medicoId && r.pacienteId === pacienteId));
}
