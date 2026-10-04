import { PreguntaFrecuente } from "@/domain";
import { preguntasFrecuentesMock } from "@/mocks";

import { delay } from "./apiClient";

export async function listPreguntasFrecuentes(): Promise<PreguntaFrecuente[]> {
  return delay(preguntasFrecuentesMock);
}
