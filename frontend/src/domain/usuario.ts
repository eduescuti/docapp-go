/** Roles de la app (CLAUDE.md §6). El id "doctor" coincide con el grupo de rutas `app/(doctor)`. */
export type Rol = "paciente" | "doctor" | "admin";

/**
 * Sesión activa. Es una unión discriminada por `rol` para que TypeScript obligue
 * a que un paciente tenga `pacienteId` y un profesional tenga `medicoId`.
 */
interface SesionBase {
  dni: string;
  nombreCompleto: string;
  /** Momento de inicio de sesión, ISO "2026-10-03T14:30". */
  iniciadaEn: string;
}

export type Sesion =
  | (SesionBase & { rol: "paciente"; pacienteId: string })
  | (SesionBase & { rol: "doctor"; medicoId: string })
  | (SesionBase & { rol: "admin" });

/** Datos que pide el registro de paciente (Sprint 1). */
export interface DatosRegistroPaciente {
  nombre: string;
  apellido: string;
  dni: string;
  password: string;
  planMedicoId: string;
}

/** Datos que pide el registro de profesional: la terna DNI + matrícula + profesión se valida contra el padrón. */
export interface DatosRegistroMedico {
  dni: string;
  matricula: string;
  profesion: string;
  password: string;
}
