import { PreguntaFrecuente } from "@/domain";

export const preguntasFrecuentesMock: PreguntaFrecuente[] = [
  {
    id: "faq-turno",
    pregunta: "¿Cómo saco un turno?",
    respuesta:
      "Desde Buscar elegí una especialidad o un profesional, después la sede, la fecha y el horario. Antes de confirmar vas a ver un resumen del turno.",
  },
  {
    id: "faq-cobertura",
    pregunta: "¿Por qué no veo a todos los profesionales?",
    respuesta:
      "La app te muestra solo los profesionales e instituciones que aceptan tu obra social o prepaga. Podés revisar o cambiar tu cobertura en Mi perfil.",
  },
  {
    id: "faq-cancelar",
    pregunta: "¿Cómo cancelo o reprogramo un turno?",
    respuesta:
      "En Turnos, dentro de Próximos, tocá el turno y elegí Reprogramar (otra fecha con el mismo profesional) o Cancelar turno. Se puede hasta 24 horas antes del turno.",
  },
  {
    id: "faq-resultados",
    pregunta: "¿Dónde veo los resultados de mis estudios?",
    respuesta: "En la pestaña Estudios. Cuando un resultado esté listo, también te llega una notificación.",
  },
  {
    id: "faq-feedback",
    pregunta: "¿Cuándo puedo calificar a un profesional?",
    respuesta: "Solo después de un turno cumplido con ese profesional. Lo encontrás en Menú → Feedback.",
  },
  {
    id: "faq-datos",
    pregunta: "¿Quién puede ver mi información médica?",
    respuesta:
      "Solo vos y los profesionales que te atienden. Cada profesional ve únicamente lo que está relacionado con las consultas que tuvo con vos.",
  },
];
