import { Especialidad } from "@/domain";

export const especialidadesMock: Especialidad[] = [
  { id: "esp-cardiologia", nombre: "Cardiología", subespecialidades: ["Arritmias", "Hemodinamia"] },
  { id: "esp-dermatologia", nombre: "Dermatología", subespecialidades: ["Estética", "Oncológica"] },
  { id: "esp-pediatria", nombre: "Pediatría", subespecialidades: ["Neonatología"] },
  { id: "esp-clinica-medica", nombre: "Clínica Médica", subespecialidades: [] },
  { id: "esp-traumatologia", nombre: "Traumatología", subespecialidades: ["Deportiva", "Columna"] },
  { id: "esp-ginecologia", nombre: "Ginecología", subespecialidades: [] },
];
