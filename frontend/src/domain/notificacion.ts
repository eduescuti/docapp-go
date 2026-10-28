export type TipoNotificacion =
  | "recordatorio_turno"
  | "turno_confirmado"
  | "turno_rechazado"
  | "turno_cancelado"
  | "turno_reprogramado"
  | "resultado_disponible"
  | "nueva_receta"
  | "nueva_orden";

export interface Notificacion {
  id: string;
  pacienteId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}
