import { ObraSocialConPlanes, PlanConObraSocial } from "@/domain";

import { api } from "./apiClient";

// Catálogo de obras sociales y planes (`GET /api/planes`): se pide una vez y se vuelve a pedir si el admin suma uno.
let catalogo: Promise<ObraSocialConPlanes[]> | null = null;

/** Obras sociales con sus planes, por nombre. */
export async function listObrasSociales(): Promise<ObraSocialConPlanes[]> {
  catalogo ??= api<ObraSocialConPlanes[]>("/api/planes", { conSesion: false }).catch((e: unknown) => {
    catalogo = null;
    throw e;
  });
  return catalogo;
}

/** Todos los planes con su obra social (para mostrar el plan de cada paciente). */
export async function listPlanesMedicos(): Promise<PlanConObraSocial[]> {
  return (await listObrasSociales()).flatMap(({ planes: lista, ...obraSocial }) => lista.map((plan) => ({ ...plan, obraSocial })));
}

export async function getPlanMedico(id: string): Promise<PlanConObraSocial | undefined> {
  return (await listPlanesMedicos()).find((p) => p.id === id);
}

export interface DatosNuevoPlan {
  obraSocial: string;
  /** Vacío: la obra social nueva arranca con el plan "General". */
  plan: string;
}

/**
 * Alta de un plan (admin). Si la obra social no existe se crea (con el plan "General" si no se indica otro); si
 * existe, el plan se suma a ella.
 */
export async function crearPlanMedico(datos: DatosNuevoPlan): Promise<PlanConObraSocial> {
  if (!datos.obraSocial.trim()) throw new Error("Completá el nombre de la obra social.");
  const plan = await api<PlanConObraSocial>("/api/admin/planes", {
    metodo: "POST",
    cuerpo: { obraSocial: datos.obraSocial.trim(), plan: datos.plan.trim() || undefined },
  });
  catalogo = null;
  return plan;
}
