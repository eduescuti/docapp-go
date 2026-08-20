import { addDays, format, subDays } from "date-fns";

import { Turno } from "@/domain";

const iso = (offsetDias: number) => format(addDays(new Date(), offsetDias), "yyyy-MM-dd");

export const turnosMock: Turno[] = [
  {
    id: "turno-1",
    pacienteId: "pac-sofia",
    medicoId: "med-mendez",
    sedeId: "sede-centro-norte-1",
    fecha: iso(4),
    hora: "10:30",
    tipoConsulta: "control",
    estado: "confirmado",
  },
  {
    id: "turno-2",
    pacienteId: "pac-sofia",
    medicoId: "med-ruiz",
    sedeId: "sede-los-arcos-1",
    fecha: iso(9),
    hora: "15:00",
    tipoConsulta: "seguimiento",
    estado: "pendiente",
  },
  {
    id: "turno-3",
    pacienteId: "pac-sofia",
    medicoId: "med-ruiz",
    sedeId: "sede-centro-norte-1",
    fecha: format(subDays(new Date(), 25), "yyyy-MM-dd"),
    hora: "11:00",
    tipoConsulta: "primera_consulta",
    estado: "completado",
  },
  {
    id: "turno-4",
    pacienteId: "pac-sofia",
    medicoId: "med-mendez",
    sedeId: "sede-centro-norte-1",
    fecha: format(subDays(new Date(), 60), "yyyy-MM-dd"),
    hora: "09:30",
    tipoConsulta: "control",
    estado: "completado",
  },
];
