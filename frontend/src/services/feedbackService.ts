import { Feedback, Turno } from "@/domain";

import { api } from "./apiClient";

/**
 * Regla de negocio #6 (CLAUDE.md §10): solo se puede opinar sobre un turno real cumplido, una vez. Devuelve los
 * turnos completados del paciente que todavía no calificó, del más reciente al más viejo.
 */
export async function listTurnosParaCalificar(_pacienteId: string): Promise<Turno[]> {
  return api<Turno[]>("/api/pacientes/yo/feedback/pendientes");
}

export async function getTurnoParaCalificar(pacienteId: string, turnoId: string): Promise<Turno | undefined> {
  return (await listTurnosParaCalificar(pacienteId)).find((t) => t.id === turnoId);
}

/** Las calificaciones que ya dejó el paciente. */
export async function listFeedbackPaciente(_pacienteId: string): Promise<Feedback[]> {
  return api<Feedback[]>("/api/pacientes/yo/feedback");
}

export type DatosFeedback = Pick<Feedback, "estrellas" | "criterios" | "comentario">;

export async function crearFeedback(_pacienteId: string, turnoId: string, datos: DatosFeedback): Promise<Feedback> {
  if (datos.estrellas < 1 || datos.estrellas > 5) throw new Error("Calificá la consulta.");
  return api<Feedback>(`/api/turnos/${encodeURIComponent(turnoId)}/feedback`, {
    metodo: "POST",
    // Los criterios sin calificar (0) no se mandan: son opcionales.
    cuerpo: {
      ...datos,
      criterios: Object.fromEntries(Object.entries(datos.criterios).filter(([, v]) => typeof v === "number" && v >= 1 && v <= 5)),
      comentario: datos.comentario?.trim() || undefined,
    },
  });
}

/** Cantidad de turnos completados que aún no fueron calificados. */
export async function countFeedbacksPendientes(pacienteId: string): Promise<number> {
  return (await listTurnosParaCalificar(pacienteId)).length;
}
