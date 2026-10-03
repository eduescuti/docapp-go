import { subHours, format } from "date-fns";

import { Notificacion } from "@/domain";

export const notificacionesMock: Notificacion[] = [
  {
    id: "notif-1",
    pacienteId: "pac-sofia",
    tipo: "recordatorio_turno",
    titulo: "Turno mañana con Dr. Roberto Méndez",
    mensaje: "Tenés un turno de cardiología en Centro Médico Norte.",
    fecha: format(subHours(new Date(), 3), "yyyy-MM-dd'T'HH:mm"),
    leida: false,
  },
  {
    id: "notif-2",
    pacienteId: "pac-sofia",
    tipo: "resultado_disponible",
    titulo: "Resultado disponible",
    mensaje: "Ya está listo el resultado de tu Análisis de Sangre Completo.",
    fecha: format(subHours(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
    leida: false,
  },
  {
    id: "notif-3",
    pacienteId: "pac-sofia",
    tipo: "nueva_receta",
    titulo: "Nueva receta",
    mensaje: "El Dr. Roberto Méndez te generó una nueva receta.",
    fecha: format(subHours(new Date(), 96), "yyyy-MM-dd'T'HH:mm"),
    leida: true,
  },
];
