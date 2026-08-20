export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  planMedicoId: string;
  numeroAfiliado: string;
  medicosFavoritosIds: string[];
  institucionesFavoritasIds: string[];
  avatarUrl?: string;
}
