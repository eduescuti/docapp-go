import { Institucion, Sede, TipoInstitucion } from "@/domain";
import { fuenteInstitucionesMock, institucionesMock } from "@/mocks";
import { distanciaKm } from "@/utils/geo";

import { delay } from "./apiClient";

// Estado en memoria: el admin puede sumar instituciones durante la sesión.
let instituciones: Institucion[] = [...institucionesMock];

export interface FiltrosInstitucion {
  planMedicoId?: string;
}

/** Reglas 1 y 15 (CLAUDE.md §10): un público atiende a todos; un privado, solo si acepta el plan. */
export function aceptaCobertura(institucion: Institucion, planMedicoId: string): boolean {
  return institucion.origen === "publico" || institucion.planesAceptadosIds.includes(planMedicoId);
}

/** Solo devuelve lo disponible para la cobertura del paciente, si se indica su plan. */
export async function listInstituciones(filtros: FiltrosInstitucion = {}): Promise<Institucion[]> {
  const { planMedicoId } = filtros;
  const resultado = planMedicoId ? instituciones.filter((inst) => aceptaCobertura(inst, planMedicoId)) : instituciones;
  return delay(resultado);
}

export interface FiltrosCentros {
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

/**
 * Centros que el paciente puede usar, para el mapa y la lista: cobertura → tipos → radio →
 * orden por distancia → límite. Con backend sería `GET /instituciones?plan=&tipos=&lat=&lng=&radio=&limite=`.
 */
export async function buscarCentros(filtros: FiltrosCentros): Promise<CentroCercano[]> {
  const { planMedicoId, tipos, cerca, radioKm, limite } = filtros;
  const centros: CentroCercano[] = [];
  for (const institucion of instituciones) {
    if (!aceptaCobertura(institucion, planMedicoId)) continue;
    if (tipos && tipos.length > 0 && !tipos.includes(institucion.tipo)) continue;
    if (institucion.sedes.length === 0) continue;
    const conDistancia = institucion.sedes.map((sede) => ({
      sede,
      distanciaKm: cerca ? distanciaKm(cerca.latitud, cerca.longitud, sede.latitud, sede.longitud) : undefined,
    }));
    const masCercana = conDistancia.reduce((a, b) => ((b.distanciaKm ?? 0) < (a.distanciaKm ?? 0) ? b : a));
    if (radioKm !== undefined && masCercana.distanciaKm !== undefined && masCercana.distanciaKm > radioKm) continue;
    centros.push({
      institucion,
      sede: masCercana.sede,
      distanciaKm: masCercana.distanciaKm,
      motivo: institucion.origen === "publico" ? "publica" : "cobertura",
    });
  }
  centros.sort((a, b) =>
    a.distanciaKm !== undefined && b.distanciaKm !== undefined
      ? a.distanciaKm - b.distanciaKm
      : a.institucion.nombre.localeCompare(b.institucion.nombre, "es"),
  );
  return delay(limite ? centros.slice(0, limite) : centros);
}

export async function getInstitucion(id: string): Promise<Institucion | undefined> {
  return delay(instituciones.find((i) => i.id === id));
}

export interface DatosNuevaInstitucion {
  nombre: string;
  tipo: TipoInstitucion;
  direccion: string;
  ciudad: string;
  telefono: string;
  latitud: number;
  longitud: number;
  planesAceptadosIds: string[];
}

/** Alta de institución con su sede principal. Las coordenadas son las que después usa el mapa. */
export async function crearInstitucion(datos: DatosNuevaInstitucion): Promise<Institucion> {
  const nombre = datos.nombre.trim();
  if (!nombre || !datos.direccion.trim() || !datos.ciudad.trim()) {
    throw new Error("Completá nombre, dirección y ciudad.");
  }
  if (!Number.isFinite(datos.latitud) || Math.abs(datos.latitud) > 90) throw new Error("Latitud inválida.");
  if (!Number.isFinite(datos.longitud) || Math.abs(datos.longitud) > 180) throw new Error("Longitud inválida.");
  if (datos.planesAceptadosIds.length === 0) throw new Error("Elegí al menos una obra social aceptada.");

  const id = `inst-${Date.now()}`;
  const institucion: Institucion = {
    id,
    nombre,
    tipo: datos.tipo,
    // Hasta que el formulario tenga el selector Público / Privado (Fase 6 del plan), las altas
    // del admin son privadas: se ven solo para las obras sociales elegidas, como hasta ahora.
    origen: "privado",
    planesAceptadosIds: datos.planesAceptadosIds,
    sedes: [
      {
        id: `sede-${id}-1`,
        institucionId: id,
        nombre,
        direccion: datos.direccion.trim(),
        ciudad: datos.ciudad.trim(),
        latitud: datos.latitud,
        longitud: datos.longitud,
        telefono: datos.telefono.trim() || undefined,
      },
    ],
  };
  // Primero, para que el admin la vea arriba de la lista.
  instituciones = [institucion, ...instituciones];
  return delay(institucion);
}

export interface FuenteInstituciones {
  fuente: string;
  licencia: string;
  version: string;
}

export async function getFuenteInstituciones(): Promise<FuenteInstituciones> {
  return delay(fuenteInstitucionesMock);
}

export async function getSede(sedeId: string): Promise<Sede | undefined> {
  return delay(instituciones.flatMap((i) => i.sedes).find((s) => s.id === sedeId));
}
