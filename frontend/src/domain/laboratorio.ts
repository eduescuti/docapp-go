/**
 * Estado de una orden: `pendiente` mientras el paciente no fue al laboratorio o espera resultados; `listo`
 * cuando ya llegó al menos un resultado.
 */
export type EstadoOrden = "pendiente" | "listo";

/** Orden médica que un profesional le asigna a un paciente, con sus indicaciones. */
export interface OrdenLaboratorio {
  id: string;
  medicoId: string;
  pacienteId: string;
  /** Fecha de emisión ("yyyy-MM-dd"). */
  fecha: string;
  estudiosSolicitados: string[];
  indicaciones: string;
  /** Hospital o laboratorio donde se hace. */
  institucionId: string;
  estado: EstadoOrden;
  /** Fecha en que el paciente la archivó ("yyyy-MM-dd"). Define su carpeta (año → mes) en Archivados. */
  archivadoEl?: string;
}

/**
 * Resultado de un estudio: profesional + fecha + hospital + orden + archivo PDF. No tiene estado: el aviso
 * de "nuevo" que ve el paciente es solo del frontend (`resultadosVistos`).
 */
export interface Estudio {
  id: string;
  ordenId: string;
  pacienteId: string;
  tipo: string;
  institucionId: string;
  medicoSolicitanteId: string;
  fecha: string;
  /** Archivo PDF del resultado. Lo carga un tercero (el laboratorio), no el profesional ni el admin. */
  resultadoUrl?: string;
  /** Fecha en que el paciente lo archivó ("yyyy-MM-dd"). Define su carpeta (año → mes) en Archivados. */
  archivadoEl?: string;
}
