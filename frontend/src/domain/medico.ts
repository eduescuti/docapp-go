export interface HorarioAtencion {
  diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo
  horaInicio: string; // "09:00"
  horaFin: string; // "13:00"
  sedeId: string;
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
  planesAceptadosIds: string[];
  /**
   * Bloques de atención con los que el service arma los turnos libres. No se muestran en el perfil: con
   * backend, la disponibilidad la resuelven los turnos (Sprint 2).
   */
  horarios: HorarioAtencion[];
  valoracion: number;
  cantidadValoraciones: number;
  aniosExperiencia: number;
  descripcion: string;
  avatarUrl?: string;
}
