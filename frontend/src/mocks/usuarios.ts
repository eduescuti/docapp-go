import { Rol } from "@/domain";

/**
 * Cuentas de prueba del "backend de ejemplo" del Sprint 1. Las contraseñas están en
 * texto plano SOLO porque esto es un mock local: el backend real va a guardar
 * hashes y nunca va a exponerlas al cliente (CLAUDE.md §11).
 */
export interface UsuarioMock {
  dni: string;
  password: string;
  rol: Rol;
  pacienteId?: string;
  medicoId?: string;
}

export const usuariosMock: UsuarioMock[] = [
  // Única combinación que abre el modo Administrador.
  { dni: "admin", password: "Admin123$", rol: "admin" },
  { dni: "12345678", password: "Paciente123$", rol: "paciente", pacienteId: "pac-sofia" },
  { dni: "42300300", password: "Medico123$", rol: "doctor", medicoId: "med-sosa" },
];
