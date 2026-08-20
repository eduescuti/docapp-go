export type TipoInstitucion = "hospital" | "clinica" | "centro_medico" | "laboratorio";

export interface Sede {
  id: string;
  institucionId: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  telefono: string;
}

export interface Institucion {
  id: string;
  nombre: string;
  tipo: TipoInstitucion;
  logoUrl?: string;
  planesAceptadosIds: string[];
  sedes: Sede[];
}
