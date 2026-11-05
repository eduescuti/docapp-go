import { DatosCuentaMedico, DatosRegistroMedico, DatosRegistroPaciente, DniLeido, ProfesionalPadron, Sesion } from "@/domain";
import { ERROR_DNI, ERROR_MATRICULA, esDniValido, esMatriculaValida, esPasswordValida, normalizarDni } from "@/utils/validation";

import { api } from "../apiClient";
import { borrarToken, cargarTokenGuardado, guardarToken } from "./tokenSesion";

let sesionActual: Sesion | null = null;

export function getSesionActual(): Sesion | null {
  return sesionActual;
}

interface RespuestaIngreso {
  token: string;
  sesion: Sesion;
}

async function entrar(respuesta: RespuestaIngreso): Promise<Sesion> {
  await guardarToken(respuesta.token);
  sesionActual = respuesta.sesion;
  return respuesta.sesion;
}

/** Hace un POST con el DNI y la contraseña y entra con la sesión que devuelve. El rol lo determina la cuenta. */
export async function iniciarSesion(dni: string, password: string): Promise<Sesion> {
  return entrar(await api<RespuestaIngreso>("/api/auth/login", { metodo: "POST", cuerpo: { dni: normalizarDni(dni), password }, conSesion: false }));
}

/** Pregunta si quedó guardado en el teléfono el token de una sesión anterior */
export async function hayTokenGuardado(): Promise<boolean> {
  return (await cargarTokenGuardado()) !== null;
}

/**
 * Hace un GET de la sesión guardada en el teléfono (al abrir la app, o después de la huella)
 * 
 * - El backend confirma si el token sigue valiendo. Si venció, se borra el token y hay que entrar con la contraseña.
 */
export async function restaurarSesion(): Promise<Sesion> {

  // Validamos si hay token guardado
  if (!(await cargarTokenGuardado())) {
    throw new Error("Iniciá sesión con tu DNI y tu contraseña.");
  };

  return await api<Sesion>("/api/sesion");
}

/** Hace un POST que revoca el token en el backend y borra la sesión del teléfono, aunque no haya conexión. */
export async function cerrarSesion(): Promise<void> {
  try {
    await api<void>("/api/auth/logout", { metodo: "POST" });
  } catch {
    // Sin conexión igual se sale: el token se borra del teléfono y vence solo.
  }
  await borrarToken();
  sesionActual = null;
}

/** Olvida la sesión sin llamar al backend (cuando el backend ya dijo que venció). */
export function olvidarSesion(): void {
  sesionActual = null;
}

/** Hace un PATCH que cambia la contraseña de la cuenta en sesión. El backend corta las otras sesiones de esa cuenta. */
export async function cambiarPassword(actual: string, nueva: string): Promise<void> {

  if (!esPasswordValida(nueva)) {
    throw new Error("La nueva contraseña no cumple los requisitos de seguridad.");
  };

  if (nueva === actual) {
    throw new Error("La nueva contraseña tiene que ser distinta de la actual.");
  };

  await api<void>("/api/auth/contrasena", { metodo: "PATCH", cuerpo: { actual, nueva } });
}

/** Hace un GET de las profesiones del padrón, para el registro de profesional. */
export async function listProfesiones(): Promise<string[]> {
  return api<string[]>("/api/profesiones", { conSesion: false });
}

/** Valida antes de ir al backend si están bien los datos. */
function validarDatosProfesional(datos: DatosRegistroMedico): void {

  if (!esDniValido(datos.dni)) {
    throw new Error(ERROR_DNI);
  };

  if (!esMatriculaValida(datos.matricula)) {
    throw new Error(ERROR_MATRICULA);
  };

  if (!esPasswordValida(datos.password)) {
    throw new Error("La contraseña no cumple los requisitos de seguridad.");
  };
}

/**
 * Hace un POST que busca la terna DNI + matrícula + profesión en el padrón y devuelve la ficha (regla 13). El backend
 * mira su copia del padrón y, si no está, el buscador nacional REFEPS en línea.
 */
export async function verificarProfesional(datos: DatosRegistroMedico): Promise<ProfesionalPadron> {
  validarDatosProfesional(datos);
  return api<ProfesionalPadron>("/api/auth/registro/profesional/verificar", {
    metodo: "POST",
    cuerpo: { dni: normalizarDni(datos.dni), matricula: datos.matricula.trim(), profesion: datos.profesion },
    conSesion: false,
  });
}

/** Hace un POST que crea la cuenta del profesional y entra directo. */
export async function registrarMedico(datos: DatosCuentaMedico): Promise<Sesion> {
  validarDatosProfesional(datos);
  return entrar(
    await api<RespuestaIngreso>("/api/auth/registro/profesional", {
      metodo: "POST",
      cuerpo: { ...datos, dni: normalizarDni(datos.dni), matricula: datos.matricula.trim() },
      conSesion: false,
    }),
  );
}

/**
 * Hace un POST con el código PDF417 del DNI escaneado y devuelve DNI, nombre y apellido (o avisa si ese DNI ya tiene
 * cuenta). No guarda nada todavía.
 */
export async function leerDni(codigo: string): Promise<DniLeido> {
  return api<DniLeido>("/api/auth/registro/dni", { metodo: "POST", cuerpo: { codigo }, conSesion: false });
}

/** Hace un POST que crea la cuenta del paciente (con el DNI escaneado) y entra directo (regla 12). */
export async function registrarPaciente(datos: DatosRegistroPaciente): Promise<Sesion> {
  if (!datos.codigoDni) throw new Error("Escaneá tu DNI para verificar tu identidad.");
  if (!datos.planMedicoId) throw new Error("Elegí tu obra social y tu plan.");
  if (!esPasswordValida(datos.password)) throw new Error("La contraseña no cumple los requisitos de seguridad.");
  return entrar(
    await api<RespuestaIngreso>("/api/auth/registro/paciente", { metodo: "POST", cuerpo: datos, conSesion: false }),
  );
}
