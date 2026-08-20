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
}
