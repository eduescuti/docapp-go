import { Feedback, Turno } from "@/domain";

import { api } from "../apiClient";

/**
 * Hace un GET de los turnos completados del paciente que todavía no calificó, del más reciente al más viejo. Solo se
 * puede opinar sobre un turno real cumplido, una vez (regla 6).
 */
export async function listTurnosParaCalificar(): Promise<Turno[]> {
  return api<Turno[]>("/api/pacientes/yo/feedback/pendientes");
}

export async function getTurnoParaCalificar(turnoId: string): Promise<Turno | undefined> {
  return (await listTurnosParaCalificar()).find((t) => t.id === turnoId);
}

/** Hace un GET de las calificaciones que ya dejó el paciente. */
export async function listFeedbackPaciente(): Promise<Feedback[]> {
  return api<Feedback[]>("/api/pacientes/yo/feedback");
}

export type DatosFeedback = Pick<Feedback, "estrellas" | "criterios" | "comentario">;

/** Hace un POST de la calificación de un turno. Solo las estrellas son obligatorias. */
export async function crearFeedback(turnoId: string, datos: DatosFeedback): Promise<Feedback> {
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
export async function countFeedbacksPendientes(): Promise<number> {
  return (await listTurnosParaCalificar()).length;
}
