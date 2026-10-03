import { Institucion } from "@/domain";

export const institucionesMock: Institucion[] = [
  {
    id: "inst-centro-norte",
    nombre: "Centro Médico Norte",
    tipo: "centro_medico",
    planesAceptadosIds: ["plan-osde210", "plan-swiss", "plan-galeno"],
    sedes: [
      {
        id: "sede-centro-norte-1",
        institucionId: "inst-centro-norte",
        nombre: "Centro Médico Norte - Palermo",
        direccion: "Av. Libertador 1234",
        ciudad: "CABA",
        latitud: -34.5755,
        longitud: -58.4338,
        telefono: "+54 11 4555-0101",
      },
    ],
  },
  {
    id: "inst-los-arcos",
    nombre: "Clínica Los Arcos",
    tipo: "clinica",
    planesAceptadosIds: ["plan-osde210", "plan-medife"],
    sedes: [
      {
        id: "sede-los-arcos-1",
        institucionId: "inst-los-arcos",
        nombre: "Clínica Los Arcos",
        direccion: "Av. Santa Fe 3651",
        ciudad: "CABA",
        latitud: -34.5823,
        longitud: -58.4204,
        telefono: "+54 11 4555-0202",
      },
    ],
  },
  {
    id: "inst-hospital-italiano",
    nombre: "Hospital Italiano",
    tipo: "hospital",
    planesAceptadosIds: ["plan-osde210", "plan-swiss", "plan-galeno", "plan-medife"],
    sedes: [
      {
        id: "sede-hospital-italiano-1",
        institucionId: "inst-hospital-italiano",
        nombre: "Hospital Italiano - Sede Central",
        direccion: "Perón 4190",
        ciudad: "CABA",
        latitud: -34.6039,
        longitud: -58.4232,
        telefono: "+54 11 4555-0303",
      },
    ],
  },
  {
    id: "inst-labo-sur",
    nombre: "Laboratorio Bioanálisis Sur",
    tipo: "laboratorio",
    planesAceptadosIds: ["plan-osde210", "plan-swiss", "plan-galeno", "plan-medife"],
    sedes: [
      {
        id: "sede-labo-sur-1",
        institucionId: "inst-labo-sur",
        nombre: "Bioanálisis Sur",
        direccion: "Av. Rivadavia 5820",
        ciudad: "CABA",
        latitud: -34.6172,
        longitud: -58.4362,
        telefono: "+54 11 4555-0404",
      },
    ],
  },
];
