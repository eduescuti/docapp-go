import { Paciente } from "@/domain";
import { pacientesMock } from "@/mocks";
import { hoyIso } from "@/utils/format";

import { delay } from "./apiClient";
import { getSesionActual } from "./authService";
import { getTurnosEnMemoria } from "./turnoService";

// Estado en memoria: el paciente puede editar sus datos durante la sesión.
let pacientes: Paciente[] = pacientesMock.map((p) => ({ ...p }));

export async function getPacienteActual(): Promise<Paciente> {
  const sesion = getSesionActual();
  if (sesion?.rol !== "paciente") throw new Error("No hay paciente autenticado");
  const paciente = pacientes.find((p) => p.id === sesion.pacienteId);
  if (!paciente) throw new Error("No hay paciente autenticado");
  return delay(paciente);
}

export async function getPaciente(id: string): Promise<Paciente | undefined> {
  return delay(pacientes.find((p) => p.id === id));
}

export async function listPacientes(): Promise<Paciente[]> {
  return delay(pacientes);
}

/**
 * Pacientes asignados a un profesional: los que tienen un turno próximo (pendiente,
 * confirmado o reprogramado) con él. Los que solo tuvieron turnos pasados no cuentan.
 */
export async function listPacientesAsignados(medicoId: string): Promise<Paciente[]> {
  const hoy = hoyIso();
  const ids = new Set(
    getTurnosEnMemoria()
      .filter((t) => t.medicoId === medicoId && t.fecha >= hoy)
      .filter((t) => t.estado !== "cancelado" && t.estado !== "completado")
      .map((t) => t.pacienteId),
  );
  return delay(pacientes.filter((p) => ids.has(p.id)));
}

function actualizar(id: string, cambios: Partial<Paciente>): Paciente {
  const actual = pacientes.find((p) => p.id === id);
  if (!actual) throw new Error("Paciente no encontrado");
  const nuevo = { ...actual, ...cambios };
  pacientes = pacientes.map((p) => (p.id === id ? nuevo : p));
  return nuevo;
}

/** Cambio de obra social/plan. Cambia lo que el paciente ve en toda la app (filtro transversal, CLAUDE.md §5). */
export async function cambiarCobertura(pacienteId: string, planMedicoId: string): Promise<Paciente> {
  if (!planMedicoId) throw new Error("Elegí tu obra social o prepaga.");
  return delay(actualizar(pacienteId, { planMedicoId }));
}

export async function quitarMedicoFavorito(pacienteId: string, medicoId: string): Promise<Paciente> {
  const paciente = pacientes.find((p) => p.id === pacienteId);
  if (!paciente) throw new Error("Paciente no encontrado");
  return delay(actualizar(pacienteId, { medicosFavoritosIds: paciente.medicosFavoritosIds.filter((id) => id !== medicoId) }));
}

export async function quitarInstitucionFavorita(pacienteId: string, institucionId: string): Promise<Paciente> {
  const paciente = pacientes.find((p) => p.id === pacienteId);
  if (!paciente) throw new Error("Paciente no encontrado");
  return delay(
    actualizar(pacienteId, {
      institucionesFavoritasIds: paciente.institucionesFavoritasIds.filter((id) => id !== institucionId),
    }),
  );
}
