import { Notificacion } from "@/domain";
import { notificacionesMock } from "@/mocks";

import { delay } from "./apiClient";

export async function listNotificacionesPaciente(pacienteId: string): Promise<Notificacion[]> {
  return delay(
    notificacionesMock
      .filter((n) => n.pacienteId === pacienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
  );
}
