import { FranjaAtencion } from "@/domain";

import { api } from "./apiClient";

/** Las franjas de atención del profesional de la sesión, por día y hora. `GET /api/medicos/yo/franjas`. */
export async function listMisFranjas(): Promise<FranjaAtencion[]> {
  return api<FranjaAtencion[]>("/api/medicos/yo/franjas");
}

export type DatosFranja = Pick<FranjaAtencion, "sedeId" | "diaSemana" | "desde" | "hasta">;

/**
 * Reemplaza todas las franjas del profesional (`PUT /api/medicos/yo/franjas`). Cada franja es en uno de sus
 * lugares, en horas en punto o y media, y las de un mismo día no se pisan aunque sean en lugares distintos (no
 * puede estar en dos lugares a la vez). Los turnos ya tomados no se tocan.
 */
export async function guardarMisFranjas(nuevas: DatosFranja[]): Promise<FranjaAtencion[]> {
  return api<FranjaAtencion[]>("/api/medicos/yo/franjas", { metodo: "PUT", cuerpo: { franjas: nuevas } });
}
