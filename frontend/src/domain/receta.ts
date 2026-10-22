export interface Receta {
  id: string;
  medicoId: string;
  pacienteId: string;
  fecha: string;
  medicacion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  /**
   * Último día en que se puede consumir ("yyyy-MM-dd"). Hasta esa fecha la receta es activa; después
   * pasa a pasadas.
   */
  vigenteHasta: string;
  /**
   * Fecha en que el paciente la archivó ("yyyy-MM-dd"). Solo se pueden archivar las pasadas. Define su
   * carpeta (año → mes) en Archivados, igual que en los estudios.
   */
  archivadoEl?: string;
  indicaciones?: string;
  observaciones?: string;
}
