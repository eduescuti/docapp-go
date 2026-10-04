/**
 * Ficha de un profesional en el padrón nacional (formato del Buscador Nacional de
 * Profesionales de la Salud — argentina.gob.ar). Es la fuente contra la que se
 * verifica a un profesional antes de crearle una cuenta.
 */
export interface ProfesionalPadron {
  codigoProfesional: string;
  dni: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  /** Profesión tal como figura en el padrón ("Médico", "Enfermero", ...). */
  profesion: string;
  especializaciones: string[];
  emisor: string;
  provincia: string;
  matricula: string;
  estadoMatricula: string;
}
