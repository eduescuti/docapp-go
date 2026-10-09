export type EstadoTurno = "confirmado" | "pendiente" | "cancelado" | "reprogramado" | "completado";

export type TipoConsulta =
  | "presencial"
  | "control"
  | "primera_consulta"
  | "seguimiento"
  | "estudio_especifico";

export interface Turno {
  id: string;
  pacienteId: string;
  medicoId: string;
  sedeId: string;
  fecha: string; // ISO date "2026-08-24"
  hora: string; // "10:30"
  tipoConsulta: TipoConsulta;
  estado: EstadoTurno;
  /**
   * El paciente lo sacó de su historial de turnos. Solo se oculta en esa lista: el historial
   * médico, lo que ve el profesional y el feedback no cambian.
   */
  ocultoEnHistorial?: boolean;
}
