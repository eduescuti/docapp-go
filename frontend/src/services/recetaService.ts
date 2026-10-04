import { Receta } from "@/domain";
import { recetasMock } from "@/mocks";

import { delay } from "./apiClient";

export async function listRecetasPaciente(pacienteId: string): Promise<Receta[]> {
  return delay(recetasMock.filter((r) => r.pacienteId === pacienteId));
}

/** Recetas que un profesional le emitió a un paciente (regla #7: siempre asociadas a quien las emitió). */
export async function listRecetasEmitidas(medicoId: string, pacienteId: string): Promise<Receta[]> {
  return delay(recetasMock.filter((r) => r.medicoId === medicoId && r.pacienteId === pacienteId));
}
