import { PlanMedico } from "@/domain";
import { planesMedicosMock } from "@/mocks";

import { delay } from "./apiClient";

export async function listPlanesMedicos(): Promise<PlanMedico[]> {
  return delay(planesMedicosMock);
}

export async function getPlanMedico(id: string): Promise<PlanMedico | undefined> {
  return delay(planesMedicosMock.find((p) => p.id === id));
}
