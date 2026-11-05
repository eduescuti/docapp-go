/** Largo mínimo de contraseña para registrarse (regla definida en el Sprint 1). */
export const PASSWORD_MIN_LENGTH = 8;

export interface ReglasPassword {
  largo: boolean;
  mayuscula: boolean;
  numero: boolean;
  especial: boolean;
}

/** Evalúa cada regla por separado para poder mostrarlas como checklist en vivo. */
export function evaluarPassword(password: string): ReglasPassword {
  return {
    largo: password.length >= PASSWORD_MIN_LENGTH,
    mayuscula: /[A-ZÁÉÍÓÚÑ]/.test(password),
    numero: /\d/.test(password),
    especial: /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(password),
  };
}

export function esPasswordValida(password: string): boolean {
  return Object.values(evaluarPassword(password)).every(Boolean);
}

/** Saca puntos y espacios: "12.345.678" -> "12345678". */
export function normalizarDni(dni: string): string {
  return dni.replace(/[.\s]/g, "");
}

/** El mensaje de un DNI con formato inválido: es el mismo que responde el backend. */
export const ERROR_DNI = "Ingresá un DNI válido (7 u 8 dígitos).";

/** DNI argentino: 7 u 8 dígitos. */
export function esDniValido(dni: string): boolean {
  return /^\d{7,8}$/.test(normalizarDni(dni));
}

/** Largo máximo de la matrícula: el mismo que acepta el backend. */
export const MATRICULA_MAX_LENGTH = 30;

export const ERROR_MATRICULA = "La matrícula tiene que ser un número.";

/** Matrícula del profesional: solo dígitos, sin letras, puntos ni espacios en el medio. */
export function esMatriculaValida(matricula: string): boolean {
  return new RegExp(`^\\d{1,${MATRICULA_MAX_LENGTH}}$`).test(matricula.trim());
}
