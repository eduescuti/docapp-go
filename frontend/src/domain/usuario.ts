import type { Genero } from "./medico";

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

/**
 * Datos que pide el registro de paciente. DNI, nombre y apellido no se escriben: salen del código PDF417 del DNI,
 * que se escanea con la cámara (verificación de identidad, decidido el 28/10/2026).
 */
export interface DatosRegistroPaciente {
  /** Texto del código del DNI, tal cual lo leyó la cámara. El backend lo vuelve a leer y lo valida. */
  codigoDni: string;
  password: string;
  planMedicoId: string;
}

/** Lo que devuelve el backend al leer el código del DNI: lo justo para mostrar y completar el formulario. */
export interface DniLeido {
  dni: string;
  nombre: string;
  apellido: string;
}

/** Datos que pide el registro de profesional: la terna DNI + matrícula + profesión se valida contra el padrón. */
export interface DatosRegistroMedico {
  dni: string;
  matricula: string;
  profesion: string;
  password: string;
}

/** Lo que además se pide para crear la cuenta del profesional (decidido el 27/10/2026). */
export interface DatosCuentaMedico extends DatosRegistroMedico {
  /** Código del DNI escaneado: tiene que ser de la misma persona que la ficha del padrón. */
  codigoDni: string;
  /** Define "Dr." / "Dra.". */
  genero: Genero;
  especialidadId: string;
}
