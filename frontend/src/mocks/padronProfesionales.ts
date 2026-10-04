import { ProfesionalPadron } from "@/domain";

/** DNI de la ficha pensada para mostrar el registro de profesional en la demo del Sprint. */
export const DNI_DEMO_REGISTRO = "40123456";

/**
 * Simula el Buscador Nacional de Profesionales de la Salud (argentina.gob.ar).
 * Nombres, DNI y códigos son ficticios; la matrícula 132043 respeta el formato de
 * una ficha real del padrón. El primer registro ya tiene cuenta en la app
 * (ver usuarios.ts); los otros sirven para probar el registro de profesionales.
 */
export const padronProfesionalesMock: ProfesionalPadron[] = [
  {
    // Profesional de demo para el registro: no tiene cuenta y su matrícula está habilitada,
    // así que el flujo llega hasta el último paso. Sus datos son los placeholders del formulario.
    codigoProfesional: "541043250006",
    dni: DNI_DEMO_REGISTRO,
    nombre: "Juan",
    apellido: "Fernández",
    activo: true,
    profesion: "Kinesiólogo",
    especializaciones: [],
    emisor: "MINISTERIO DE SALUD DE LA NACION",
    provincia: "CABA",
    matricula: "154321",
    estadoMatricula: "Habilitada en CABA",
  },
  {
    codigoProfesional: "541043250001",
    dni: "42300300",
    nombre: "Valeria",
    apellido: "Sosa",
    activo: true,
    profesion: "Enfermero",
    especializaciones: [],
    emisor: "MINISTERIO DE SALUD DE LA NACION",
    provincia: "CABA",
    matricula: "132043",
    estadoMatricula: "Habilitada en CABA",
  },
  {
    codigoProfesional: "541043250002",
    dni: "30111222",
    nombre: "Martín",
    apellido: "Acosta",
    activo: true,
    profesion: "Médico",
    especializaciones: ["Cardiología"],
    emisor: "MINISTERIO DE SALUD DE LA NACION",
    provincia: "CABA",
    matricula: "145872",
    estadoMatricula: "Habilitada en CABA",
  },
  {
    codigoProfesional: "541043250003",
    dni: "35222333",
    nombre: "Paula",
    apellido: "Ríos",
    activo: true,
    profesion: "Enfermero",
    especializaciones: [],
    emisor: "MINISTERIO DE SALUD DE LA NACION",
    provincia: "Buenos Aires",
    matricula: "128904",
    estadoMatricula: "Habilitada en Buenos Aires",
  },
  {
    codigoProfesional: "541043250004",
    dni: "36555777",
    nombre: "Federico",
    apellido: "Luna",
    activo: true,
    profesion: "Kinesiólogo",
    especializaciones: [],
    emisor: "MINISTERIO DE SALUD DE LA NACION",
    provincia: "Córdoba",
    matricula: "117650",
    estadoMatricula: "Habilitada en Córdoba",
  },
  {
    // Matrícula no habilitada: el registro tiene que rechazarlo.
    codigoProfesional: "541043250005",
    dni: "28444555",
    nombre: "Jorge",
    apellido: "Pereyra",
    activo: false,
    profesion: "Médico",
    especializaciones: ["Clínica Médica"],
    emisor: "MINISTERIO DE SALUD DE LA NACION",
    provincia: "CABA",
    matricula: "109331",
    estadoMatricula: "Suspendida",
  },
];
