import { Receta } from "@/domain";
import { recetasMock } from "@/mocks";

import { delay } from "./apiClient";

export async function listRecetasPaciente(pacienteId: string): Promise<Receta[]> {
  return delay(recetasMock.filter((r) => r.pacienteId === pacienteId));
}
