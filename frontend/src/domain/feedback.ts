export interface Feedback {
  id: string;
  turnoId: string;
  pacienteId: string;
  medicoId: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  comentario?: string;
  criterios: {
    puntualidad: number;
    atencion: number;
    trato: number;
    claridadExplicacion: number;
    experienciaGeneral: number;
  };
  fecha: string;
}
