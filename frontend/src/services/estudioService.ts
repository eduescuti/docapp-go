import { Estudio, OrdenLaboratorio } from "@/domain";

import { api, apiArchivo, ErrorApi } from "./apiClient";
import { agruparEnCarpetas, CarpetaAnio } from "./carpetas";

// Órdenes y resultados contra el backend (`docs/04-api.md#órdenes-y-resultados`). Los resultados vienen del seed
// en este sprint; los carga un tercero (el laboratorio), no el profesional ni el admin.

const id = (valor: string) => encodeURIComponent(valor);

/** Todos los estudios del paciente, archivados o no (historial médico). */
export async function listEstudiosPaciente(_pacienteId: string): Promise<Estudio[]> {
  return api<Estudio[]>("/api/pacientes/yo/resultados");
}

/** Pestaña "Resultados": los que no están archivados, del más reciente al más viejo. */
export async function listResultadosPaciente(_pacienteId: string): Promise<Estudio[]> {
  return api<Estudio[]>("/api/pacientes/yo/resultados?archivados=false");
}

/** Archivados → Resultados: los estudios archivados, en carpetas año → mes de archivado. */
export async function listArchivadosPaciente(_pacienteId: string): Promise<CarpetaAnio<Estudio>[]> {
  const archivados = await api<Estudio[]>("/api/pacientes/yo/resultados?archivados=true");
  return agruparEnCarpetas(archivados, (e) => ({ fecha: e.fecha, archivadoEl: e.archivadoEl ?? e.fecha }));
}

/** Archivados → Órdenes: las órdenes archivadas, en carpetas año → mes de archivado. */
export async function listOrdenesArchivadasPaciente(_pacienteId: string): Promise<CarpetaAnio<OrdenLaboratorio>[]> {
  const archivadas = await api<OrdenLaboratorio[]>("/api/pacientes/yo/ordenes?archivadas=true");
  return agruparEnCarpetas(archivadas, (o) => ({ fecha: o.fecha, archivadoEl: o.archivadoEl ?? o.fecha }));
}

const archivarResultado = (estudioId: string, archivado: boolean) =>
  api<Estudio>(`/api/resultados/${id(estudioId)}`, { metodo: "PATCH", cuerpo: { archivado } });

/** Lo pasa a Archivados, en la carpeta del día de hoy (año → mes). */
export async function archivarEstudio(estudioId: string): Promise<Estudio> {
  return archivarResultado(estudioId, true);
}

/** Lo devuelve a Resultados. */
export async function desarchivarEstudio(estudioId: string): Promise<Estudio> {
  return archivarResultado(estudioId, false);
}

/** Pestaña "Órdenes": las que no están archivadas, de la más reciente a la más vieja. */
export async function listOrdenesPaciente(_pacienteId: string): Promise<OrdenLaboratorio[]> {
  return api<OrdenLaboratorio[]>("/api/pacientes/yo/ordenes?archivadas=false");
}

/** Una orden que el usuario puede ver (la suya, o una que emitió), o `undefined`. */
export async function getOrden(ordenId: string): Promise<OrdenLaboratorio | undefined> {
  try {
    return await api<OrdenLaboratorio>(`/api/ordenes/${id(ordenId)}`);
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return undefined;
    throw e;
  }
}

const archivarOrdenEn = (ordenId: string, archivada: boolean) =>
  api<OrdenLaboratorio>(`/api/ordenes/${id(ordenId)}`, { metodo: "PATCH", cuerpo: { archivada } });

/** Pasa la orden a Archivados, en la carpeta del día de hoy (año → mes). */
export async function archivarOrden(ordenId: string): Promise<OrdenLaboratorio> {
  return archivarOrdenEn(ordenId, true);
}

/** La devuelve a Órdenes. */
export async function desarchivarOrden(ordenId: string): Promise<OrdenLaboratorio> {
  return archivarOrdenEn(ordenId, false);
}

/** Órdenes que el profesional de la sesión le asignó a un paciente (regla #7: siempre asociadas a quien las emitió). */
export async function listOrdenesEmitidas(_medicoId: string, pacienteId: string): Promise<OrdenLaboratorio[]> {
  return api<OrdenLaboratorio[]>(`/api/medicos/yo/pacientes/${id(pacienteId)}/ordenes`);
}

export interface DatosNuevaOrden {
  /** Lo pone el backend con el profesional de la sesión; se mantiene por compatibilidad. */
  medicoId: string;
  pacienteId: string;
  /** Hospital o laboratorio donde se hace. */
  institucionId: string;
  estudiosSolicitados: string[];
  indicaciones: string;
}

/**
 * El profesional le asigna una orden al paciente, con sus indicaciones. Se emite con la fecha de hoy y nace
 * `pendiente`: pasa a `listo` cuando llega el primer resultado (lo carga el laboratorio). El paciente recibe un aviso.
 */
export async function crearOrden({ medicoId: _medicoId, ...datos }: DatosNuevaOrden): Promise<OrdenLaboratorio> {
  const estudiosSolicitados = datos.estudiosSolicitados.map((e) => e.trim()).filter(Boolean);
  if (estudiosSolicitados.length === 0) throw new Error("Indicá al menos un estudio.");
  if (!datos.indicaciones.trim()) throw new Error("Escribí las indicaciones (por ejemplo, \"Ayuno de 8 horas\").");
  if (!datos.institucionId) throw new Error("Elegí dónde se hace el estudio.");
  return api<OrdenLaboratorio>("/api/ordenes", {
    metodo: "POST",
    cuerpo: { ...datos, estudiosSolicitados, indicaciones: datos.indicaciones.trim() },
  });
}

/**
 * El PDF del resultado como string binario (un carácter por byte), para el visor. Solo lo descargan el paciente
 * dueño y el médico de la orden, y cada descarga queda registrada (regla 8). `null` si no existe.
 */
export async function getResultadoPdf(estudioId: string): Promise<string | null> {
  try {
    return await apiArchivo(`/api/resultados/${id(estudioId)}/pdf`);
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return null;
    throw e;
  }
}
