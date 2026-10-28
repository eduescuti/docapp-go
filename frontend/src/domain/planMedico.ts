/** Registro oficial de la Superintendencia de Servicios de Salud donde figura la cobertura. */
export type RegistroCobertura = "RNAS" | "RNEMP" | "otro";

/** Obra social o prepaga (OSDE, Swiss Medical, OSPJN, ...). Tiene uno o más planes. */
export interface ObraSocial {
  id: string;
  nombre: string;
  /** Nombre largo o aclaración ("Obra Social del Poder Judicial de la Nación"). */
  descripcion?: string;
  /** RNAS: obras sociales nacionales. RNEMP: prepagas. */
  registro?: RegistroCobertura;
  /** Código en el registro, p. ej. "400800" para OSDE en el RNAS. */
  codigoOficial?: string;
}

/**
 * Plan de una obra social ("210" de OSDE, "SMG20" de Swiss Medical). Las obras sociales sin planes
 * conocidos tienen uno solo, "General". El paciente tiene un plan; las coberturas se cargan por obra social.
 */
export interface PlanMedico {
  id: string;
  obraSocialId: string;
  nombre: string;
}

/** Nombre del plan de las obras sociales que no publican planes. */
export const PLAN_GENERAL = "General";

/** Un plan con su obra social ya resuelta, como lo devuelve la API para mostrarlo (credencial, perfil). */
export interface PlanConObraSocial extends PlanMedico {
  obraSocial: ObraSocial;
}

/** Una obra social con sus planes: `GET /api/planes` (registro, selector de coberturas). */
export interface ObraSocialConPlanes extends ObraSocial {
  planes: PlanMedico[];
}
