import { CoberturaAceptada, FuenteCobertura, Institucion, PlanMedico, Sede, TipoInstitucion } from "@/domain";
import { cubrePlan } from "@/utils/cobertura";

import { api, ErrorApi } from "../apiClient";

export interface FiltrosInstitucion {
  planMedicoId?: string;
}

/**
 * Si la institución es pública, la ve todo el mundo. Si es privada o de seguridad social, solo si acepta el plan del paciente.
 */
export function aceptaCobertura(institucion: Institucion, plan: Pick<PlanMedico, "id" | "obraSocialId">): boolean {
  return institucion.origen === "publico" || cubrePlan(institucion.coberturas, plan);
}

/**
 * Hace un GET de las instituciones. Con `planMedicoId` (el del paciente de la sesión): las que puede usar. Sin plan
 * (admin): todas, primero las que tienen coberturas.
 */
export async function listInstituciones(filtros: FiltrosInstitucion = {}): Promise<Institucion[]> {
  if (!filtros.planMedicoId) return api<Institucion[]>("/api/admin/instituciones");
  const centros = await api<CentroCercano[]>("/api/instituciones");
  return centros.map((c) => c.institucion);
}

export interface FiltrosCentros {
  tipos?: TipoInstitucion[];
  cerca?: { latitud: number; longitud: number };
}

export interface CentroCercano {
  institucion: Institucion;
  sede: Sede;
  distanciaKm?: number;
  motivo: "publica" | "cobertura";
}

function consultaCentros(params: { tipos?: string[]; cerca?: { latitud: number; longitud: number }; sedes?: string[] }) {
  const q = new URLSearchParams();
  if (params.tipos && params.tipos.length > 0) q.set("tipos", params.tipos.join(","));
  if (params.cerca) {
    q.set("lat", String(params.cerca.latitud));
    q.set("lng", String(params.cerca.longitud));
  }
  if (params.sedes) q.set("sedes", params.sedes.join(","));
  const texto = q.toString();
  return `/api/instituciones${texto ? `?${texto}` : ""}`;
}

/**
 * Hace un GET de los centros que el paciente de la sesión puede usar, para el mapa y la lista. Se pueden filtrar por
 * tipo y, con `cerca`, vienen del más cercano al más lejano.
 */
export async function buscarCentros(filtros: FiltrosCentros = {}): Promise<CentroCercano[]> {
  return api<CentroCercano[]>(consultaCentros(filtros));
}

/** Hace un GET de los centros de esas sedes (p. ej. las que tienen turnos libres en la reserva), para elegir uno en el mapa. */
export async function listCentrosPorSedes(sedeIds: string[], cerca?: { latitud: number; longitud: number }): Promise<CentroCercano[]> {
  if (sedeIds.length === 0) return [];
  return api<CentroCercano[]>(consultaCentros({ sedes: sedeIds, cerca }));
}

/** Hace un GET de una institución con sus sedes y coberturas, o `undefined` si no existe. */
export async function getInstitucion(id: string): Promise<Institucion | undefined> {
  try {
    return await api<Institucion>(`/api/instituciones/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return undefined;
    throw e;
  }
}

export interface DatosNuevaInstitucion {
  nombre: string;
  tipo: TipoInstitucion;
  direccion: string;
  ciudad: string;
  telefono: string;
  latitud: number;
  longitud: number;
  coberturas: CoberturaAceptada[];
  fuente: FuenteCobertura;
}

/** Hace un POST de una institución nueva con su sede principal (admin). Las coordenadas son las que después usa el mapa. */
export async function crearInstitucion(datos: DatosNuevaInstitucion): Promise<Institucion> {
  const nombre = datos.nombre.trim();
  if (!nombre || !datos.direccion.trim() || !datos.ciudad.trim()) throw new Error("Completá nombre, dirección y ciudad.");
  if (!Number.isFinite(datos.latitud) || Math.abs(datos.latitud) > 90) throw new Error("Latitud inválida.");
  if (!Number.isFinite(datos.longitud) || Math.abs(datos.longitud) > 180) throw new Error("Longitud inválida.");
  if (datos.coberturas.length === 0) throw new Error("Elegí al menos una obra social aceptada.");
  const { fuente, ...resto } = datos;
  return api<Institucion>("/api/admin/instituciones", {
    metodo: "POST",
    cuerpo: { ...resto, nombre, telefono: datos.telefono.trim() || undefined, ...fuente },
  });
}

/**
 * Hace un PUT de las coberturas de la institución (admin). El backend reemplaza todas las coberturas existentes por las nuevas.
 */
export async function guardarCoberturasInstitucion(
  institucionId: string,
  coberturas: CoberturaAceptada[],
  fuente: FuenteCobertura,
): Promise<Institucion> {
  return api<Institucion>(`/api/admin/instituciones/${encodeURIComponent(institucionId)}/coberturas`, {
    metodo: "PUT",
    cuerpo: { coberturas, ...fuente },
  });
}

export interface FuenteInstituciones {
  fuente: string;
  licencia: string;
  version: string;
}

const FUENTE_INSTITUCIONES: FuenteInstituciones = {
  fuente: "REFES — Registro Federal de Establecimientos de Salud, Ministerio de Salud de la Nación",
  licencia: "CC BY 4.0",
  version: "2025-12-15",
};

export async function getFuenteInstituciones(): Promise<FuenteInstituciones> {
  return FUENTE_INSTITUCIONES;
}

export interface LugarDeAtencion {
  sede: Sede;
  institucion: Institucion;
}

/** Hace un GET de esas sedes, cada una con su institución (los lugares de atención de un profesional). */
export async function listLugaresDeAtencion(sedeIds: string[]): Promise<LugarDeAtencion[]> {
  if (sedeIds.length === 0) return [];
  return api<LugarDeAtencion[]>(`/api/sedes?ids=${sedeIds.map(encodeURIComponent).join(",")}`);
}

/**
 * Hace un GET de los lugares que coinciden con el nombre buscado, para que el profesional elija dónde atiende. Trae
 * solo los públicos y los que aceptan alguna de sus coberturas.
 */
export async function buscarLugares(texto: string): Promise<LugarDeAtencion[]> {
  return api<LugarDeAtencion[]>(`/api/sedes/buscar?q=${encodeURIComponent(texto.trim())}`);
}
