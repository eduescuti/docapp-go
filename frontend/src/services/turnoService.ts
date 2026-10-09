import { Turno } from "@/domain";
import { turnosMock } from "@/mocks";

import { delay } from "./apiClient";

// Estado en memoria: simula la tabla de turnos hasta que exista backend real.
let turnos: Turno[] = [...turnosMock];

/** Acceso sincrónico para otros services (p. ej. pacientes asignados). Las pantallas usan las funciones async. */
export function getTurnosEnMemoria(): Turno[] {
  return turnos;
}

export async function listTurnosMedico(medicoId: string): Promise<Turno[]> {
  return delay(
    turnos
      .filter((t) => t.medicoId === medicoId)
      .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`)),
  );
}

export async function listTurnosPaciente(pacienteId: string): Promise<Turno[]> {
  return delay(turnos.filter((t) => t.pacienteId === pacienteId));
}

export interface MisTurnos {
  proximos: Turno[];
  historial: Turno[];
}

/**
 * Turnos de la pantalla "Mis turnos". Próximos: desde hoy, sin cancelar ni completar (del más
 * cercano al más lejano). Historial: el resto, sin los que el paciente sacó (del más reciente al más viejo).
 */
export async function listMisTurnos(pacienteId: string): Promise<MisTurnos> {
  const hoy = new Date().toISOString().slice(0, 10);
  const propios = turnos.filter((t) => t.pacienteId === pacienteId);
  const esProximo = (t: Turno) => t.fecha >= hoy && t.estado !== "cancelado" && t.estado !== "completado";
  const orden = (a: Turno, b: Turno) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`);
  return delay({
    proximos: propios.filter(esProximo).sort(orden),
    historial: propios.filter((t) => !esProximo(t) && !t.ocultoEnHistorial).sort((a, b) => orden(b, a)),
  });
}

/** Saca un turno del historial del paciente. Solo se oculta: el registro médico no se borra. */
export async function ocultarTurnoDelHistorial(turnoId: string): Promise<void> {
  turnos = turnos.map((t) => (t.id === turnoId ? { ...t, ocultoEnHistorial: true } : t));
  return delay(undefined);
}

/** "Eliminar todo" del historial: oculta todos los turnos que hoy figuran en él. */
export async function vaciarHistorialTurnos(pacienteId: string): Promise<void> {
  const { historial } = await listMisTurnos(pacienteId);
  const ids = new Set(historial.map((t) => t.id));
  turnos = turnos.map((t) => (ids.has(t.id) ? { ...t, ocultoEnHistorial: true } : t));
  return delay(undefined);
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
