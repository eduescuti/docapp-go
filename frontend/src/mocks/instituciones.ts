import { Institucion, OrigenFinanciamiento, TipoInstitucion } from "@/domain";

import refes from "./data/refes-caba.json";

/**
 * Establecimientos reales de CABA tomados del REFES (Ministerio de Salud de la Nación, CC BY 4.0).
 * `data/refes-caba.json` lo genera `scripts/importar-refes.mjs`: no se edita a mano.
 *
 * - Cada establecimiento es una institución con una sola sede, su dirección (decisión D5).
 * - `planesAceptadosIds` arranca vacío: qué planes acepta cada privado se carga aparte, desde
 *   las cartillas (Fase 3 del plan de integración). No se inventan coberturas de lugares reales.
 */
const TIPOS: readonly TipoInstitucion[] = ["hospital", "clinica", "centro_medico", "laboratorio"];
const ORIGENES: readonly OrigenFinanciamiento[] = ["publico", "privado", "seguridad_social"];

const esTipo = (v: unknown): v is TipoInstitucion => TIPOS.some((t) => t === v);
const esOrigen = (v: unknown): v is OrigenFinanciamiento => ORIGENES.some((o) => o === v);

/** Fila del JSON → Institucion, validando cada campo (el JSON no trae tipos de TypeScript). */
function aInstitucion(fila: readonly unknown[]): Institucion {
  const [refesId, nombre, tipo, origen, direccion, latitud, longitud, sitioWeb] = fila;
  if (
    typeof refesId !== "string" ||
    typeof nombre !== "string" ||
    !esTipo(tipo) ||
    !esOrigen(origen) ||
    typeof direccion !== "string" ||
    typeof latitud !== "number" ||
    typeof longitud !== "number" ||
    typeof sitioWeb !== "string"
  ) {
    throw new Error(`Fila inválida en refes-caba.json: ${JSON.stringify(fila)}`);
  }
  const id = `refes-${refesId}`;
  return {
    id,
    nombre,
    tipo,
    origen,
    sitioWeb: sitioWeb || undefined,
    planesAceptadosIds: [],
    sedes: [{ id: `sede-${refesId}`, institucionId: id, nombre, direccion, ciudad: "CABA", latitud, longitud, refesId }],
  };
}

export const institucionesMock: Institucion[] = refes.filas.map(aInstitucion);

/** De dónde salen los establecimientos, para la atribución en Menú → Ayuda (licencia CC BY 4.0). */
export const fuenteInstitucionesMock = { fuente: refes.fuente, licencia: refes.licencia, version: refes.version };
