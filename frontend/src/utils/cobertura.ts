import { format, parseISO } from "date-fns";

import { CoberturaAceptada, FuenteCobertura, ObraSocialConPlanes, PLAN_GENERAL, PlanConObraSocial, PlanMedico } from "@/domain";

/**
 * ¿Alguna de estas coberturas incluye el plan? Una cobertura sin planes acepta todos los de su obra social
 * (reglas 1 y 18). Es la misma condición que la consulta del backend.
 */
export function cubrePlan(coberturas: CoberturaAceptada[], plan: Pick<PlanMedico, "id" | "obraSocialId">): boolean {
  return coberturas.some(
    (c) => c.obraSocialId === plan.obraSocialId && (!c.planesIds || c.planesIds.length === 0 || c.planesIds.includes(plan.id)),
  );
}

/** "OSDE 210", "Swiss Medical SMG20"; las de plan único, solo la obra social ("OSPJN"). */
export function nombrePlan(plan: PlanConObraSocial): string {
  return plan.nombre === PLAN_GENERAL ? plan.obraSocial.nombre : `${plan.obraSocial.nombre} ${plan.nombre}`;
}

/** Qué planes de su obra social cubre una cobertura: "Todos los planes" o "310 · 410". */
export function resumenPlanes(cobertura: CoberturaAceptada, obraSocial?: ObraSocialConPlanes): string {
  if (!cobertura.planesIds || cobertura.planesIds.length === 0 || !obraSocial) return "Todos los planes";
  const nombres = obraSocial.planes.filter((p) => cobertura.planesIds?.includes(p.id)).map((p) => p.nombre);
  return nombres.join(" · ");
}

/** "OSDE (310 · 410), Galeno": para listar coberturas en una línea. */
export function resumenCoberturas(coberturas: CoberturaAceptada[], obrasSociales: ObraSocialConPlanes[]): string {
  return coberturas
    .map((c) => {
      const obraSocial = obrasSociales.find((o) => o.id === c.obraSocialId);
      if (!obraSocial) return null;
      const todos = !c.planesIds || c.planesIds.length === 0;
      return todos ? obraSocial.nombre : `${obraSocial.nombre} (${resumenPlanes(c, obraSocial)})`;
    })
    .filter((texto): texto is string => !!texto)
    .join(", ");
}

export const ETIQUETA_FUENTE: Record<FuenteCobertura["fuente"], string> = {
  web_institucion: "Web de la institución",
  cartilla_cobertura: "Cartilla de la obra social",
  relevamiento_propio: "Relevamiento propio",
};

/** "Según la web de la institución al 27/10/2026" / "Relevamiento propio al 27/10/2026". */
export function textoFuente(fuente: FuenteCobertura): string {
  const fecha = format(parseISO(fuente.verificadoEl), "dd/MM/yyyy");
  if (fuente.fuente === "web_institucion") return `Según la web de la institución al ${fecha}`;
  if (fuente.fuente === "cartilla_cobertura") return `Según la cartilla de la obra social al ${fecha}`;
  return `Relevamiento propio al ${fecha}`;
}
