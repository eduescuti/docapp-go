import { CoberturaAceptada, FuenteCobertura, Institucion, PlanMedico, Sede, TipoInstitucion } from "@/domain";
import { cubrePlan } from "@/utils/cobertura";

import { api, ErrorApi } from "./apiClient";

export interface FiltrosInstitucion {
  planMedicoId?: string;
}

/**
 * Reglas 1 y 15 (CLAUDE.md §10): un público atiende a todos; un privado o de seguridad social, solo si acepta
 * la obra social del paciente (entera o su plan). Lo mismo que filtra el backend; la app lo usa sobre datos que ya
 * tiene (p. ej. los lugares del profesional al asignar una orden).
 */
export function aceptaCobertura(institucion: Institucion, plan: Pick<PlanMedico, "id" | "obraSocialId">): boolean {
  return institucion.origen === "publico" || cubrePlan(institucion.coberturas, plan);
}

/**
 * Con `planMedicoId` (el del paciente de la sesión): las que puede usar, `GET /api/instituciones`. Sin plan (admin):
 * todas, primero las que tienen coberturas, `GET /api/admin/instituciones`.
 */
export async function listInstituciones(filtros: FiltrosInstitucion = {}): Promise<Institucion[]> {
  if (!filtros.planMedicoId) return api<Institucion[]>("/api/admin/instituciones");
  const centros = await api<CentroCercano[]>("/api/instituciones");
  return centros.map((c) => c.institucion);
}

export interface FiltrosCentros {
  /** Lo resuelve el backend con el plan del paciente de la sesión; se mantiene por compatibilidad. */
  planMedicoId: string;
  tipos?: TipoInstitucion[];
  /** Ubicación real del paciente. Sin ella no se calculan distancias y se ordena por nombre. */
  cerca?: { latitud: number; longitud: number };
  radioKm?: number;
  limite?: number;
}

export interface CentroCercano {
  institucion: Institucion;
  /** La sede más cercana al paciente (o la primera, si no hay ubicación). */
  sede: Sede;
  distanciaKm?: number;
  /** Por qué lo ve el paciente: público (regla 15) o porque acepta su plan. */
  motivo: "publica" | "cobertura";
}

function consultaCentros(params: { tipos?: string[]; cerca?: { latitud: number; longitud: number }; radioKm?: number; limite?: number; sedes?: string[] }) {
  const q = new URLSearchParams();
  if (params.tipos && params.tipos.length > 0) q.set("tipos", params.tipos.join(","));
  if (params.cerca) {
    q.set("lat", String(params.cerca.latitud));
    q.set("lng", String(params.cerca.longitud));
  }
  if (params.radioKm !== undefined) q.set("radioKm", String(params.radioKm));
  if (params.limite !== undefined) q.set("limite", String(params.limite));
  if (params.sedes) q.set("sedes", params.sedes.join(","));
  const texto = q.toString();
  return `/api/instituciones${texto ? `?${texto}` : ""}`;
}

/**
 * Centros que el paciente puede usar, para el mapa y la lista: cobertura → tipos → radio → orden por distancia →
 * límite. Lo resuelve el backend con el plan de la sesión.
 */
export async function buscarCentros(filtros: FiltrosCentros): Promise<CentroCercano[]> {
  return api<CentroCercano[]>(consultaCentros(filtros));
}

/** Los centros de esas sedes puntuales (p. ej. las que tienen turnos libres en la reserva), para elegir uno en el mapa. */
export async function listCentrosPorSedes(sedeIds: string[], cerca?: { latitud: number; longitud: number }): Promise<CentroCercano[]> {
  if (sedeIds.length === 0) return [];
  return api<CentroCercano[]>(consultaCentros({ sedes: sedeIds, cerca }));
}

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

/** Alta de institución con su sede principal (admin). Las coordenadas son las que después usa el mapa. */
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
 * El admin reemplaza las coberturas de una institución, con su fuente y fecha (regla 17), como
 * `PUT /api/admin/instituciones/:id/coberturas`. Los públicos no tienen coberturas: los ven todos (regla 15).
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

/** De dónde salen los establecimientos, para la atribución en Menú → Ayuda (licencia CC BY 4.0). */
const FUENTE_INSTITUCIONES: FuenteInstituciones = {
  fuente: "REFES — Registro Federal de Establecimientos de Salud, Ministerio de Salud de la Nación",
  licencia: "CC BY 4.0",
  version: "2025-12-15",
};

export async function getFuenteInstituciones(): Promise<FuenteInstituciones> {
  return FUENTE_INSTITUCIONES;
}

export async function getSede(sedeId: string): Promise<Sede | undefined> {
  return (await listLugaresDeAtencion([sedeId]))[0]?.sede;
}

/** Un lugar de atención de un profesional: la sede con su institución (hospital) ya resuelta. */
export interface LugarDeAtencion {
  sede: Sede;
  institucion: Institucion;
}

/** Lugares de atención (sedes) de un profesional, en un solo pedido. Los que no se encuentran se omiten. */
export async function listLugaresDeAtencion(sedeIds: string[]): Promise<LugarDeAtencion[]> {
  if (sedeIds.length === 0) return [];
  return api<LugarDeAtencion[]>(`/api/sedes?ids=${sedeIds.map(encodeURIComponent).join(",")}`);
}

/** Búsqueda de lugares por nombre, para que el profesional elija dónde atiende. `GET /api/sedes/buscar?q=`. */
export async function buscarLugares(texto: string): Promise<LugarDeAtencion[]> {
  return api<LugarDeAtencion[]>(`/api/sedes/buscar?q=${encodeURIComponent(texto.trim())}`);
}
