import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Estudio, OrdenLaboratorio } from "@/domain";
import { estudiosMock, ordenesLaboratorioMock, resultadosEstudiosMock } from "@/mocks";
import { formatFechaLarga, nombreConTitulo } from "@/utils/format";
import { crearPdfSimple } from "@/utils/pdf";

import { delay } from "./apiClient";
import { getInstitucion } from "./institucionService";
import { getMedico } from "./medicoService";
import { getPaciente } from "./pacienteService";

// Estado en memoria: archivar cambia el estudio hasta que exista backend real.
let estudios: Estudio[] = [...estudiosMock];

const masReciente = (a: Estudio, b: Estudio) => b.fecha.localeCompare(a.fecha);

/** Todos los estudios del paciente, archivados o no (historial médico). */
export async function listEstudiosPaciente(pacienteId: string): Promise<Estudio[]> {
  return delay(estudios.filter((e) => e.pacienteId === pacienteId));
}

/** Pestaña "Resultados": los que no están archivados, del más reciente al más viejo. */
export async function listResultadosPaciente(pacienteId: string): Promise<Estudio[]> {
  return delay(estudios.filter((e) => e.pacienteId === pacienteId && !e.archivadoEl).sort(masReciente));
}

export interface CarpetaMes {
  /** "2026-10" */
  clave: string;
  /** "Octubre" */
  nombre: string;
  estudios: Estudio[];
}

export interface CarpetaAnio {
  anio: string;
  meses: CarpetaMes[];
  cantidad: number;
}

/**
 * Pestaña "Archivados": carpetas por año y, adentro, por mes en que se archivó. Solo existen las
 * carpetas que tienen algún estudio (las más nuevas primero).
 */
export async function listArchivadosPaciente(pacienteId: string): Promise<CarpetaAnio[]> {
  const archivados = estudios.filter((e) => e.pacienteId === pacienteId && e.archivadoEl);
  const porMes = new Map<string, Estudio[]>();
  for (const estudio of archivados) {
    const clave = estudio.archivadoEl!.slice(0, 7);
    porMes.set(clave, [...(porMes.get(clave) ?? []), estudio]);
  }
  const anios = new Map<string, CarpetaMes[]>();
  for (const [clave, lista] of [...porMes].sort((a, b) => b[0].localeCompare(a[0]))) {
    const nombre = format(parseISO(`${clave}-01`), "LLLL", { locale: es });
    const mes: CarpetaMes = { clave, nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1), estudios: lista.sort(masReciente) };
    const anio = clave.slice(0, 4);
    anios.set(anio, [...(anios.get(anio) ?? []), mes]);
  }
  return delay(
    [...anios].map(([anio, meses]) => ({ anio, meses, cantidad: meses.reduce((n, m) => n + m.estudios.length, 0) })),
  );
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

export async function listOrdenesPaciente(pacienteId: string): Promise<OrdenLaboratorio[]> {
  return delay(ordenesLaboratorioMock.filter((o) => o.pacienteId === pacienteId));
}

export async function getOrden(ordenId: string): Promise<OrdenLaboratorio | undefined> {
  return delay(ordenesLaboratorioMock.find((o) => o.id === ordenId));
}

/** Estudios que un profesional le pidió a un paciente. */
export async function listEstudiosSolicitados(medicoId: string, pacienteId: string): Promise<Estudio[]> {
  return delay(estudios.filter((e) => e.medicoSolicitanteId === medicoId && e.pacienteId === pacienteId));
}

/**
 * Archivo del resultado como string binario (un carácter por byte), para el visor de PDF.
 * Hoy se arma un PDF de ejemplo con los datos del estudio; con backend vendría el archivo real
 * (`resultadoUrl`). Devuelve null si el estudio todavía no tiene resultado.
 */
export async function getResultadoPdf(estudioId: string): Promise<string | null> {
  const estudio = estudios.find((e) => e.id === estudioId);
  if (!estudio || estudio.estado !== "resultado_disponible") return delay(null);
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
