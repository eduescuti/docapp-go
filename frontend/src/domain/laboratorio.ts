export type EstadoEstudio = "pendiente" | "agendado" | "realizado" | "resultado_disponible";

export interface OrdenLaboratorio {
  id: string;
  medicoId: string;
  pacienteId: string;
  fecha: string;
  estudiosSolicitados: string[];
  indicaciones: string;
  institucionId: string;
  estado: EstadoEstudio;
  /** Fecha en que el paciente la archivó ("yyyy-MM-dd"). Define su carpeta (año → mes) en Archivados. */
  archivadoEl?: string;
}

export interface Estudio {
  id: string;
  ordenId?: string;
  pacienteId: string;
  tipo: string;
  institucionId: string;
  medicoSolicitanteId: string;
  fecha: string;
  preparacionPrevia?: string;
  estado: EstadoEstudio;
  resultadoUrl?: string;
  /** Fecha en que el paciente lo archivó ("yyyy-MM-dd"). Define su carpeta (año → mes) en Archivados. */
  archivadoEl?: string;
}
