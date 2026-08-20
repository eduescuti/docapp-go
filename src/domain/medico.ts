export interface HorarioAtencion {
  diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo
  horaInicio: string; // "09:00"
  horaFin: string; // "13:00"
  sedeId: string;
}

export interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  matricula: string;
  especialidadId: string;
  subespecialidad?: string;
  institucionesIds: string[];
  sedesIds: string[];
  planesAceptadosIds: string[];
  horarios: HorarioAtencion[];
  valoracion: number;
  cantidadValoraciones: number;
  aniosExperiencia: number;
  descripcion: string;
  avatarUrl?: string;
}
