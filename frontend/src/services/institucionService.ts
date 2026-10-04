import { Institucion, Sede, TipoInstitucion } from "@/domain";
import { institucionesMock } from "@/mocks";

import { delay } from "./apiClient";

// Estado en memoria: el admin puede sumar instituciones durante la sesión.
let instituciones: Institucion[] = [...institucionesMock];

export interface FiltrosInstitucion {
  planMedicoId?: string;
}

/** Regla de negocio #1 (CLAUDE.md §10): solo se muestra lo disponible para la cobertura del paciente. */
export async function listInstituciones(filtros: FiltrosInstitucion = {}): Promise<Institucion[]> {
  const resultado = instituciones.filter((inst) => {
    if (filtros.planMedicoId && !inst.planesAceptadosIds.includes(filtros.planMedicoId)) {
      return false;
    }
    return true;
  });
  return delay(resultado);
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
        telefono: datos.telefono.trim(),
      },
    ],
  };
  instituciones = [...instituciones, institucion];
  return delay(institucion);
}

export async function getSede(sedeId: string): Promise<Sede | undefined> {
  return delay(instituciones.flatMap((i) => i.sedes).find((s) => s.id === sedeId));
}
