import { Paciente } from "@/domain";

import { api } from "./apiClient";
import { getSesionActual } from "./authService";
import { listAgendaMedico } from "./turnoService";

/**
 * El paciente de la sesión (`GET /api/pacientes/yo`). Se pide una vez y queda en memoria: las pantallas lo usan
 * para armar el resto de los pedidos y no tienen que esperarlo cada vez. Si cambia la sesión, se vuelve a pedir.
 */
let pacienteActual: Paciente | null = null;
let pedido: Promise<Paciente> | null = null;

export async function getPacienteActual(): Promise<Paciente> {
  const sesion = getSesionActual();
  if (sesion?.rol !== "paciente") throw new Error("No hay paciente autenticado");
  if (pacienteActual?.id === sesion.pacienteId) return pacienteActual;
  pedido ??= api<Paciente>("/api/pacientes/yo")
    .then((p) => (pacienteActual = p))
    .finally(() => {
      pedido = null;
    });
  return pedido;
}

const actualizar = (p: Paciente) => (pacienteActual = p);

/** Después de cambiar la foto de perfil (`fotoPerfil.ts`), el paciente en memoria queda con la nueva. */
export function actualizarFotoPacienteActual(avatarUrl: string | undefined): void {
  const sesion = getSesionActual();
  if (!pacienteActual || sesion?.rol !== "paciente" || pacienteActual.id !== sesion.pacienteId) return;
  const { avatarUrl: _anterior, ...resto } = pacienteActual;
  pacienteActual = avatarUrl ? { ...resto, avatarUrl } : resto;
}

/**
 * Un paciente que el usuario de la sesión puede ver: el propio paciente, o uno que el profesional tiene en su
 * agenda (el vínculo es por turnos; si no hay, `undefined`).
 */
export async function getPaciente(id: string): Promise<Paciente | undefined> {
  const sesion = getSesionActual();
  if (sesion?.rol === "paciente") {
    const yo = await getPacienteActual();
    return yo.id === id ? yo : undefined;
  }
  if (sesion?.rol === "doctor") return (await listAgendaMedico(sesion.medicoId)).find((t) => t.paciente?.id === id)?.paciente;
  return undefined;
}

/** Cambio de obra social/plan. Cambia lo que el paciente ve en toda la app (filtro transversal, CLAUDE.md §5). */
export async function cambiarCobertura(_pacienteId: string, planMedicoId: string): Promise<Paciente> {
  if (!planMedicoId) throw new Error("Elegí tu obra social y tu plan.");
  return actualizar(await api<Paciente>("/api/pacientes/yo", { metodo: "PATCH", cuerpo: { planMedicoId } }));
}

const favorito = async (tipo: "medicos" | "instituciones", id: string, marcar: boolean) =>
  actualizar(await api<Paciente>(`/api/pacientes/yo/favoritos/${tipo}/${encodeURIComponent(id)}`, { metodo: marcar ? "PUT" : "DELETE" }));

export async function quitarMedicoFavorito(_pacienteId: string, medicoId: string): Promise<Paciente> {
  return favorito("medicos", medicoId, false);
}

/** Marca o desmarca una institución como favorita. La favorita queda de opción por defecto al reservar un turno. */
export async function alternarInstitucionFavorita(_pacienteId: string, institucionId: string): Promise<Paciente> {
  const paciente = await getPacienteActual();
  return favorito("instituciones", institucionId, !paciente.institucionesFavoritasIds.includes(institucionId));
}

export async function quitarInstitucionFavorita(_pacienteId: string, institucionId: string): Promise<Paciente> {
  return favorito("instituciones", institucionId, false);
}

/** Alterna (agrega o quita) un médico en la lista de favoritos del paciente actual. Devuelve si quedó favorito. */
export async function alternarMedicoFavorito(medicoId: string): Promise<boolean> {
  const paciente = await getPacienteActual();
  const esFavorito = paciente.medicosFavoritosIds.includes(medicoId);
  await favorito("medicos", medicoId, !esFavorito);
  return !esFavorito;
}

/** Consulta si un médico está marcado como favorito por el paciente actual. */
export async function esMedicoFavorito(medicoId: string): Promise<boolean> {
  try {
    const paciente = await getPacienteActual();
    return paciente.medicosFavoritosIds.includes(medicoId);
  } catch {
    return false;
  }
}
