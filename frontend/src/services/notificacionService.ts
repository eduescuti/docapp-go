import { Notificacion } from "@/domain";

import { api } from "./apiClient";

// Las genera el backend cuando pasa algo (turno confirmado o rechazado, nueva orden o receta, resultado listo).

/** Las del paciente de la sesión, de la más nueva a la más vieja. */
export async function listNotificacionesPaciente(_pacienteId: string): Promise<Notificacion[]> {
  return api<Notificacion[]>("/api/notificaciones");
}

export async function marcarNotificacionLeida(notificacionId: string): Promise<void> {
  await api<void>(`/api/notificaciones/${encodeURIComponent(notificacionId)}`, { metodo: "PATCH", cuerpo: { leida: true } });
}

export async function marcarTodasLeidas(_pacienteId: string): Promise<void> {
  await api<void>("/api/notificaciones", { metodo: "PATCH", cuerpo: { leida: true } });
}
