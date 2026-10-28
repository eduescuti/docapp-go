/**
 * Una cobertura que acepta una institución o atiende un profesional: una obra social entera o algunos de
 * sus planes (decidido el 27/10/2026). Misma forma que en la API (`docs/08-coberturas.md` del backend).
 */
export interface CoberturaAceptada {
  obraSocialId: string;
  /** Vacío u omitido = todos los planes de esa obra social. */
  planesIds?: string[];
}

/**
 * De dónde sale que una institución acepta sus coberturas. No hay fuente pública para este dato: lo
 * carga el admin desde la web de la institución o la cartilla de la cobertura, o de un relevamiento propio.
 */
export type TipoFuenteCobertura = "web_institucion" | "cartilla_cobertura" | "relevamiento_propio";

export interface FuenteCobertura {
  fuente: TipoFuenteCobertura;
  /** Página consultada. No hay con `relevamiento_propio`. */
  fuenteUrl?: string;
  /** Fecha de consulta, "yyyy-MM-dd". */
  verificadoEl: string;
}
