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
 * Consulta el formulario oficial del Padrón Nacional REFEPS (Argentina.gob.ar)
 * usando los parámetros provistos en el cURL.
 */
/**
 * Consulta el padrón de REFEPS simulando el flujo completo de navegación.
 */
async function consultarRefepsEnLinea(matricula: string): Promise<string> {
  const URL_BUSCADOR = "https://www.argentina.gob.ar/salud/buscador-nacional-de-profesionales-de-la-salud";

  // 1. Obtener la página inicial para extraer el form_build_id generado por Drupal
  const getRes = await fetch(URL_BUSCADOR, {
    method: "GET",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    },
  });

  if (!getRes.ok) {
    throw new Error(`No se pudo cargar el formulario inicial (${getRes.status})`);
  }

  const initialHtml = await getRes.text();

  // Extrae el form_build_id del formulario HTML
  const matchBuildId = initialHtml.match(/name="form_build_id"\s+value="([^"]+)"/i);
  const formBuildId = matchBuildId ? matchBuildId[1] : "";

  // 2. Armar el payload idéntico al cURL incluyendo el token de sesión si existe
  const params = new URLSearchParams();
  params.append("searchBy", "matricula");
  params.append("matricula", matricula.trim());
  params.append("form_id", "argobar_consulta_refeps_profesionales");
  params.append("op", "Consultar");
  if (formBuildId) {
    params.append("form_build_id", formBuildId);
  }

  // 3. Ejecutar la consulta POST
  const postRes = await fetch(URL_BUSCADOR, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Origin: "https://www.argentina.gob.ar",
      Referer: URL_BUSCADOR,
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    body: params.toString(),
  });

  if (!postRes.ok) {
    throw new Error(`Respuesta inválida de REFEPS (${postRes.status})`);
  }

  return await postRes.text();
}

/**
 * Extrae los datos del HTML devuelto por Drupal/REFEPS.
 */
/**
 * Extrae todas las filas de resultados de la tabla REFEPS y encuentra
 * al profesional que coincida con la terna (DNI / Profesión / Matrícula).
 */
function parsearRespuestaRefeps(
  html: string,
  dniBuscado: string,
  matriculaBuscada: string,
  profesionBuscada: string
): ProfesionalPadron | null {
  const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  // 1. Extraer todas las filas de la tabla
  const filas = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const listaProfesionales: ProfesionalPadron[] = [];

  for (const filaMatch of filas) {
    const filaHtml = filaMatch[1];
    const celdas = [...filaHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => strip(m[1]));

    // Solo procesamos filas de datos que tengan al menos 4 columnas
    if (celdas.length < 4) continue;

    const apellido = celdas[0] || "";
    const nombre = celdas[1] || "";
    const dni = celdas[2] || "";
    const detalleMatricula = celdas[3] || ""; // Ej: "Médico - 84831 - CABA"

    // Desglosar "Profesión - Matrícula - Jurisdicción"
    const partes = detalleMatricula.split("-").map((p) => p.trim());
    const profesion = partes[0] || profesionBuscada;
    const matricula = partes[1] || matriculaBuscada;
    const provincia = partes[2] || "Nacional";

    listaProfesionales.push({
      dni,
      matricula,
      nombre,
      apellido,
      profesion,
      estadoMatricula: "Habilitada",
      provincia,
      emisor: "Ministerio de Salud de la Nación (REFEPS)",
      codigoProfesional: `REF-${matricula}`,
      especializaciones: [],
      activo: true,
    });
  }

  if (listaProfesionales.length === 0) return null;

  // 2. Buscar la coincidencia exacta de la terna: DNI + Profesión
  const dniLimpio = normalizarDni(dniBuscado);
  const profesionalExacto = listaProfesionales.find((p) => {
    const coincideDni = normalizarDni(p.dni) === dniLimpio;
    const coincideProfesion =
      p.profesion.toLowerCase().includes(profesionBuscada.toLowerCase()) ||
      profesionBuscada.toLowerCase().includes(p.profesion.toLowerCase());

    return coincideDni && coincideProfesion;
  });

  // Si encontró a la persona exacta (Fila 2: Martín de Anchorena), la devuelve
  if (profesionalExacto) return profesionalExacto;

  // Si el DNI no coincide con ninguno, pero hay uno con esa profesión, lo devuelve para que verificarProfesional tire el error adecuado
  const coincidentePorProfesion = listaProfesionales.find((p) =>
    p.profesion.toLowerCase().includes(profesionBuscada.toLowerCase())
  );

  return coincidentePorProfesion ?? listaProfesionales[0];
}

/**
 * Busca en el padrón la terna DNI + matrícula + profesión.
 * 1. Primero intenta consultar en vivo el endpoint oficial de REFEPS (cURL).
 * 2. Si falla la red o no encuentra en línea, recurre a `padronProfesionalesMock` para no trabar pruebas.
 */
export async function verificarProfesional(datos: DatosRegistroMedico): Promise<ProfesionalPadron> {
  const dni = normalizarDni(datos.dni);
  const matricula = datos.matricula.trim();

  if (!esDniValido(dni)) throw new Error("Ingresá un DNI válido (7 u 8 dígitos).");
  if (!esPasswordValida(datos.password)) throw new Error("La contraseña no cumple los requisitos de seguridad.");

  if (existeCuenta(dni)) {
    throw new Error("Ya existe una cuenta con ese DNI. Iniciá sesión.");
  }

  let profesional: ProfesionalPadron | null = null;

  // 1. Intento de validación real en línea contra el endpoint REFEPS
  try {
    const html = await consultarRefepsEnLinea(matricula);
    // Ahora le pasamos datos.profesion para que elija el registro correcto entre los 5
    profesional = parsearRespuestaRefeps(html, dni, matricula, datos.profesion);
  } catch (errRed) {
    console.warn("No se pudo conectar a REFEPS en línea, verificando en padrón local:", errRed);
  }

  // 2. Si el servicio online no devolvió o dio error, busca en el mock local
  if (!profesional) {
    profesional =
      padronProfesionalesMock.find(
        (p) =>
          p.dni === dni &&
          p.matricula === matricula &&
          p.profesion.toLowerCase() === datos.profesion.toLowerCase(),
      ) ?? null;
  }

  // 3. Verificaciones de reglas de negocio sobre la terna (DNI + Matrícula + Profesión)
  if (!profesional) {
    throw new Error("No encontramos un profesional con ese DNI, matrícula y profesión en el padrón nacional.");
  }

  // Validación 1: Profesión
  const coincideProfesion =
    profesional.profesion.toLowerCase().includes(datos.profesion.toLowerCase()) ||
    datos.profesion.toLowerCase().includes(profesional.profesion.toLowerCase());

  if (!coincideProfesion) {
    throw new Error(
      `La matrícula ${matricula} figura registrada como "${profesional.profesion}", no como "${datos.profesion}".`
    );
  }

  // Validación 2: Titularidad del DNI
  if (normalizarDni(profesional.dni) !== dni) {
    throw new Error(
      `La matrícula ${matricula} para la profesión "${profesional.profesion}" no pertenece al DNI ingresado.`
    );
  }

  // Validación 3: Estado de la habilitación
  if (!profesional.activo || !profesional.estadoMatricula.toLowerCase().startsWith("habilitada")) {
    throw new Error(`La matrícula figura como "${profesional.estadoMatricula}". No se puede crear la cuenta.`);
  }

  await delay(null, 300);
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
