import { DatosRegistroMedico, DatosRegistroPaciente, ProfesionalPadron, Sesion } from "@/domain";
import { DNI_DEMO_REGISTRO, medicosMock, pacientesMock, padronProfesionalesMock, usuariosMock } from "@/mocks";
import { format } from "date-fns";

import { esDniValido, esPasswordValida, normalizarDni } from "@/utils/validation";

import { delay } from "./apiClient";

/**
 * "Backend de ejemplo" del Sprint 1: valida credenciales contra cuentas
 * hardcodeadas en `mocks/usuarios.ts`. Cuando exista el backend real solo cambia
 * la implementación de estas funciones, no su firma (CLAUDE.md §4).
 */

// Sesión en memoria: no persiste al cerrar la app (persistencia segura pendiente, CLAUDE.md §11).
let sesionActual: Sesion | null = null;

// Copia en memoria de las cuentas: permite cambiar la contraseña durante la sesión.
let usuarios = usuariosMock.map((u) => ({ ...u }));

export function getSesionActual(): Sesion | null {
  return sesionActual;
}

const ERROR_CREDENCIALES = "DNI o contraseña incorrectos.";

export async function iniciarSesion(dni: string, password: string): Promise<Sesion> {
  const usuario = usuarios.find((u) => u.dni === normalizarDni(dni.trim()));
  // Mismo mensaje para DNI inexistente y contraseña errónea: no revela qué cuentas existen.
  if (!usuario || usuario.password !== password) {
    await delay(null, 400);
    throw new Error(ERROR_CREDENCIALES);
  }

  const iniciadaEn = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  let sesion: Sesion;
  if (usuario.rol === "admin") {
    sesion = { rol: "admin", dni: usuario.dni, nombreCompleto: "Administrador", iniciadaEn };
  } else if (usuario.rol === "paciente") {
    const paciente = pacientesMock.find((p) => p.id === usuario.pacienteId);
    if (!paciente) throw new Error(ERROR_CREDENCIALES);
    sesion = {
      rol: "paciente",
      dni: usuario.dni,
      nombreCompleto: `${paciente.nombre} ${paciente.apellido}`,
      pacienteId: paciente.id,
      iniciadaEn,
    };
  } else {
    const medico = medicosMock.find((m) => m.id === usuario.medicoId);
    if (!medico) throw new Error(ERROR_CREDENCIALES);
    sesion = {
      rol: "doctor",
      dni: usuario.dni,
      nombreCompleto: `${medico.nombre} ${medico.apellido}`,
      medicoId: medico.id,
      iniciadaEn,
    };
  }

  sesionActual = sesion;
  return delay(sesion, 400);
}

/**
 * Inicia sesión tras una autenticación biométrica exitosa en el dispositivo.
 * No requiere contraseña porque la identidad ya fue validada por el hardware local.
 */
export async function iniciarSesionBiometrica(dni: string): Promise<Sesion> {
  const usuario = usuarios.find((u) => u.dni === normalizarDni(dni.trim()));
  if (!usuario) {
    await delay(null, 300);
    throw new Error("No se encontró una cuenta asociada a este DNI.");
  }

  const iniciadaEn = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  let sesion: Sesion;

  if (usuario.rol === "admin") {
    sesion = { rol: "admin", dni: usuario.dni, nombreCompleto: "Administrador", iniciadaEn };
  } else if (usuario.rol === "paciente") {
    const paciente = pacientesMock.find((p) => p.id === usuario.pacienteId);
    if (!paciente) throw new Error(ERROR_CREDENCIALES);
    sesion = {
      rol: "paciente",
      dni: usuario.dni,
      nombreCompleto: `${paciente.nombre} ${paciente.apellido}`,
      pacienteId: paciente.id,
      iniciadaEn,
    };
  } else {
    const medico = medicosMock.find((m) => m.id === usuario.medicoId);
    if (!medico) throw new Error(ERROR_CREDENCIALES);
    sesion = {
      rol: "doctor",
      dni: usuario.dni,
      nombreCompleto: `${medico.nombre} ${medico.apellido}`,
      medicoId: medico.id,
      iniciadaEn,
    };
  }

  sesionActual = sesion;
  return delay(sesion, 300);
}

export function cerrarSesion(): void {
  sesionActual = null;
}

function existeCuenta(dni: string): boolean {
  return usuarios.some((u) => u.dni === dni);
}

