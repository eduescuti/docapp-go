import { CoberturaAceptada, FranjaAtencion, Medico, NotaPaciente } from "@/domain";

import { api, ErrorApi } from "../apiClient";

// ---------- Profesionales ----------

export interface FiltrosMedico {
  /** Solo los que atienden en esa sede (tarjeta del mapa). */
  sedeId?: string;
}

/**
 * Hace un GET de los profesionales, o solo de los que atienden en una sede si se indica `sedeId`. A un paciente solo le
 * llegan los que atienden su cobertura (el backend la toma de la sesión).
 */
export async function searchMedicos(filtros: FiltrosMedico = {}): Promise<Medico[]> {
  const params = new URLSearchParams();
  if (filtros.sedeId) params.set("sede", filtros.sedeId);
  const consulta = params.toString();
  return api<Medico[]>(`/api/medicos${consulta ? `?${consulta}` : ""}`);
}

/** Hace un GET del perfil público de un profesional, o `undefined` si no existe. */
export async function getMedico(id: string): Promise<Medico | undefined> {
  try {
    return await api<Medico>(`/api/medicos/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return undefined;
    throw e;
  }
}

/** Hace un GET del profesional de la sesión: datos del registro, lugares de atención y coberturas. */
export async function getMedicoActual(): Promise<Medico> {
  return api<Medico>("/api/medicos/yo");
}

/**
 * Hace un PUT de las coberturas que atiende el profesional de la sesión y reemplaza la lista entera (regla 17). Los
 * turnos ya tomados no cambian.
 */
export async function guardarMisCoberturas(coberturas: CoberturaAceptada[]): Promise<Medico> {
  return api<Medico>("/api/medicos/yo/coberturas", { metodo: "PUT", cuerpo: { coberturas } });
}

/**
 * Hace un PUT de los lugares donde atiende el profesional de la sesión. Si saca un lugar, sus horarios de ese lugar se
 * borran; los turnos ya tomados no cambian.
 */
export async function guardarMisLugares(sedeIds: string[]): Promise<Medico> {
  return api<Medico>("/api/medicos/yo/lugares", { metodo: "PUT", cuerpo: { sedeIds } });
}

// ---------- Franjas de atención ----------

/** Hace un GET de las franjas de atención del profesional de la sesión, por día y hora. */
export async function listMisFranjas(): Promise<FranjaAtencion[]> {
  return api<FranjaAtencion[]>("/api/medicos/yo/franjas");
}

export type DatosFranja = Pick<FranjaAtencion, "sedeId" | "diaSemana" | "desde" | "hasta">;

/**
 * Hace un PUT que reemplaza todas las franjas del profesional de la sesión. Cada franja es en uno de sus lugares, en
 * horas en punto o y media, y las de un mismo día no se pisan aunque sean en lugares distintos (no puede estar en dos
 * lugares a la vez). Los turnos ya tomados no se tocan.
 */
export async function guardarMisFranjas(nuevas: DatosFranja[]): Promise<FranjaAtencion[]> {
  return api<FranjaAtencion[]>("/api/medicos/yo/franjas", { metodo: "PUT", cuerpo: { franjas: nuevas } });
}

// ---------- Notas sobre pacientes ----------

const ruta = (pacienteId: string) => `/api/medicos/yo/pacientes/${encodeURIComponent(pacienteId)}/notas`;

/** Hace un GET de las notas del profesional de la sesión sobre un paciente, la más nueva primero. Son privadas de quien las escribió. */
export async function listNotasPaciente(pacienteId: string): Promise<NotaPaciente[]> {
  return api<NotaPaciente[]>(ruta(pacienteId));
}

/** Hace un POST de una nota nueva del profesional de la sesión sobre un paciente. */
export async function crearNotaPaciente(pacienteId: string, texto: string): Promise<NotaPaciente> {
  const limpio = texto.trim();
  if (!limpio) throw new Error("La nota no puede estar vacía.");
  return api<NotaPaciente>(ruta(pacienteId), { metodo: "POST", cuerpo: { texto: limpio } });
}
