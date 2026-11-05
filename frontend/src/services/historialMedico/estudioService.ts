import AsyncStorage from "@react-native-async-storage/async-storage";

import { Estudio, OrdenLaboratorio } from "@/domain";

import { api, apiArchivo, ErrorApi } from "../apiClient";
import { agruparEnCarpetas, CarpetaAnio } from "./carpetas";

const id = (valor: string) => encodeURIComponent(valor);

/** Hace un GET de todos los estudios del paciente, archivados o no (historial médico). */
export async function listEstudiosPaciente(): Promise<Estudio[]> {
  return api<Estudio[]>("/api/pacientes/yo/resultados");
}

/** Hace un GET de los estudios no archivados del paciente, del más reciente al más viejo (pestaña Resultados). */
export async function listResultadosPaciente(): Promise<Estudio[]> {
  return api<Estudio[]>("/api/pacientes/yo/resultados?archivados=false");
}

/** Hace un GET de los estudios archivados del paciente y los agrupa en carpetas año → mes de archivado. */
export async function listArchivadosPaciente(): Promise<CarpetaAnio<Estudio>[]> {
  const archivados = await api<Estudio[]>("/api/pacientes/yo/resultados?archivados=true");
  return agruparEnCarpetas(archivados, (e) => ({ fecha: e.fecha, archivadoEl: e.archivadoEl ?? e.fecha }));
}

/** Hace un GET de las órdenes archivadas del paciente y las agrupa en carpetas año → mes de archivado. */
export async function listOrdenesArchivadasPaciente(): Promise<CarpetaAnio<OrdenLaboratorio>[]> {
  const archivadas = await api<OrdenLaboratorio[]>("/api/pacientes/yo/ordenes?archivadas=true");
  return agruparEnCarpetas(archivadas, (o) => ({ fecha: o.fecha, archivadoEl: o.archivadoEl ?? o.fecha }));
}

/** Hace un PATCH que archiva o desarchiva un estudio. */
const archivarResultado = (estudioId: string, archivado: boolean) =>
  api<Estudio>(`/api/resultados/${id(estudioId)}`, { metodo: "PATCH", cuerpo: { archivado } });

/** Hace un PATCH que archiva el estudio con la fecha de hoy, que define su carpeta año → mes. */
export async function archivarEstudio(estudioId: string): Promise<Estudio> {
  return archivarResultado(estudioId, true);
}

/** Hace un PATCH que desarchiva el estudio y lo devuelve a Resultados. */
export async function desarchivarEstudio(estudioId: string): Promise<Estudio> {
  return archivarResultado(estudioId, false);
}

/** Hace un GET de las órdenes no archivadas del paciente, de la más reciente a la más vieja (pestaña Órdenes). */
export async function listOrdenesPaciente(): Promise<OrdenLaboratorio[]> {
  return api<OrdenLaboratorio[]>("/api/pacientes/yo/ordenes?archivadas=false");
}

/** Hace un GET de una orden del usuario (la suya o una que emitió), o `undefined` si no existe o no la puede ver. */
export async function getOrden(ordenId: string): Promise<OrdenLaboratorio | undefined> {
  try {
    return await api<OrdenLaboratorio>(`/api/ordenes/${id(ordenId)}`);
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return undefined;
    throw e;
  }
}

/** Hace un PATCH que archiva o desarchiva una orden. */
const archivarOrdenEn = (ordenId: string, archivada: boolean) =>
  api<OrdenLaboratorio>(`/api/ordenes/${id(ordenId)}`, { metodo: "PATCH", cuerpo: { archivada } });

/** Hace un PATCH que archiva la orden con la fecha de hoy, que define su carpeta año → mes. */
export async function archivarOrden(ordenId: string): Promise<OrdenLaboratorio> {
  return archivarOrdenEn(ordenId, true);
}

/** Hace un PATCH que desarchiva la orden y la devuelve a Órdenes. */
export async function desarchivarOrden(ordenId: string): Promise<OrdenLaboratorio> {
  return archivarOrdenEn(ordenId, false);
}

/** Hace un GET de las órdenes que el profesional de la sesión le asignó a un paciente. */
export async function listOrdenesEmitidas(pacienteId: string): Promise<OrdenLaboratorio[]> {
  return api<OrdenLaboratorio[]>(`/api/medicos/yo/pacientes/${id(pacienteId)}/ordenes`);
}

export interface DatosNuevaOrden {
  medicoId: string;
  pacienteId: string;
  institucionId: string;
  estudiosSolicitados: string[];
  indicaciones: string;
}

/**
 * Hace un POST de una orden nueva del profesional de la sesión para un paciente. Se emite con la fecha de hoy y nace
 * `pendiente`: pasa a `listo` cuando llega el primer resultado. El paciente recibe un aviso.
 */
export async function crearOrden({ medicoId: _medicoId, ...datos }: DatosNuevaOrden): Promise<OrdenLaboratorio> {
  const estudiosSolicitados = datos.estudiosSolicitados.map((e) => e.trim()).filter(Boolean);
  if (estudiosSolicitados.length === 0) throw new Error("Indicá al menos un estudio.");
  if (!datos.indicaciones.trim()) throw new Error("Escribí las indicaciones (por ejemplo, \"Ayuno de 8 horas\").");
  if (!datos.institucionId) throw new Error("Elegí dónde se hace el estudio.");
  return api<OrdenLaboratorio>("/api/ordenes", {
    metodo: "POST",
    cuerpo: { ...datos, estudiosSolicitados, indicaciones: datos.indicaciones.trim() },
  });
}

/**
 * Hace un GET del PDF de un resultado y lo devuelve como string binario (un carácter por byte), para el visor, o
 * `null` si no existe o no lo puede ver. Solo lo descargan el paciente dueño y el médico de la orden, y cada descarga
 * queda registrada.
 */
export async function getResultadoPdf(estudioId: string): Promise<string | null> {
  try {
    return await apiArchivo(`/api/resultados/${id(estudioId)}/pdf`);
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return null;
    throw e;
  }
}

// ---------- Aviso de resultado nuevo ----------

/**
 * Aviso de "resultado nuevo" en Estudios › Resultados. No es un estado del resultado (en la base los resultados
 * no tienen estado): es un aviso solo del frontend, que se va cuando el paciente abre ese resultado. Se guarda
 * en el teléfono, por paciente, para que no vuelva a aparecer al cerrar la app.
 */
const clave = (pacienteId: string) => `@docapp:resultados_vistos:${pacienteId}`;

// Copia en memoria: las pantallas lo consultan cada vez que vuelven a la vista.
const cache = new Map<string, string[]>();

export async function listResultadosVistos(pacienteId: string): Promise<string[]> {
  const enMemoria = cache.get(pacienteId);
  if (enMemoria) return enMemoria;
  try {
    const guardado = await AsyncStorage.getItem(clave(pacienteId));
    const ids: unknown = guardado ? JSON.parse(guardado) : [];
    const vistos = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
    cache.set(pacienteId, vistos);
    return vistos;
  } catch {
    return [];
  }
}

export async function marcarResultadoVisto(pacienteId: string, estudioId: string): Promise<void> {
  const vistos = await listResultadosVistos(pacienteId);
  if (vistos.includes(estudioId)) return;
  const nuevos = [...vistos, estudioId];
  cache.set(pacienteId, nuevos);
  try {
    await AsyncStorage.setItem(clave(pacienteId), JSON.stringify(nuevos));
  } catch {
    // Si no se puede guardar, el aviso se va igual durante esta sesión (queda en memoria).
  }
}
