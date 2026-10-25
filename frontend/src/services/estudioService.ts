import { format } from "date-fns";

import { Estudio, OrdenLaboratorio } from "@/domain";
import { estudiosMock, ordenesLaboratorioMock, resultadosEstudiosMock } from "@/mocks";
import { formatFechaLarga, nombreConTitulo } from "@/utils/format";
import { crearPdfSimple } from "@/utils/pdf";

import { delay } from "./apiClient";
import { agruparEnCarpetas, CarpetaAnio } from "./carpetas";
import { getInstitucion } from "./institucionService";
import { getMedico } from "./medicoService";
import { getPaciente } from "./pacienteService";

// Estado en memoria: archivar cambia el estudio hasta que exista backend real.
let estudios: Estudio[] = [...estudiosMock];

let ordenes: OrdenLaboratorio[] = [...ordenesLaboratorioMock];

const masReciente = (a: { fecha: string }, b: { fecha: string }) => b.fecha.localeCompare(a.fecha);

/** Todos los estudios del paciente, archivados o no (historial médico). */
export async function listEstudiosPaciente(pacienteId: string): Promise<Estudio[]> {
  return delay(estudios.filter((e) => e.pacienteId === pacienteId));
}

/** Pestaña "Resultados": los que no están archivados, del más reciente al más viejo. */
export async function listResultadosPaciente(pacienteId: string): Promise<Estudio[]> {
  return delay(estudios.filter((e) => e.pacienteId === pacienteId && !e.archivadoEl).sort(masReciente));
}

/** Archivados → Resultados: los estudios archivados, en carpetas año → mes. */
export async function listArchivadosPaciente(pacienteId: string): Promise<CarpetaAnio<Estudio>[]> {
  return delay(agruparEnCarpetas(
      estudios.filter((e) => e.pacienteId === pacienteId && e.archivadoEl),
      (e) => ({ fecha: e.fecha, archivadoEl: e.archivadoEl! }),
    ));
}

/** Archivados → Órdenes: las órdenes archivadas, en carpetas año → mes. */
export async function listOrdenesArchivadasPaciente(pacienteId: string): Promise<CarpetaAnio<OrdenLaboratorio>[]> {
  return delay(agruparEnCarpetas(
      ordenes.filter((o) => o.pacienteId === pacienteId && o.archivadoEl),
      (o) => ({ fecha: o.fecha, archivadoEl: o.archivadoEl! }),
    ));
}

/** Lo pasa a Archivados, en la carpeta del día de hoy (año → mes). */
export async function archivarEstudio(estudioId: string): Promise<Estudio> {
  const hoy = format(new Date(), "yyyy-MM-dd");
  estudios = estudios.map((e) => (e.id === estudioId ? { ...e, archivadoEl: hoy } : e));
  const actualizado = estudios.find((e) => e.id === estudioId);
  if (!actualizado) throw new Error("Estudio no encontrado");
  return delay(actualizado);
}

/** Lo devuelve a Resultados. */
export async function desarchivarEstudio(estudioId: string): Promise<Estudio> {
  estudios = estudios.map((e) => (e.id === estudioId ? { ...e, archivadoEl: undefined } : e));
  const actualizado = estudios.find((e) => e.id === estudioId);
  if (!actualizado) throw new Error("Estudio no encontrado");
  return delay(actualizado);
}

/** Pestaña "Órdenes": las que no están archivadas, de la más reciente a la más vieja. */
export async function listOrdenesPaciente(pacienteId: string): Promise<OrdenLaboratorio[]> {
  return delay(ordenes.filter((o) => o.pacienteId === pacienteId && !o.archivadoEl).sort(masReciente));
}

export async function getOrden(ordenId: string): Promise<OrdenLaboratorio | undefined> {
  return delay(ordenes.find((o) => o.id === ordenId));
}

/** Pasa la orden a Archivados, en la carpeta del día de hoy (año → mes). */
export async function archivarOrden(ordenId: string): Promise<OrdenLaboratorio> {
  const hoy = format(new Date(), "yyyy-MM-dd");
  ordenes = ordenes.map((o) => (o.id === ordenId ? { ...o, archivadoEl: hoy } : o));
  const actualizada = ordenes.find((o) => o.id === ordenId);
  if (!actualizada) throw new Error("Orden no encontrada");
  return delay(actualizada);
}

