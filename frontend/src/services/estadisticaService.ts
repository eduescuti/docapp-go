import { Medico } from "@/domain";

import { api } from "./apiClient";

// Panel y Métricas del administrador (`GET /api/admin/estadisticas` y `/api/admin/metricas`). Nunca traen
// fotos de pacientes (regla 19).

export interface EstadisticasUso {
  pacientes: number;
  profesionales: number;
  total: number;
}

export interface ConteoObraSocial {
  obraSocial: string;
  cantidad: number;
}

interface Estadisticas {
  uso: EstadisticasUso;
  porObraSocial: ConteoObraSocial[];
}

const estadisticas = () => api<Estadisticas>("/api/admin/estadisticas");

export async function getEstadisticasUso(): Promise<EstadisticasUso> {
  return (await estadisticas()).uso;
}

/**
 * Pacientes agrupados por obra social/prepaga (suma todos los planes de una misma obra social). Solo las que
 * tienen pacientes: el catálogo tiene 26 y la mayoría quedaría en cero.
 */
export async function getPacientesPorObraSocial(): Promise<ConteoObraSocial[]> {
  return (await estadisticas()).porObraSocial;
}

/** Una barra de los gráficos de Métricas. */
export interface Conteo {
  etiqueta: string;
  cantidad: number;
}

export interface ProfesionalValorado {
  medico: Medico;
  especialidad?: string;
}

/** Pestaña Métricas del administrador, en un solo pedido (un endpoint con agregaciones). */
export interface MetricasAdmin {
  turnos: number;
  pendientes: number;
  /** Promedio de todas las valoraciones, ponderado por cantidad de opiniones (0 si no hay). */
  valoracionPromedio: number;
  turnosPorEstado: Conteo[];
  turnosPorEspecialidad: Conteo[];
  turnosPorInstitucion: Conteo[];
  mejorValorados: ProfesionalValorado[];
}

export async function getMetricasAdmin(): Promise<MetricasAdmin> {
  return api<MetricasAdmin>("/api/admin/metricas");
}
