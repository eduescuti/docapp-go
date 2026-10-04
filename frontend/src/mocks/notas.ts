import { format, subDays } from "date-fns";

import { NotaPaciente } from "@/domain";

const hace = (dias: number) => format(subDays(new Date(), dias), "yyyy-MM-dd'T'HH:mm");

export const notasPacienteMock: NotaPaciente[] = [
  {
    id: "nota-1",
    medicoId: "med-sosa",
    pacienteId: "pac-lucas",
    fecha: hace(20),
    texto: "Curación de herida en antebrazo izquierdo. Buena evolución, sin signos de infección.",
  },
  {
    id: "nota-2",
    medicoId: "med-sosa",
    pacienteId: "pac-lucas",
    fecha: hace(6),
    texto: "Retiro de puntos. Indicar crema cicatrizante dos veces por día durante una semana.",
  },
  {
    id: "nota-3",
    medicoId: "med-sosa",
    pacienteId: "pac-ana",
    fecha: hace(15),
    texto: "Control de presión arterial: 125/80. Sugerir control mensual.",
  },
];
