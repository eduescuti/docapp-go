import { CoberturaAceptada, Medico } from "@/domain";

import { api, ErrorApi } from "./apiClient";

export interface FiltrosMedico {
  query?: string;
  especialidadId?: string;
  /** Lo resuelve el backend con el plan del paciente de la sesión; se mantiene por compatibilidad. */
  planMedicoId?: string;
  /** Solo los que atienden en esa sede (tarjeta del mapa). */
  sedeId?: string;
}

/**
 * Reglas de negocio #1 y #2 (CLAUDE.md §10): un médico solo aparece si atiende la especialidad buscada y la
 * cobertura del paciente (el backend la toma de la sesión). `GET /api/medicos`.
 */
export async function searchMedicos(filtros: FiltrosMedico = {}): Promise<Medico[]> {
  const params = new URLSearchParams();
  if (filtros.especialidadId) params.set("especialidad", filtros.especialidadId);
  if (filtros.sedeId) params.set("sede", filtros.sedeId);
  if (filtros.query?.trim()) params.set("q", filtros.query.trim());
  const consulta = params.toString();
  return api<Medico[]>(`/api/medicos${consulta ? `?${consulta}` : ""}`);
}

/** Perfil público de un profesional, o `undefined` si no existe. */
export async function getMedico(id: string): Promise<Medico | undefined> {
  try {
    return await api<Medico>(`/api/medicos/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return undefined;
    throw e;
  }
}

/** El profesional de la sesión: datos del registro, lugares de atención y coberturas. `GET /api/medicos/yo`. */
export async function getMedicoActual(): Promise<Medico> {
  return api<Medico>("/api/medicos/yo");
}

/**
 * El profesional elige qué coberturas atiende (regla 17). Reemplaza la lista entera, como
 * `PUT /api/medicos/yo/coberturas`. Los turnos ya tomados no cambian.
 */
export async function guardarMisCoberturas(coberturas: CoberturaAceptada[]): Promise<Medico> {
  return api<Medico>("/api/medicos/yo/coberturas", { metodo: "PUT", cuerpo: { coberturas } });
}

/**
 * El profesional elige en qué lugares atiende (decidido el 27/10/2026). Si saca un lugar, sus horarios de ese
 * lugar se borran; los turnos ya tomados no cambian. `PUT /api/medicos/yo/lugares`.
 */
export async function guardarMisLugares(sedeIds: string[]): Promise<Medico> {
  return api<Medico>("/api/medicos/yo/lugares", { metodo: "PUT", cuerpo: { sedeIds } });
}
