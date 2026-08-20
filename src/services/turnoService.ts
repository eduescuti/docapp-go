import { Turno } from "@/domain";
import { turnosMock } from "@/mocks";

import { delay } from "./apiClient";

// Estado en memoria: simula la tabla de turnos hasta que exista backend real.
let turnos: Turno[] = [...turnosMock];

export async function listTurnosPaciente(pacienteId: string): Promise<Turno[]> {
  return delay(turnos.filter((t) => t.pacienteId === pacienteId));
}

export async function getProximoTurno(pacienteId: string): Promise<Turno | undefined> {
  const hoy = new Date().toISOString().slice(0, 10);
  const proximos = turnos
    .filter((t) => t.pacienteId === pacienteId)
    .filter((t) => t.estado === "confirmado" || t.estado === "pendiente")
    .filter((t) => t.fecha >= hoy)
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
  return delay(proximos[0]);
}

export interface DatosNuevoTurno {
  pacienteId: string;
  medicoId: string;
  sedeId: string;
  fecha: string;
  hora: string;
  tipoConsulta: Turno["tipoConsulta"];
}

/** Regla de negocio #4 (CLAUDE.md §10): una reserva bloquea el horario, no puede haber doble reserva. */
export async function crearTurno(datos: DatosNuevoTurno): Promise<Turno> {
  const yaOcupado = turnos.some(
    (t) =>
      t.medicoId === datos.medicoId &&
      t.fecha === datos.fecha &&
      t.hora === datos.hora &&
      t.estado !== "cancelado",
  );
  if (yaOcupado) throw new Error("Ese horario ya no está disponible.");

  const nuevoTurno: Turno = {
    id: `turno-${Date.now()}`,
    estado: "confirmado",
    ...datos,
  };
  turnos = [...turnos, nuevoTurno];
  return delay(nuevoTurno);
}

export async function cancelarTurno(turnoId: string): Promise<Turno> {
  turnos = turnos.map((t) => (t.id === turnoId ? { ...t, estado: "cancelado" } : t));
  const actualizado = turnos.find((t) => t.id === turnoId);
  if (!actualizado) throw new Error("Turno no encontrado");
  return delay(actualizado);
}

export async function reprogramarTurno(turnoId: string, fecha: string, hora: string): Promise<Turno> {
  turnos = turnos.map((t) => (t.id === turnoId ? { ...t, fecha, hora, estado: "reprogramado" } : t));
  const actualizado = turnos.find((t) => t.id === turnoId);
  if (!actualizado) throw new Error("Turno no encontrado");
  return delay(actualizado);
}
