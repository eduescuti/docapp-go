import { Especialidad, ObraSocialConPlanes, PlanConObraSocial, PreguntaFrecuente } from "@/domain";
import { preguntasFrecuentesMock } from "@/mocks";

import { api } from "../apiClient";

// ---------- Especialidades ----------

let catalogoEspecialidades: Promise<Especialidad[]> | null = null;

/** Hace un GET de las especialidades, ordenadas por nombre. Se pide una vez y queda en memoria. */
export async function listEspecialidades(): Promise<Especialidad[]> {
  catalogoEspecialidades ??= api<Especialidad[]>("/api/especialidades", { conSesion: false }).catch((e: unknown) => {
    catalogoEspecialidades = null;
    throw e;
  });
  return catalogoEspecialidades;
}

export async function getEspecialidad(id: string): Promise<Especialidad | undefined> {
  return (await listEspecialidades()).find((e) => e.id === id);
}

// ---------- Obras sociales y planes ----------

let catalogoObrasSociales: Promise<ObraSocialConPlanes[]> | null = null;

/** Hace un GET de las obras sociales con sus planes, ordenadas por nombre. Se pide una vez y queda en memoria. */
export async function listObrasSociales(): Promise<ObraSocialConPlanes[]> {
  catalogoObrasSociales ??= api<ObraSocialConPlanes[]>("/api/planes", { conSesion: false }).catch((e: unknown) => {
    catalogoObrasSociales = null;
    throw e;
  });
  return catalogoObrasSociales;
}

export async function listPlanesMedicos(): Promise<PlanConObraSocial[]> {
  return (await listObrasSociales()).flatMap(({ planes: lista, ...obraSocial }) => lista.map((plan) => ({ ...plan, obraSocial })));
}

export async function getPlanMedico(id: string): Promise<PlanConObraSocial | undefined> {
  return (await listPlanesMedicos()).find((p) => p.id === id);
}

export interface DatosNuevoPlan {
  obraSocial: string;
  plan: string;
}

/** Hace un POST de un plan médico nuevo (admin). Si la obra social no existe, el backend también la crea. */
export async function crearPlanMedico(datos: DatosNuevoPlan): Promise<PlanConObraSocial> {

  if (!datos.obraSocial.trim()) {
    throw new Error("Completá el nombre de la obra social.")
  };

  const plan = await api<PlanConObraSocial>("/api/admin/planes", {
    metodo: "POST",
    cuerpo: { obraSocial: datos.obraSocial.trim(), plan: datos.plan.trim() || undefined },
  });

  catalogoObrasSociales = null;
  return plan;
}

// ---------- Preguntas frecuentes (Ayuda) ----------

export async function listPreguntasFrecuentes(): Promise<PreguntaFrecuente[]> {
  return preguntasFrecuentesMock;
}
