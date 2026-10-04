import { Notificacion } from "@/domain";
import { notificacionesMock } from "@/mocks";

import { delay } from "./apiClient";

// Estado en memoria: permite marcar notificaciones como leídas durante la sesión.
let notificaciones: Notificacion[] = notificacionesMock.map((n) => ({ ...n }));

export async function listNotificacionesPaciente(pacienteId: string): Promise<Notificacion[]> {
  return delay(
    notificaciones
      .filter((n) => n.pacienteId === pacienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
  );
}

export async function marcarNotificacionLeida(notificacionId: string): Promise<void> {
  notificaciones = notificaciones.map((n) => (n.id === notificacionId ? { ...n, leida: true } : n));
  return delay(undefined, 100);
}

export async function marcarTodasLeidas(pacienteId: string): Promise<void> {
  notificaciones = notificaciones.map((n) => (n.pacienteId === pacienteId ? { ...n, leida: true } : n));
  return delay(undefined, 100);
}
