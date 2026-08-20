import { subDays, format } from "date-fns";

import { Estudio, OrdenLaboratorio } from "@/domain";

const iso = (offsetDias: number) => format(subDays(new Date(), offsetDias), "yyyy-MM-dd");

export const ordenesLaboratorioMock: OrdenLaboratorio[] = [
  {
    id: "orden-1",
    medicoId: "med-mendez",
    pacienteId: "pac-sofia",
    fecha: iso(6),
    estudiosSolicitados: ["Análisis de Sangre Completo"],
    indicaciones: "Ayuno de 8 horas.",
    institucionId: "inst-labo-sur",
    estado: "resultado_disponible",
  },
];

export const estudiosMock: Estudio[] = [
  {
    id: "est-1",
    ordenId: "orden-1",
    pacienteId: "pac-sofia",
    tipo: "Análisis de Sangre Completo",
    institucionId: "inst-labo-sur",
    medicoSolicitanteId: "med-mendez",
    fecha: iso(6),
    preparacionPrevia: "Ayuno de 8 horas.",
    estado: "resultado_disponible",
  },
  {
    id: "est-2",
    pacienteId: "pac-sofia",
    tipo: "Electrocardiograma",
    institucionId: "inst-centro-norte",
    medicoSolicitanteId: "med-mendez",
    fecha: iso(49),
    estado: "resultado_disponible",
  },
  {
    id: "est-3",
    pacienteId: "pac-sofia",
    tipo: "Radiografía de Tórax",
    institucionId: "inst-hospital-italiano",
    medicoSolicitanteId: "med-mendez",
    fecha: iso(49),
    estado: "resultado_disponible",
  },
];
