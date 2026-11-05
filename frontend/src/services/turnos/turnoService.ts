import { differenceInMinutes, parseISO } from "date-fns";

import { Especialidad, Institucion, Medico, Paciente, Sede, Turno } from "@/domain";

import { api } from "../apiClient";

// Turnos contra el backend (`docs/04-api.md#turnos`). El backend cierra solos los que ya pasaron (confirmado →
// completado, pendiente → rechazado) antes de devolverlos.

/** Hace un GET de todos los turnos del paciente, también los que sacó de su historial (historial médico). */
export async function listTurnosPaciente(): Promise<Turno[]> {
  return api<Turno[]>("/api/pacientes/yo/turnos/todos");
}

/** Un turno de la agenda del profesional con el paciente y el lugar ya resueltos (un solo pedido). */
export interface TurnoDeAgenda {
  turno: Turno;
  paciente?: Paciente;
  sede?: Sede;
  institucion?: Institucion;
}

/** Hace un GET de todos los turnos del profesional de la sesión (pasados y futuros), por fecha y hora, con paciente y lugar. */
export async function listAgendaMedico(): Promise<TurnoDeAgenda[]> {
  return api<TurnoDeAgenda[]>("/api/medicos/yo/agenda");
}

export async function listTurnosMedico(): Promise<Turno[]> {
  return (await listAgendaMedico()).map(({ turno }) => turno);
}

/** Hace un GET de los pacientes con un turno próximo (pendiente o confirmado) con el profesional de la sesión. */
export async function listPacientesAsignados(): Promise<Paciente[]> {
  return api<Paciente[]>("/api/medicos/yo/pacientes");
}

/** Un turno con el profesional, la especialidad y el lugar ya resueltos, como lo devuelve el endpoint con joins. */
export interface TurnoConDetalle {
  turno: Turno;
  medico?: Medico;
  especialidad?: Especialidad;
  sede?: Sede;
  institucion?: Institucion;
}

export interface MisTurnos {
  proximos: TurnoConDetalle[];
  historial: TurnoConDetalle[];
}

/**
 * Hace un GET de los turnos del paciente con su detalle, separados en dos listas. Próximos: desde hoy, sin cancelar ni
 * completar (confirmados primero y, dentro de cada estado, del más cercano al más lejano). Historial: el resto, sin
 * los que el paciente sacó (del más reciente al más viejo).
 */
export async function listMisTurnos(): Promise<MisTurnos> {
  return api<MisTurnos>("/api/pacientes/yo/turnos");
}

/** Hace un PATCH que saca un turno del historial del paciente. Solo se oculta: el registro médico no se borra. */
export async function ocultarTurnoDelHistorial(turnoId: string): Promise<void> {
  await api<Turno>(`/api/turnos/${encodeURIComponent(turnoId)}`, { metodo: "PATCH", cuerpo: { ocultoEnHistorial: true } });
}

/** Hace un DELETE del historial de turnos del paciente: oculta todos los que figuran en él, sin borrar ninguno. */
export async function vaciarHistorialTurnos(): Promise<void> {
  await api<void>("/api/pacientes/yo/turnos/historial", { metodo: "DELETE" });
}

/** Hace un GET del próximo turno (confirmado o pendiente) del paciente con su detalle, o `undefined` si no tiene. */
export async function getProximoTurno(): Promise<TurnoConDetalle | undefined> {
  return (await api<TurnoConDetalle | null>("/api/pacientes/yo/turnos/proximo")) ?? undefined;
}

export interface HorarioLibre {
  medicoId: string;
  sedeId: string;
  hora: string; // "09:30"
}

/**
 * A qué profesionales se refiere una consulta de disponibilidad: los que le aparecen al paciente por su plan
 * (regla 18; el backend lo toma de la sesión) y, si se indica, solo algunos puntuales (`medicoIds`).
 */
export interface FiltroDisponibilidad {
  medicoIds?: string[];
}

const conMedicos = (filtro: FiltroDisponibilidad) => (filtro.medicoIds ? `&medicos=${filtro.medicoIds.map(encodeURIComponent).join(",")}` : "");

