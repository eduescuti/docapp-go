import type { CoberturaAceptada, FuenteCobertura } from "./cobertura";

export type TipoInstitucion = "hospital" | "clinica" | "centro_medico" | "laboratorio";

/**
 * Quién financia el establecimiento, según el REFES. Decide la regla 15 (CLAUDE.md §10):
 * los públicos se muestran a todos los pacientes; el resto, solo si acepta su cobertura.
 */
export type OrigenFinanciamiento = "publico" | "privado" | "seguridad_social";

export interface Sede {
  id: string;
  institucionId: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  /** El REFES no trae teléfono: solo lo tienen las sedes cargadas por el admin. */
  telefono?: string;
  /** `establecimiento_id` del REFES (14 dígitos). No lo tienen las altas del admin. */
  refesId?: string;
}

export interface Institucion {
  id: string;
  nombre: string;
  tipo: TipoInstitucion;
  origen: OrigenFinanciamiento;
  logoUrl?: string;
  sitioWeb?: string;
  /** Coberturas que acepta. En los públicos queda vacío: la regla 15 se aplica en el service. */
  coberturas: CoberturaAceptada[];
  /** De dónde salen sus coberturas (una por institución). La carga el admin junto con ellas. */
  fuenteCoberturas?: FuenteCobertura;
  sedes: Sede[];
}
