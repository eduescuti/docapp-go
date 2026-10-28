export interface Feedback {
  id: string;
  turnoId: string;
  pacienteId: string;
  medicoId: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  comentario?: string;
  /** Opcionales: solo "¿Cómo fue tu consulta?" (`estrellas`) es obligatoria (decidido el 28/10/2026). */
  criterios: {
    puntualidad?: number;
    atencion?: number;
    trato?: number;
    claridadExplicacion?: number;
    experienciaGeneral?: number;
  };
  fecha: string;
}