/**
 * Hace un GET de los horarios libres de un día (turnos de 30 min dentro de las franjas de cada profesional, sin los
 * tomados ni los que ya pasaron), solo donde la sede y el profesional le aparecen al paciente (regla 18).
 */
export async function listHorariosLibres(filtro: FiltroDisponibilidad, fechaIso: string): Promise<HorarioLibre[]> {
  return api<HorarioLibre[]>(`/api/turnos/disponibles?fecha=${fechaIso}${conMedicos(filtro)}`);
}

/** Hace un GET de los días (ISO) del rango `[desde, hasta]` en que alguno de los profesionales tiene un horario libre. */
export async function listDiasConTurnos(filtro: FiltroDisponibilidad, desdeIso: string, hastaIso: string): Promise<string[]> {
  return api<string[]>(`/api/turnos/dias-con-turnos?desde=${desdeIso}&hasta=${hastaIso}${conMedicos(filtro)}`);
}

export interface DatosNuevoTurno {
  pacienteId: string;
  /** Paso 4 de la reserva: el backend revisa que sea la del profesional. */
  especialidadId: string;
  medicoId: string;
  sedeId: string;
  fecha: string;
  hora: string;
}

/**
 * Hace un POST de un turno nuevo para el paciente de la sesión. Nace `pendiente` hasta que el profesional lo confirme
 * o lo rechace, y bloquea el horario: no puede haber doble reserva (regla 4).
 */
export async function crearTurno({ pacienteId: _pacienteId, ...datos }: DatosNuevoTurno): Promise<Turno> {
  return api<Turno>("/api/turnos", { metodo: "POST", cuerpo: datos });
}

/** Hace un PATCH que cambia el estado de un turno. */
const cambiarEstado = (turnoId: string, estado: Turno["estado"]) =>
  api<Turno>(`/api/turnos/${encodeURIComponent(turnoId)}`, { metodo: "PATCH", cuerpo: { estado } });

/** Hace un PATCH con el que el profesional confirma un turno pendiente. */
export async function confirmarTurno(turnoId: string): Promise<Turno> {
  return cambiarEstado(turnoId, "confirmado");
}

/** Hace un PATCH con el que el profesional rechaza un turno pendiente, y libera el horario. */
export async function rechazarTurno(turnoId: string): Promise<Turno> {
  return cambiarEstado(turnoId, "rechazado");
}

/** Hasta cuántas horas antes del turno se puede cancelar o reprogramar (regla 5, igual para toda la app). */
export const HORAS_MINIMAS_CANCELACION = 24;

/**
 * Por qué el paciente ya no puede cancelar ni reprogramar el turno, o `null` si puede: solo los activos (pendientes y
 * confirmados) y hasta 24 h antes (regla 5). La app lo usa para deshabilitar los botones; el backend lo vuelve a
 * controlar.
 */
export function motivoSinCambios(turno: Turno): string | null {
  if (turno.estado !== "pendiente" && turno.estado !== "confirmado") return "Este turno ya no está activo.";
  const minutos = differenceInMinutes(parseISO(`${turno.fecha}T${turno.hora}`), new Date());
  if (minutos < HORAS_MINIMAS_CANCELACION * 60) {
    return `Faltan menos de ${HORAS_MINIMAS_CANCELACION} h para el turno: ya no se puede cancelar ni reprogramar desde la app.`;
  }
  return null;
}

/** Hace un PATCH con el que el paciente cancela su turno, y libera el horario. */
export async function cancelarTurno(turnoId: string): Promise<Turno> {
  return cambiarEstado(turnoId, "cancelado");
}

export type DatosReprogramacion = Pick<DatosNuevoTurno, "sedeId" | "fecha" | "hora">;

/**
 * Hace un POST que cancela el turno y reserva otro con el mismo profesional, en una sola operación (si el nuevo horario
 * no se puede reservar, el viejo queda como estaba). El nuevo nace `pendiente` y guarda de qué turno viene.
 */
export async function reprogramarTurno(turnoId: string, datos: DatosReprogramacion): Promise<Turno> {
  return api<Turno>(`/api/turnos/${encodeURIComponent(turnoId)}/reprogramar`, { metodo: "POST", cuerpo: datos });
}

