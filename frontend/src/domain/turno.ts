/**
 * Estados de un turno (Sprint 2):
 * - `pendiente`: el paciente lo solicitó y el profesional todavía no lo confirmó.
 * - `confirmado`: el profesional lo confirmó.
 * - `rechazado`: el profesional no lo aceptó, o llegó la fecha sin que lo confirmara. No ocupa el horario.
 * - `cancelado`: lo canceló el paciente. No ocupa el horario.
 * - `completado`: pasó la fecha de un turno confirmado (el paciente asistió).
 * - `reprogramado`: se movió a otra fecha (todavía sin flujo que lo genere).
 *
 * Al pasar la fecha, un turno confirmado pasa solo a `completado` y uno pendiente a `rechazado`.
 */
export type EstadoTurno = "confirmado" | "pendiente" | "cancelado" | "reprogramado" | "completado" | "rechazado";

/**
 * Turno reservado. Lo identifica la combinación fecha + hora + sede (hospital) + profesional (que define la
 * especialidad): no puede haber dos turnos activos con la misma (regla 4).
 */
export interface Turno {
  id: string;
  pacienteId: string;
  medicoId: string;
  sedeId: string;
  fecha: string; // ISO date "2026-08-24"
  hora: string; // "10:30"
  estado: EstadoTurno;
  /**
   * El paciente lo sacó de su historial de turnos. Solo se oculta en esa lista: el historial
   * médico, lo que ve el profesional y el feedback no cambian.
   */
  ocultoEnHistorial?: boolean;
}
