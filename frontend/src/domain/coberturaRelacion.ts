/**
 * De dónde sale que un plan acepta una institución privada. No hay fuente pública para este
 * dato: se carga a mano desde la cartilla de cada cobertura, con la URL y la fecha de consulta.
 */
export interface FuenteCobertura {
  planMedicoId: string;
  institucionId: string;
  /** Cartilla consultada. */
  fuenteUrl: string;
  /** Fecha de consulta, "yyyy-MM-dd". */
  verificadoEl: string;
}
