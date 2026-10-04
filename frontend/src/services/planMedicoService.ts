import { PlanMedico } from "@/domain";
import { planesMedicosMock } from "@/mocks";

import { delay } from "./apiClient";

// Estado en memoria: el admin puede sumar obras sociales durante la sesión.
let planes: PlanMedico[] = [...planesMedicosMock];

export async function listPlanesMedicos(): Promise<PlanMedico[]> {
  return delay(planes);
}

export async function getPlanMedico(id: string): Promise<PlanMedico | undefined> {
  return delay(planes.find((p) => p.id === id));
}

export interface DatosNuevoPlan {
  aseguradora: string;
  nombre: string;
}

export async function crearPlanMedico(datos: DatosNuevoPlan): Promise<PlanMedico> {
  const aseguradora = datos.aseguradora.trim();
  const nombre = datos.nombre.trim();
  if (!aseguradora || !nombre) throw new Error("Completá la obra social y el nombre del plan.");
  const duplicado = planes.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (duplicado) throw new Error("Ya existe un plan con ese nombre.");

  const plan: PlanMedico = { id: `plan-${Date.now()}`, aseguradora, nombre };
  planes = [...planes, plan];
  return delay(plan);
}
