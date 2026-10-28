import { DatosCuentaMedico, DatosRegistroMedico, DatosRegistroPaciente, DniLeido, ProfesionalPadron, Sesion } from "@/domain";
import { esDniValido, esPasswordValida, normalizarDni } from "@/utils/validation";

import { api } from "./apiClient";
import { borrarToken, cargarTokenGuardado, guardarToken } from "./tokenSesion";

/**
 * Sesión contra el backend (`docs/05-sesiones-y-tokens.md`): el login devuelve un token que se guarda en el
 * teléfono y viaja en cada pedido. La sesión queda iniciada hasta que el usuario la cierre o pasen 90 días sin
 * usar la app.
 */

// La sesión de quien usa la app, ya validada por el backend. Los services la leen sin esperar.
let sesionActual: Sesion | null = null;

export function getSesionActual(): Sesion | null {
  return sesionActual;
}

/** Lo que devuelven el login y los registros. */
interface RespuestaIngreso {
  token: string;
  expiraEn: string;
  sesion: Sesion;
}

async function entrar(respuesta: RespuestaIngreso): Promise<Sesion> {
  await guardarToken(respuesta.token);
  sesionActual = respuesta.sesion;
  return respuesta.sesion;
}

/** Regla 11: login único con DNI + contraseña; el rol lo determina la cuenta. */
export async function iniciarSesion(dni: string, password: string): Promise<Sesion> {
  return entrar(await api<RespuestaIngreso>("/api/auth/login", { metodo: "POST", cuerpo: { dni: dni.trim(), password }, conSesion: false }));
}

/** ¿Quedó guardado en el teléfono el token de una sesión anterior? */
export async function hayTokenGuardado(): Promise<boolean> {
  return (await cargarTokenGuardado()) !== null;
}

/**
 * Retoma la sesión guardada en el teléfono (al abrir la app, o después de la huella): el backend confirma que el
 * token sigue valiendo. Si venció, el cliente borra el token y hay que entrar con la contraseña.
 */
export async function restaurarSesion(): Promise<Sesion> {
  if (!(await cargarTokenGuardado())) throw new Error("Iniciá sesión con tu DNI y tu contraseña.");
  sesionActual = await api<Sesion>("/api/sesion");
  return sesionActual;
}

/** Cierra la sesión en el backend (revoca el token) y la borra del teléfono. */
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

/** Cambia la contraseña de la cuenta en sesión. El backend corta las otras sesiones de esa cuenta. */
export async function cambiarPassword(actual: string, nueva: string): Promise<void> {
  if (!esPasswordValida(nueva)) throw new Error("La nueva contraseña no cumple los requisitos de seguridad.");
  if (nueva === actual) throw new Error("La nueva contraseña tiene que ser distinta de la actual.");
  await api<void>("/api/auth/contrasena", { metodo: "PATCH", cuerpo: { actual, nueva } });
}

/** Ficha de prueba del padrón: sus datos son los placeholders del registro de profesional (USUARIOS-DE-PRUEBA.md). */
const EJEMPLO_REGISTRO_PROFESIONAL = { dni: "40123456", matricula: "154321", profesion: "Kinesiólogo" };

export function getEjemploRegistroProfesional(): Pick<ProfesionalPadron, "dni" | "matricula" | "profesion"> {
  return EJEMPLO_REGISTRO_PROFESIONAL;
}

/** Profesiones disponibles para el registro, tomadas del padrón (no hardcodeadas en la pantalla). */
export async function listProfesiones(): Promise<string[]> {
  return api<string[]>("/api/profesiones", { conSesion: false });
}

/** Lo que se puede revisar sin ir al servidor: así el error aparece al instante. */
function validarDatosProfesional(datos: DatosRegistroMedico): void {
  if (!esDniValido(datos.dni)) throw new Error("Ingresá un DNI válido (7 u 8 dígitos).");
  if (!esPasswordValida(datos.password)) throw new Error("La contraseña no cumple los requisitos de seguridad.");
}

/**
 * Regla 13: busca la terna DNI + matrícula + profesión en el padrón (el backend mira su copia del padrón y, si
 * no está, el buscador nacional REFEPS en línea).
 */
export async function verificarProfesional(datos: DatosRegistroMedico): Promise<ProfesionalPadron> {
  validarDatosProfesional(datos);
  return api<ProfesionalPadron>("/api/auth/registro/profesional/verificar", {
    metodo: "POST",
    cuerpo: { dni: normalizarDni(datos.dni), matricula: datos.matricula.trim(), profesion: datos.profesion },
    conSesion: false,
  });
}

/** Crea la cuenta del profesional y entra directo. */
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
 * Verificación de identidad del registro: el backend lee el código PDF417 del DNI escaneado y devuelve DNI,
 * nombre y apellido (o avisa si ese DNI ya tiene cuenta). No guarda nada todavía. `POST /api/auth/registro/dni`.
 */
export async function leerDni(codigo: string): Promise<DniLeido> {
  return api<DniLeido>("/api/auth/registro/dni", { metodo: "POST", cuerpo: { codigo }, conSesion: false });
}

/** Regla 12: crea la cuenta del paciente (con el DNI escaneado) y entra directo. */
export async function registrarPaciente(datos: DatosRegistroPaciente): Promise<Sesion> {
  if (!datos.codigoDni) throw new Error("Escaneá tu DNI para verificar tu identidad.");
  if (!datos.planMedicoId) throw new Error("Elegí tu obra social y tu plan.");
  if (!esPasswordValida(datos.password)) throw new Error("La contraseña no cumple los requisitos de seguridad.");
  return entrar(
    await api<RespuestaIngreso>("/api/auth/registro/paciente", { metodo: "POST", cuerpo: datos, conSesion: false }),
  );
}
