import { NotaPaciente } from "@/domain";

import { api } from "./apiClient";

const ruta = (pacienteId: string) => `/api/medicos/yo/pacientes/${encodeURIComponent(pacienteId)}/notas`;

/** Las notas son privadas del profesional que las escribió (CLAUDE.md §10, reglas 7 y 8). La más nueva primero. */
export async function listNotasPaciente(_medicoId: string, pacienteId: string): Promise<NotaPaciente[]> {
  return api<NotaPaciente[]>(ruta(pacienteId));
}

export async function crearNotaPaciente(_medicoId: string, pacienteId: string, texto: string): Promise<NotaPaciente> {
  const limpio = texto.trim();
  if (!limpio) throw new Error("La nota no puede estar vacía.");
  return api<NotaPaciente>(ruta(pacienteId), { metodo: "POST", cuerpo: { texto: limpio } });
}
