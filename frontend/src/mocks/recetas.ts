import { subDays, format } from "date-fns";

import { Receta } from "@/domain";

export const recetasMock: Receta[] = [
  {
    id: "receta-1",
    medicoId: "med-mendez",
    pacienteId: "pac-sofia",
    fecha: format(subDays(new Date(), 25), "yyyy-MM-dd"),
    medicacion: "Losartán 50mg",
    dosis: "1 comprimido",
    frecuencia: "Cada 24 horas",
    duracion: "30 días",
    indicaciones: "Tomar por la mañana con el desayuno.",
  },
];
