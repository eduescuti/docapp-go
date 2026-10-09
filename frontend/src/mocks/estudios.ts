import { subDays, format } from "date-fns";

import { Estudio, OrdenLaboratorio } from "@/domain";

const iso = (offsetDias: number) => format(subDays(new Date(), offsetDias), "yyyy-MM-dd");

// Instituciones reales del REFES: 51020062319036 = Diagnóstico Mediter · 50020012115367 = CESAC Nº 33 ·
// 10020012315256 = Hospital Italiano de Buenos Aires.
export const ordenesLaboratorioMock: OrdenLaboratorio[] = [
  {
    id: "orden-1",
    medicoId: "med-mendez",
    pacienteId: "pac-sofia",
    fecha: iso(6),
    estudiosSolicitados: ["Análisis de Sangre Completo"],
    indicaciones: "Ayuno de 8 horas.",
    institucionId: "refes-51020062319036",
    estado: "resultado_disponible",
  },
];

export const estudiosMock: Estudio[] = [
  {
    id: "est-1",
    ordenId: "orden-1",
    pacienteId: "pac-sofia",
    tipo: "Análisis de Sangre Completo",
    institucionId: "refes-51020062319036",
    medicoSolicitanteId: "med-mendez",
    fecha: iso(6),
    preparacionPrevia: "Ayuno de 8 horas.",
    estado: "resultado_disponible",
  },
  {
    id: "est-2",
    pacienteId: "pac-sofia",
    tipo: "Electrocardiograma",
    institucionId: "refes-50020012115367",
    medicoSolicitanteId: "med-mendez",
    fecha: iso(49),
    estado: "resultado_disponible",
  },
  {
    id: "est-3",
    pacienteId: "pac-sofia",
    tipo: "Radiografía de Tórax",
    institucionId: "refes-10020012315256",
    medicoSolicitanteId: "med-mendez",
    fecha: iso(49),
    estado: "resultado_disponible",
  },
];
