import { Estudio, OrdenLaboratorio } from "@/domain";
import { estudiosMock, ordenesLaboratorioMock } from "@/mocks";

import { delay } from "./apiClient";

export async function listEstudiosPaciente(pacienteId: string): Promise<Estudio[]> {
  return delay(estudiosMock.filter((e) => e.pacienteId === pacienteId));
}

export async function listOrdenesPaciente(pacienteId: string): Promise<OrdenLaboratorio[]> {
  return delay(ordenesLaboratorioMock.filter((o) => o.pacienteId === pacienteId));
}
