import { Institucion } from "@/domain";
import { institucionesMock } from "@/mocks";

import { delay } from "./apiClient";

export interface FiltrosInstitucion {
  planMedicoId?: string;
}

/** Regla de negocio #1 (CLAUDE.md §10): solo se muestra lo disponible para la cobertura del paciente. */
export async function listInstituciones(filtros: FiltrosInstitucion = {}): Promise<Institucion[]> {
  const resultado = institucionesMock.filter((inst) => {
    if (filtros.planMedicoId && !inst.planesAceptadosIds.includes(filtros.planMedicoId)) {
      return false;
    }
    return true;
  });
  return delay(resultado);
}

export async function getInstitucion(id: string): Promise<Institucion | undefined> {
  return delay(institucionesMock.find((i) => i.id === id));
}
