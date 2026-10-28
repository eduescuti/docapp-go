import type { CoberturaAceptada } from "./cobertura";

/** 0 = domingo … 6 = sábado, como `Date.getDay()`. */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Franja de atención: el profesional atiende en ese lugar ese día de la semana, de `desde` a `hasta`. La
 * carga él en su Agenda; dentro de cada franja se ofrecen turnos de 30 min (decidido el 27/10/2026).
 */
export interface FranjaAtencion {
  id: string;
  medicoId: string;
  sedeId: string;
  diaSemana: DiaSemana;
  /** "HH:mm", múltiplo de 30 min. */
  desde: string;
  /** "HH:mm", mayor que `desde`. */
  hasta: string;
}

/** Define el título con el que se muestra al profesional ("Dr." / "Dra."). */
export type Genero = "femenino" | "masculino";

export interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  genero: Genero;
  matricula: string;
  /** Profesión de la salud según el padrón ("Médico", "Enfermero", ...). No todos son médicos. */
  profesion: string;
  especialidadId: string;
  subespecialidad?: string;
  institucionesIds: string[];
  sedesIds: string[];
  /** Coberturas que atiende. Las elige él en su Perfil (regla 17). Los horarios son sus franjas (`FranjaAtencion`). */
  coberturas: CoberturaAceptada[];
  valoracion: number;
  cantidadValoraciones: number;
  aniosExperiencia: number;
  descripcion: string;
  /** Foto de perfil (`/api/fotos/...`, la completa `urlDeLaApi`). La carga él en su Perfil y la ven todos los pacientes. */
  avatarUrl?: string;
}
