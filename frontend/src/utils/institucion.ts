import type { LucideIcon } from "lucide-react-native";
import { Building2, FlaskConical, Hospital, Stethoscope } from "lucide-react-native";

import type { TipoInstitucion } from "@/domain";
import type { ThemeMapa } from "@/theme";

export const ETIQUETA_TIPO: Record<TipoInstitucion, string> = {
  hospital: "Hospital",
  clinica: "Clínica",
  centro_medico: "Centro médico",
  laboratorio: "Laboratorio",
};

/** Plural para los filtros del mapa. */
export const ETIQUETA_TIPO_PLURAL: Record<TipoInstitucion, string> = {
  hospital: "Hospitales",
  clinica: "Clínicas",
  centro_medico: "Centros médicos",
  laboratorio: "Laboratorios",
};

export const ICONO_TIPO: Record<TipoInstitucion, LucideIcon> = {
  hospital: Hospital,
  clinica: Building2,
  centro_medico: Stethoscope,
  laboratorio: FlaskConical,
};

/** Color del marcador de cada tipo, tomado del tema (el mismo que usa el mapa). */
export function colorTipo(mapa: ThemeMapa, tipo: TipoInstitucion): string {
  if (tipo === "centro_medico") return mapa.centroMedico;
  return mapa[tipo];
}
