/** Registro oficial de la Superintendencia de Servicios de Salud donde figura la cobertura. */
export type RegistroCobertura = "RNAS" | "RNEMP" | "otro";

export interface PlanMedico {
  id: string;
  nombre: string;
  aseguradora: string;
  /** RNAS: obras sociales nacionales. RNEMP: prepagas. */
  registro?: RegistroCobertura;
  /** Código en el registro, p. ej. "400800" para OSDE en el RNAS. */
  codigoOficial?: string;
}
