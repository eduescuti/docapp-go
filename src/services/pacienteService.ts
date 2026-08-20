import { Paciente } from "@/domain";
import { pacienteActualId, pacientesMock } from "@/mocks";

import { delay } from "./apiClient";

export async function getPacienteActual(): Promise<Paciente> {
  const paciente = pacientesMock.find((p) => p.id === pacienteActualId);
  if (!paciente) throw new Error("No hay paciente autenticado");
  return delay(paciente);
}
