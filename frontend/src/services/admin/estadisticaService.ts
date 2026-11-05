import { Medico } from "@/domain";

import { api } from "../apiClient";

// Panel y Métricas del administrador (`GET /api/admin/estadisticas` y `/api/admin/metricas`). 

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

export interface Conteo {
  etiqueta: string;
  cantidad: number;
}

export interface ProfesionalValorado {
  medico: Medico;
  especialidad?: string;
}

export interface MetricasAdmin {
  turnos: number;
  pendientes: number;
  valoracionPromedio: number;
  turnosPorEstado: Conteo[];
  turnosPorEspecialidad: Conteo[];
  turnosPorInstitucion: Conteo[];
  mejorValorados: ProfesionalValorado[];
}

const estadisticas = () => api<Estadisticas>("/api/admin/estadisticas");

/** Hace un GET de las estadísticas del panel y devuelve la cantidad de pacientes, de profesionales y el total. */
export async function getEstadisticasUso(): Promise<EstadisticasUso> {
  return (await estadisticas()).uso;
}

/** Hace un GET de las estadísticas del panel y devuelve la cantidad de pacientes por obra social. */
export async function getPacientesPorObraSocial(): Promise<ConteoObraSocial[]> {
  return (await estadisticas()).porObraSocial;
}

/** Hace un GET de las métricas del admin: turnos, valoración promedio y profesionales mejor valorados. */
export async function getMetricasAdmin(): Promise<MetricasAdmin> {
  return api<MetricasAdmin>("/api/admin/metricas");
}
