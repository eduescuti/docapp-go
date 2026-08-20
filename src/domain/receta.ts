export interface Receta {
  id: string;
  medicoId: string;
  pacienteId: string;
  fecha: string;
  medicacion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones?: string;
  observaciones?: string;
}
