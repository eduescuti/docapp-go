import { EstadoTurno, Medico } from "@/domain";

import { listEspecialidades } from "./especialidadService";
import { getInstitucionEnMemoria, getSedeEnMemoria } from "./institucionService";
import { listMedicos } from "./medicoService";
import { listPacientes } from "./pacienteService";
import { listPlanesMedicos } from "./planMedicoService";
import { getTurnosEnMemoria } from "./turnoService";

export interface EstadisticasUso {
  pacientes: number;
  profesionales: number;
  total: number;
}

export async function getEstadisticasUso(): Promise<EstadisticasUso> {
  const [pacientes, medicos] = await Promise.all([listPacientes(), listMedicos()]);
  return { pacientes: pacientes.length, profesionales: medicos.length, total: pacientes.length + medicos.length };
}

export interface ConteoObraSocial {
  aseguradora: string;
  cantidad: number;
}

/** Pacientes agrupados por obra social/prepaga (suma todos los planes de una misma aseguradora). */
export async function getPacientesPorObraSocial(): Promise<ConteoObraSocial[]> {
  const [pacientes, planes] = await Promise.all([listPacientes(), listPlanesMedicos()]);
  const conteo = new Map<string, number>();
  planes.forEach((plan) => conteo.set(plan.aseguradora, conteo.get(plan.aseguradora) ?? 0));
  pacientes.forEach((paciente) => {
    const plan = planes.find((p) => p.id === paciente.planMedicoId);
    if (plan) conteo.set(plan.aseguradora, (conteo.get(plan.aseguradora) ?? 0) + 1);
  });
  return Array.from(conteo, ([aseguradora, cantidad]) => ({ aseguradora, cantidad })).sort(
    (a, b) => b.cantidad - a.cantidad || a.aseguradora.localeCompare(b.aseguradora),
  );
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

/** Pestaña Métricas del administrador, en un solo pedido (como lo devolvería un endpoint con agregaciones). */
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

const ETIQUETA_ESTADO: Record<EstadoTurno, string> = {
  pendiente: "Pendientes",
  confirmado: "Confirmados",
  completado: "Completados",
  reprogramado: "Reprogramados",
  rechazado: "Rechazados",
  cancelado: "Cancelados",
};

function contar(claves: string[]): Conteo[] {
  const conteo = new Map<string, number>();
  claves.forEach((c) => conteo.set(c, (conteo.get(c) ?? 0) + 1));
  return Array.from(conteo, ([etiqueta, cantidad]) => ({ etiqueta, cantidad })).sort(
    (a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta),
  );
}

export async function getMetricasAdmin(): Promise<MetricasAdmin> {
  const [medicos, especialidades] = await Promise.all([listMedicos(), listEspecialidades()]);
  const turnos = getTurnosEnMemoria();
  const especialidadDe = (medicoId: string) => {
    const medico = medicos.find((m) => m.id === medicoId);
    return especialidades.find((e) => e.id === medico?.especialidadId)?.nombre ?? medico?.profesion ?? "Sin especialidad";
  };
  const institucionDe = (sedeId: string) => {
    const sede = getSedeEnMemoria(sedeId);
    return (sede ? getInstitucionEnMemoria(sede.institucionId)?.nombre : undefined) ?? "Sin institución";
  };

  const opiniones = medicos.reduce((n, m) => n + m.cantidadValoraciones, 0);
  const puntos = medicos.reduce((n, m) => n + m.valoracion * m.cantidadValoraciones, 0);

  return {
    turnos: turnos.length,
    pendientes: turnos.filter((t) => t.estado === "pendiente").length,
    valoracionPromedio: opiniones > 0 ? puntos / opiniones : 0,
    turnosPorEstado: contar(turnos.map((t) => ETIQUETA_ESTADO[t.estado])),
    turnosPorEspecialidad: contar(turnos.map((t) => especialidadDe(t.medicoId))),
    turnosPorInstitucion: contar(turnos.map((t) => institucionDe(t.sedeId))).slice(0, 5),
    mejorValorados: [...medicos]
      .sort((a, b) => b.valoracion - a.valoracion || b.cantidadValoraciones - a.cantidadValoraciones)
      .slice(0, 5)
      .map((medico) => ({ medico, especialidad: especialidades.find((e) => e.id === medico.especialidadId)?.nombre })),
  };
}