/** La devuelve a Órdenes. */
export async function desarchivarOrden(ordenId: string): Promise<OrdenLaboratorio> {
  ordenes = ordenes.map((o) => (o.id === ordenId ? { ...o, archivadoEl: undefined } : o));
  const actualizada = ordenes.find((o) => o.id === ordenId);
  if (!actualizada) throw new Error("Orden no encontrada");
  return delay(actualizada);
}

/** Estudios que un profesional le pidió a un paciente. */
export async function listEstudiosSolicitados(medicoId: string, pacienteId: string): Promise<Estudio[]> {
  return delay(estudios.filter((e) => e.medicoSolicitanteId === medicoId && e.pacienteId === pacienteId));
}

/** Órdenes que un profesional le asignó a un paciente (regla #7: siempre asociadas a quien las emitió). */
export async function listOrdenesEmitidas(medicoId: string, pacienteId: string): Promise<OrdenLaboratorio[]> {
  return delay(ordenes.filter((o) => o.medicoId === medicoId && o.pacienteId === pacienteId).sort(masReciente));
}

export interface DatosNuevaOrden {
  medicoId: string;
  pacienteId: string;
  /** Hospital o laboratorio donde se hace. */
  institucionId: string;
  estudiosSolicitados: string[];
  indicaciones: string;
}

/**
 * El profesional le asigna una orden al paciente, con sus indicaciones. Se emite con la fecha de hoy y nace
 * `pendiente`: pasa a `listo` cuando llega el primer resultado (lo carga el laboratorio).
 */
export async function crearOrden(datos: DatosNuevaOrden): Promise<OrdenLaboratorio> {
  const estudiosSolicitados = datos.estudiosSolicitados.map((e) => e.trim()).filter(Boolean);
  if (estudiosSolicitados.length === 0) throw new Error("Indicá al menos un estudio.");
  if (!datos.indicaciones.trim()) throw new Error("Escribí las indicaciones (por ejemplo, \"Ayuno de 8 horas\").");
  if (!datos.institucionId) throw new Error("Elegí dónde se hace el estudio.");
  const orden: OrdenLaboratorio = {
    id: `orden-${Date.now()}`,
    medicoId: datos.medicoId,
    pacienteId: datos.pacienteId,
    fecha: format(new Date(), "yyyy-MM-dd"),
    estudiosSolicitados,
    indicaciones: datos.indicaciones.trim(),
    institucionId: datos.institucionId,
    estado: "pendiente",
  };
  ordenes = [...ordenes, orden];
  return delay(orden);
}

/**
 * Archivo del resultado como string binario (un carácter por byte), para el visor de PDF.
 * Hoy se arma un PDF de ejemplo con los datos del estudio; con backend vendría el archivo real
 * (`resultadoUrl`). Devuelve null si el resultado no existe.
 */
export async function getResultadoPdf(estudioId: string): Promise<string | null> {
  const estudio = estudios.find((e) => e.id === estudioId);
  if (!estudio) return delay(null);
  const [paciente, medico, institucion] = await Promise.all([
    getPaciente(estudio.pacienteId),
    getMedico(estudio.medicoSolicitanteId),
    getInstitucion(estudio.institucionId),
  ]);
  const pdf = crearPdfSimple({
    titulo: estudio.tipo,
    aviso: "Documento de ejemplo con datos ficticios, generado para la demo de DocApp Go.",
    campos: [
      ["Paciente", paciente ? `${paciente.nombre} ${paciente.apellido} (DNI ${paciente.dni})` : "-"],
      ["Médico solicitante", medico ? nombreConTitulo(medico) : "-"],
      ["Institución", institucion?.nombre ?? "-"],
      ["Fecha", formatFechaLarga(estudio.fecha)],
    ],
    secciones: resultadosEstudiosMock[estudio.id] ?? [{ titulo: "Informe", lineas: ["Sin informe cargado."] }],
    pie: "Este documento no tiene validez médica.",
  });
  return delay(pdf);
}
