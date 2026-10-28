export interface Especialidad {
  id: string;
  nombre: string;
  /**
   * Profesión del padrón a la que pertenece ("Médico", "Enfermero", "Kinesiólogo"): el registro de profesional
   * ofrece solo las de su profesión. Médicas: Res. 1814/2015; enfermería: Res. 199/2011 (Ministerio de Salud).
   */
  profesion: string;
  subespecialidades: string[];
}
