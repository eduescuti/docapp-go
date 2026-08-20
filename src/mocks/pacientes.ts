import { Paciente } from "@/domain";

export const pacientesMock: Paciente[] = [
  {
    id: "pac-sofia",
    nombre: "Sofía",
    apellido: "Martínez",
    dni: "34567890",
    email: "sofia.martinez@example.com",
    telefono: "+54 9 11 5555-1234",
    planMedicoId: "plan-osde210",
    numeroAfiliado: "34.567.890",
    medicosFavoritosIds: ["med-ruiz"],
    institucionesFavoritasIds: ["inst-los-arcos"],
  },
];

export const pacienteActualId = "pac-sofia";
