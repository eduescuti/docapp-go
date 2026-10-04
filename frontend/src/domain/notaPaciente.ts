/**
 * Nota que un profesional registra sobre un paciente. Queda asociada al profesional
 * que la escribió y solo ese profesional la ve (CLAUDE.md §10, reglas 7 y 8).
 */
export interface NotaPaciente {
  id: string;
  medicoId: string;
  pacienteId: string;
  fecha: string; // ISO "2026-10-03T14:30"
  texto: string;
}
