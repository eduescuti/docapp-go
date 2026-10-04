import { NotaPaciente } from "@/domain";
import { notasPacienteMock } from "@/mocks";

import { delay } from "./apiClient";

// Estado en memoria hasta que exista backend real.
let notas: NotaPaciente[] = [...notasPacienteMock];

/** Las notas son privadas del profesional que las escribió (CLAUDE.md §10, reglas 7 y 8). */
export async function listNotasPaciente(medicoId: string, pacienteId: string): Promise<NotaPaciente[]> {
  return delay(
    notas
      .filter((n) => n.medicoId === medicoId && n.pacienteId === pacienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
  );
}

export async function crearNotaPaciente(medicoId: string, pacienteId: string, texto: string): Promise<NotaPaciente> {
  const limpio = texto.trim();
  if (!limpio) throw new Error("La nota no puede estar vacía.");
  const ahora = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const nota: NotaPaciente = {
    id: `nota-${ahora.getTime()}`,
    medicoId,
    pacienteId,
    fecha: `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`,
    texto: limpio,
  };
  notas = [...notas, nota];
  return delay(nota);
}
