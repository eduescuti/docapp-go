import { listMedicos } from "./medicoService";
import { listPacientes } from "./pacienteService";
import { listPlanesMedicos } from "./planMedicoService";

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
