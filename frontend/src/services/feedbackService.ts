import { Feedback, Turno } from "@/domain";

import { delay } from "./apiClient";
import { getTurnosEnMemoria } from "./turnoService";

// Estado en memoria hasta que exista backend real.
let feedbacks: Feedback[] = [];

/**
 * Regla de negocio #6 (CLAUDE.md §10): solo se puede opinar sobre un turno real
 * cumplido. Devuelve los turnos completados del paciente que todavía no calificó.
 */
export async function listTurnosParaCalificar(pacienteId: string): Promise<Turno[]> {
  const calificados = new Set(feedbacks.map((f) => f.turnoId));
  return delay(
    getTurnosEnMemoria()
      .filter((t) => t.pacienteId === pacienteId && t.estado === "completado" && !calificados.has(t.id))
      .sort((a, b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`)),
  );
}

export async function getTurnoParaCalificar(pacienteId: string, turnoId: string): Promise<Turno | undefined> {
  return (await listTurnosParaCalificar(pacienteId)).find((t) => t.id === turnoId);
}

export async function listFeedbackPaciente(pacienteId: string): Promise<Feedback[]> {
  return delay(feedbacks.filter((f) => f.pacienteId === pacienteId).sort((a, b) => b.fecha.localeCompare(a.fecha)));
}

export type DatosFeedback = Pick<Feedback, "estrellas" | "criterios" | "comentario">;

export async function crearFeedback(pacienteId: string, turnoId: string, datos: DatosFeedback): Promise<Feedback> {
  const turno = await getTurnoParaCalificar(pacienteId, turnoId);
  if (!turno) throw new Error("Solo podés calificar turnos cumplidos que todavía no calificaste.");
  const fueraDeRango = Object.values(datos.criterios).some((v) => v < 1 || v > 5);
  if (fueraDeRango) throw new Error("Calificá todos los criterios.");

  const ahora = new Date();
  const feedback: Feedback = {
    id: `feedback-${ahora.getTime()}`,
    turnoId,
    pacienteId,
    medicoId: turno.medicoId,
    estrellas: datos.estrellas,
    criterios: datos.criterios,
    comentario: datos.comentario?.trim() || undefined,
    fecha: ahora.toISOString().slice(0, 10),
  };
  feedbacks = [...feedbacks, feedback];
  return delay(feedback);
}
