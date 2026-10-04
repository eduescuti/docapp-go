import { Medico } from "@/domain";
import { medicosMock } from "@/mocks";

import { delay } from "./apiClient";
import { getSesionActual } from "./authService";

export interface FiltrosMedico {
  query?: string;
  especialidadId?: string;
  planMedicoId?: string;
}

/**
 * Reglas de negocio #1 y #2 (CLAUDE.md §10): un médico solo aparece si atiende
 * la especialidad buscada y si acepta la cobertura del paciente.
 */
export async function searchMedicos(filtros: FiltrosMedico = {}): Promise<Medico[]> {
  const query = filtros.query?.trim().toLowerCase();
  const resultado = medicosMock.filter((medico) => {
    if (filtros.especialidadId && medico.especialidadId !== filtros.especialidadId) return false;
    if (filtros.planMedicoId && !medico.planesAceptadosIds.includes(filtros.planMedicoId)) return false;
    if (query) {
      const nombreCompleto = `${medico.nombre} ${medico.apellido}`.toLowerCase();
      if (!nombreCompleto.includes(query)) return false;
    }
    return true;
  });
  return delay(resultado);
}

export async function getMedico(id: string): Promise<Medico | undefined> {
  return delay(medicosMock.find((m) => m.id === id));
}

export async function listMedicos(): Promise<Medico[]> {
  return delay(medicosMock);
}

export async function getMedicoActual(): Promise<Medico> {
  const sesion = getSesionActual();
  if (sesion?.rol !== "doctor") throw new Error("No hay profesional autenticado");
  const medico = medicosMock.find((m) => m.id === sesion.medicoId);
  if (!medico) throw new Error("No hay profesional autenticado");
  return delay(medico);
}
