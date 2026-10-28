import { differenceInMinutes, parseISO } from "date-fns";

import { Especialidad, Institucion, Medico, Paciente, Sede, Turno } from "@/domain";

import { api } from "./apiClient";

// Turnos contra el backend (`docs/04-api.md#turnos`). El backend cierra solos los que ya pasaron (confirmado →
// completado, pendiente → rechazado) antes de devolverlos.

/** Todos los turnos del paciente, también los que sacó de su historial (su historial médico no cambia). */
export async function listTurnosPaciente(_pacienteId: string): Promise<Turno[]> {
  return api<Turno[]>("/api/pacientes/yo/turnos/todos");
}

/** Un turno de la agenda del profesional con el paciente y el lugar ya resueltos (un solo pedido). */
export interface TurnoDeAgenda {
  turno: Turno;
  paciente?: Paciente;
  sede?: Sede;
  institucion?: Institucion;
}

/** Todos los turnos del profesional de la sesión (pasados y futuros), por fecha y hora. Para Inicio, Agenda y la ficha. */
export async function listAgendaMedico(_medicoId: string): Promise<TurnoDeAgenda[]> {
  return api<TurnoDeAgenda[]>("/api/medicos/yo/agenda");
}

export async function listTurnosMedico(medicoId: string): Promise<Turno[]> {
  return (await listAgendaMedico(medicoId)).map(({ turno }) => turno);
}

/** Pacientes asignados: los que tienen un turno próximo (pendiente o confirmado) con el profesional de la sesión. */
export async function listPacientesAsignados(_medicoId: string): Promise<Paciente[]> {
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
 * "Mis turnos". Próximos: desde hoy, sin cancelar ni completar (confirmados primero y, dentro de cada estado, del
 * más cercano al más lejano). Historial: el resto, sin los que el paciente sacó (del más reciente al más viejo).
 */
export async function listMisTurnos(_pacienteId: string): Promise<MisTurnos> {
  return api<MisTurnos>("/api/pacientes/yo/turnos");
}

/** Saca un turno del historial del paciente. Solo se oculta: el registro médico no se borra. */
export async function ocultarTurnoDelHistorial(turnoId: string): Promise<void> {
  await api<Turno>(`/api/turnos/${encodeURIComponent(turnoId)}`, { metodo: "PATCH", cuerpo: { ocultoEnHistorial: true } });
}

/** "Eliminar todo" del historial: oculta todos los turnos que hoy figuran en él. */
export async function vaciarHistorialTurnos(_pacienteId: string): Promise<void> {
  await api<void>("/api/pacientes/yo/turnos/historial", { metodo: "DELETE" });
}

/** El próximo turno (confirmado o pendiente) de la fecha más cercana, con su detalle. */
export async function getProximoTurno(_pacienteId: string): Promise<TurnoConDetalle | undefined> {
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
  planMedicoId: string;
  medicoIds?: string[];
}

const conMedicos = (filtro: FiltroDisponibilidad) => (filtro.medicoIds ? `&medicos=${filtro.medicoIds.map(encodeURIComponent).join(",")}` : "");

/**
 * Horarios libres de un día (turnos de 30 min dentro de las franjas de cada profesional, sin los tomados ni los que
 * ya pasaron), solo donde la sede y el profesional le aparecen al paciente. `GET /api/turnos/disponibles`.
 */
export async function listHorariosLibres(filtro: FiltroDisponibilidad, fechaIso: string): Promise<HorarioLibre[]> {
  return api<HorarioLibre[]>(`/api/turnos/disponibles?fecha=${fechaIso}${conMedicos(filtro)}`);
}

/** Días (ISO) del rango `[desde, hasta]` en que alguno de los profesionales tiene un horario libre. */
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
 * Regla de negocio #4 (CLAUDE.md §10): una reserva bloquea el horario, no puede haber doble reserva. El turno
 * nace `pendiente`: queda así hasta que el profesional lo confirme o lo rechace. El paciente sale de la sesión.
 */
export async function crearTurno({ pacienteId: _pacienteId, ...datos }: DatosNuevoTurno): Promise<Turno> {
  return api<Turno>("/api/turnos", { metodo: "POST", cuerpo: datos });
}

const cambiarEstado = (turnoId: string, estado: Turno["estado"]) =>
  api<Turno>(`/api/turnos/${encodeURIComponent(turnoId)}`, { metodo: "PATCH", cuerpo: { estado } });

/** El profesional responde una solicitud: solo se confirma o rechaza un turno pendiente. Rechazarlo libera el horario. */
export async function confirmarTurno(turnoId: string): Promise<Turno> {
  return cambiarEstado(turnoId, "confirmado");
}

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

/** El paciente cancela su turno: el horario queda libre para otra persona. */
export async function cancelarTurno(turnoId: string): Promise<Turno> {
  return cambiarEstado(turnoId, "cancelado");
}

export type DatosReprogramacion = Pick<DatosNuevoTurno, "sedeId" | "fecha" | "hora">;

/**
 * Reprogramar = cancelar el turno y reservar otro con el mismo profesional, en una sola operación (si el nuevo
 * horario no se puede reservar, el viejo queda como estaba). El nuevo nace `pendiente` y guarda de qué turno viene.
 */
export async function reprogramarTurno(turnoId: string, datos: DatosReprogramacion): Promise<Turno> {
  return api<Turno>(`/api/turnos/${encodeURIComponent(turnoId)}/reprogramar`, { metodo: "POST", cuerpo: datos });
}

