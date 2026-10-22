import { addDays, format, subDays } from "date-fns";

import { Receta } from "@/domain";

const hace = (dias: number) => format(subDays(new Date(), dias), "yyyy-MM-dd");
/** Último día de consumo: la fecha de emisión más la duración del tratamiento. */
const hasta = (emitidaHaceDias: number, duracionDias: number) =>
  format(addDays(subDays(new Date(), emitidaHaceDias), duracionDias), "yyyy-MM-dd");

export const recetasMock: Receta[] = [
  {
    id: "receta-1",
    medicoId: "med-mendez",
    pacienteId: "pac-sofia",
    fecha: hace(25),
    medicacion: "Losartán 50mg",
    dosis: "1 comprimido",
    frecuencia: "Cada 24 horas",
    duracion: "30 días",
    vigenteHasta: hasta(25, 30),
    indicaciones: "Tomar por la mañana con el desayuno.",
  },
  {
    id: "receta-2",
    medicoId: "med-mendez",
    pacienteId: "pac-sofia",
    fecha: hace(10),
    medicacion: "Atorvastatina 20mg",
    dosis: "1 comprimido",
    frecuencia: "Cada 24 horas, por la noche",
    duracion: "60 días",
    vigenteHasta: hasta(10, 60),
    indicaciones: "Tomar después de la cena. Evitar el jugo de pomelo durante el tratamiento.",
    observaciones: "Control de colesterol al finalizar el tratamiento.",
  },
  {
    id: "receta-3",
    medicoId: "med-ruiz",
    pacienteId: "pac-sofia",
    fecha: hace(5),
    medicacion: "Tretinoína 0,05% crema",
    dosis: "Una capa fina",
    frecuencia: "Una vez por día, antes de dormir",
    duracion: "20 días",
    vigenteHasta: hasta(5, 20),
    indicaciones: "Aplicar sobre la piel limpia y seca. Usar protector solar durante el día.",
    observaciones: "Si aparece irritación intensa, suspender y consultar.",
  },
  {
    id: "receta-4",
    medicoId: "med-fernandez",
    pacienteId: "pac-sofia",
    fecha: hace(45),
    medicacion: "Ibuprofeno 400mg",
    dosis: "1 comprimido",
    frecuencia: "Cada 8 horas, solo si hay dolor",
    duracion: "7 días",
    vigenteHasta: hasta(45, 7),
    indicaciones: "Tomar con las comidas. No superar 3 comprimidos por día.",
  },
  {
    id: "receta-5",
    medicoId: "med-fernandez",
    pacienteId: "pac-sofia",
    fecha: hace(70),
    medicacion: "Amoxicilina 500mg",
    dosis: "1 cápsula",
    frecuencia: "Cada 8 horas",
    duracion: "10 días",
    vigenteHasta: hasta(70, 10),
    indicaciones: "Completar el tratamiento aunque los síntomas mejoren.",
  },
  {
    id: "receta-6",
    medicoId: "med-fernandez",
    pacienteId: "pac-sofia",
    fecha: hace(120),
    medicacion: "Omeprazol 20mg",
    dosis: "1 cápsula",
    frecuencia: "Cada 24 horas, en ayunas",
    duracion: "30 días",
    vigenteHasta: hasta(120, 30),
    indicaciones: "Tomar 30 minutos antes del desayuno.",
  },
];
