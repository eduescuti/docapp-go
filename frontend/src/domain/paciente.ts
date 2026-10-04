export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  /** Reservado para el futuro: hoy no se pide en el registro ni se muestra en pantallas. */
  email: string;
  /** Reservado para el futuro: hoy no se pide en el registro ni se muestra en pantallas. */
  telefono: string;
  planMedicoId: string;
  /**
   * Reservado para el futuro (p. ej. validar la cobertura contra la obra social).
   * Hoy NO se pide en el registro ni se muestra en ninguna pantalla: el paciente se
   * identifica por DNI. Ver CLAUDE.md §5.
   */
  numeroAfiliado: string;
  medicosFavoritosIds: string[];
  institucionesFavoritasIds: string[];
  avatarUrl?: string;
}
