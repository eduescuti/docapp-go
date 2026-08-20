import { Especialidad } from "@/domain";
import { especialidadesMock } from "@/mocks";

import { delay } from "./apiClient";

export async function listEspecialidades(): Promise<Especialidad[]> {
  return delay(especialidadesMock);
}

export async function getEspecialidad(id: string): Promise<Especialidad | undefined> {
  return delay(especialidadesMock.find((e) => e.id === id));
}