/** Cambia la contraseña de la cuenta en sesión. La nueva tiene que cumplir las reglas de seguridad. */
export async function cambiarPassword(actual: string, nueva: string): Promise<void> {
  const sesion = sesionActual;
  if (!sesion) throw new Error("No hay una sesión activa.");
  const usuario = usuarios.find((u) => u.dni === sesion.dni);
  await delay(null, 400);
  if (!usuario || usuario.password !== actual) throw new Error("La contraseña actual no es correcta.");
  if (!esPasswordValida(nueva)) throw new Error("La nueva contraseña no cumple los requisitos de seguridad.");
  if (nueva === actual) throw new Error("La nueva contraseña tiene que ser distinta de la actual.");
  usuarios = usuarios.map((u) => (u.dni === usuario.dni ? { ...u, password: nueva } : u));
}

/**
 * La creación de cuentas se habilita cuando exista la base de datos. Mientras tanto el
 * registro valida todo y llega hasta el último paso, pero no deja crear la cuenta.
 */
export const REGISTRO_HABILITADO = false;

/** Datos de ejemplo para el registro de profesional (se muestran como placeholders en la demo). */
export function getEjemploRegistroProfesional(): Pick<ProfesionalPadron, "dni" | "matricula" | "profesion"> {
  const demo = padronProfesionalesMock.find((p) => p.dni === DNI_DEMO_REGISTRO);
  return { dni: demo?.dni ?? "", matricula: demo?.matricula ?? "", profesion: demo?.profesion ?? "" };
}

/** Profesiones disponibles para el registro, tomadas del padrón (no hardcodeadas en la pantalla). */
export async function listProfesiones(): Promise<string[]> {
  const profesiones = Array.from(new Set(padronProfesionalesMock.map((p) => p.profesion)));
  return delay(profesiones.sort((a, b) => a.localeCompare(b)));
}

/**
 * Busca en el padrón la terna DNI + matrícula + profesión. Solo se puede crear la
 * cuenta si existe esa combinación, la matrícula está habilitada y la contraseña
 * cumple las reglas de seguridad.
 */
export async function verificarProfesional(datos: DatosRegistroMedico): Promise<ProfesionalPadron> {
  const dni = normalizarDni(datos.dni);
  const matricula = datos.matricula.trim();

  if (!esDniValido(dni)) throw new Error("Ingresá un DNI válido (7 u 8 dígitos).");
  if (!esPasswordValida(datos.password)) throw new Error("La contraseña no cumple los requisitos de seguridad.");

  const profesional = padronProfesionalesMock.find(
    (p) =>
      p.dni === dni &&
      p.matricula === matricula &&
      p.profesion.toLowerCase() === datos.profesion.toLowerCase(),
  );
  await delay(null, 600);

  if (!profesional) {
    throw new Error("No encontramos un profesional con ese DNI, matrícula y profesión en el padrón nacional.");
  }
  if (!profesional.activo || !profesional.estadoMatricula.toLowerCase().startsWith("habilitada")) {
    throw new Error(`La matrícula figura como "${profesional.estadoMatricula}". No se puede crear la cuenta.`);
  }
  if (existeCuenta(dni)) {
    throw new Error("Ya existe una cuenta con ese DNI. Iniciá sesión.");
  }
  return profesional;
}

/** Sprint 1: valida los datos pero todavía no guarda la cuenta (no hay base de datos). */
export async function registrarMedico(datos: DatosRegistroMedico): Promise<void> {
  await verificarProfesional(datos);
  return delay(undefined, 400);
}

/** Sprint 1: valida los datos pero todavía no guarda la cuenta (no hay base de datos). */
export async function registrarPaciente(datos: DatosRegistroPaciente): Promise<void> {
  const dni = normalizarDni(datos.dni);
  if (!datos.nombre.trim() || !datos.apellido.trim()) throw new Error("Completá nombre y apellido.");
  if (!esDniValido(dni)) throw new Error("Ingresá un DNI válido (7 u 8 dígitos).");
  if (!datos.planMedicoId) throw new Error("Elegí tu obra social o prepaga.");
  if (!esPasswordValida(datos.password)) throw new Error("La contraseña no cumple los requisitos de seguridad.");
  if (existeCuenta(dni) || pacientesMock.some((p) => p.dni === dni)) {
    throw new Error("Ya existe una cuenta con ese DNI. Iniciá sesión.");
  }
  return delay(undefined, 600);
}
