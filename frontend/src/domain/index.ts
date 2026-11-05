// ---------- Paciente ----------

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  planMedicoId: string;
  medicosFavoritosIds: string[];
  institucionesFavoritasIds: string[];
  avatarUrl?: string;
}

// ---------- Obras sociales y planes ----------

/** Registro oficial de la Superintendencia de Servicios de Salud donde figura la cobertura. */
export type RegistroCobertura = "RNAS" | "RNEMP" | "otro";

/** Obra social o prepaga (OSDE, Swiss Medical, OSPJN, ...). Tiene uno o más planes. */
export interface ObraSocial {
  id: string;
  nombre: string;
  descripcion?: string;
}

/**
 * Plan de una obra social ("210" de OSDE, "SMG20" de Swiss Medical). Las obras sociales sin planes
 * conocidos tienen uno solo, "General". El paciente tiene un plan; las coberturas se cargan por obra social.
 */
export interface PlanMedico {
  id: string;
  obraSocialId: string;
  nombre: string;
}

/** Nombre del plan de las obras sociales que no publican planes. */
export const PLAN_GENERAL = "General";

/** Un plan con su obra social ya resuelta, como lo devuelve la API para mostrarlo (credencial, perfil). */
export interface PlanConObraSocial extends PlanMedico {
  obraSocial: ObraSocial;
}

/** Una obra social con sus planes: `GET /api/planes` (registro, selector de coberturas). */
export interface ObraSocialConPlanes extends ObraSocial {
  planes: PlanMedico[];
}

// ---------- Instituciones y sedes ----------

export type TipoInstitucion = "hospital" | "clinica" | "centro_medico" | "laboratorio";

/**
 * Quién financia el establecimiento, según el REFES. Decide la regla 15 (CLAUDE.md §10):
 * los públicos se muestran a todos los pacientes; el resto, solo si acepta su cobertura.
 */
export type OrigenFinanciamiento = "publico" | "privado" | "seguridad_social";

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  telefono?: string;
}

export interface Institucion {
  id: string;
  nombre: string;
  tipo: TipoInstitucion;
  origen: OrigenFinanciamiento;
  coberturas: CoberturaAceptada[];
  fuenteCoberturas?: FuenteCobertura;
  sedes: Sede[];
}

// ---------- Coberturas ----------

/**
 * Una cobertura que acepta una institución o atiende un profesional: una obra social entera o algunos de
 * sus planes (decidido el 27/10/2026). Misma forma que en la API (`docs/08-coberturas.md` del backend).
 */
export interface CoberturaAceptada {
  obraSocialId: string;
  planesIds?: string[];
}

/**
 * De dónde sale que una institución acepta sus coberturas. No hay fuente pública para este dato: lo
 * carga el admin desde la web de la institución o la cartilla de la cobertura, o de un relevamiento propio.
 */
export type TipoFuenteCobertura = "web_institucion" | "cartilla_cobertura" | "relevamiento_propio";

export interface FuenteCobertura {
  fuente: TipoFuenteCobertura;
  fuenteUrl?: string;
  verificadoEl: string;
}

// ---------- Especialidades ----------

export interface Especialidad {
  id: string;
  nombre: string;
  profesion: string;
}

// ---------- Profesionales ----------

/** 0 = domingo … 6 = sábado, como `Date.getDay()`. */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Franja de atención: el profesional atiende en ese lugar ese día de la semana, de `desde` a `hasta`. La
 * carga él en su Agenda; dentro de cada franja se ofrecen turnos de 30 min (decidido el 27/10/2026).
 */
export interface FranjaAtencion {
  id: string;
  sedeId: string;
  diaSemana: DiaSemana;
  desde: string;
  hasta: string;
}

/** Define el título con el que se muestra al profesional ("Dr." / "Dra."). */
export type Genero = "femenino" | "masculino";

export interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  genero: Genero;
  matricula: string;
  profesion: string;
  especialidadId: string;
  subespecialidad?: string;
  institucionesIds: string[];
  sedesIds: string[];
  coberturas: CoberturaAceptada[];
  valoracion: number;
  cantidadValoraciones: number;
  aniosExperiencia: number;
  descripcion: string;
  avatarUrl?: string;
}

// ---------- Turnos ----------

/**
 * Estados de un turno (Sprint 2):
 * - `pendiente`: el paciente lo solicitó y el profesional todavía no lo confirmó.
 * - `confirmado`: el profesional lo confirmó.
 * - `rechazado`: el profesional no lo aceptó, o llegó la fecha sin que lo confirmara. No ocupa el horario.
 * - `cancelado`: lo canceló el paciente. No ocupa el horario.
 * - `completado`: pasó la fecha de un turno confirmado (el paciente asistió).
 *
 * No hay estado "reprogramado": reprogramar cancela el turno y reserva uno nuevo, que nace `pendiente` y
 * guarda de cuál viene (`reprogramadoDesdeId`).
 *
 * Al pasar la fecha, un turno confirmado pasa solo a `completado` y uno pendiente a `rechazado`.
 */
export type EstadoTurno = "confirmado" | "pendiente" | "cancelado" | "completado" | "rechazado";

/**
 * Turno reservado. Lo identifica la combinación fecha + hora + sede (hospital) + profesional (que define la
 * especialidad): no puede haber dos turnos activos con la misma (regla 4).
 */
export interface Turno {
  id: string;
  pacienteId: string;
  medicoId: string;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  ocultoEnHistorial?: boolean;
}

// ---------- Órdenes y estudios ----------

/**
 * Estado de una orden: `pendiente` mientras el paciente no fue al laboratorio o espera resultados; `listo`
 * cuando ya llegó al menos un resultado.
 */
export type EstadoOrden = "pendiente" | "listo";

/** Orden médica que un profesional le asigna a un paciente, con sus indicaciones. */
export interface OrdenLaboratorio {
  id: string;
  medicoId: string;
  pacienteId: string;
  fecha: string;
  estudiosSolicitados: string[];
  indicaciones: string;
  institucionId: string;
  estado: EstadoOrden;
  archivadoEl?: string;
}

/**
 * Resultado de un estudio: profesional + fecha + hospital + orden + archivo PDF. No tiene estado: el aviso
 * de "nuevo" que ve el paciente es solo del frontend (`resultadosVistos`).
 */
export interface Estudio {
  id: string;
  ordenId: string;
  pacienteId: string;
  tipo: string;
  institucionId: string;
  medicoSolicitanteId: string;
  fecha: string;
  archivadoEl?: string;
}

// ---------- Recetas ----------

export interface Receta {
  id: string;
  medicoId: string;
  pacienteId: string;
  fecha: string;
  medicacion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  vigenteHasta: string;
  archivadoEl?: string;
  indicaciones?: string;
  observaciones?: string;
}

// ---------- Feedback ----------

export interface Feedback {
  id: string;
  medicoId: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  comentario?: string;
  criterios: {
    puntualidad?: number;
    atencion?: number;
    trato?: number;
    claridadExplicacion?: number;
    experienciaGeneral?: number;
  };
  fecha: string;
}

// ---------- Notificaciones ----------

export type TipoNotificacion =
  | "recordatorio_turno"
  | "turno_confirmado"
  | "turno_rechazado"
  | "turno_cancelado"
  | "turno_reprogramado"
  | "resultado_disponible"
  | "nueva_receta"
  | "nueva_orden";

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}

// ---------- Sesión y registro ----------

/** Roles de la app (CLAUDE.md §6). El id "doctor" coincide con el grupo de rutas `app/(doctor)`. */
export type Rol = "paciente" | "doctor" | "admin";

/**
 * Sesión activa. Es una unión discriminada por `rol` para que TypeScript obligue
 * a que un paciente tenga `pacienteId` y un profesional tenga `medicoId`.
 */
interface SesionBase {
  dni: string;
  iniciadaEn: string;
}

export type Sesion =
  | (SesionBase & { rol: "paciente"; pacienteId: string })
  | (SesionBase & { rol: "doctor"; medicoId: string })
  | (SesionBase & { rol: "admin" });

/**
 * Datos que pide el registro de paciente. DNI, nombre y apellido no se escriben: salen del código PDF417 del DNI,
 * que se escanea con la cámara (verificación de identidad, decidido el 28/10/2026).
 */
export interface DatosRegistroPaciente {
  codigoDni: string;
  password: string;
  planMedicoId: string;
}

/** Lo que devuelve el backend al leer el código del DNI: lo justo para mostrar y completar el formulario. */
export interface DniLeido {
  dni: string;
  nombre: string;
  apellido: string;
}

/** Datos que pide el registro de profesional: la terna DNI + matrícula + profesión se valida contra el padrón. */
export interface DatosRegistroMedico {
  dni: string;
  matricula: string;
  profesion: string;
  password: string;
}

/** Lo que además se pide para crear la cuenta del profesional (decidido el 27/10/2026). */
export interface DatosCuentaMedico extends DatosRegistroMedico {
  codigoDni: string;
  genero: Genero;
  especialidadId: string;
}

// ---------- Padrón de profesionales ----------

/**
 * Ficha de un profesional en el padrón nacional (formato del Buscador Nacional de
 * Profesionales de la Salud — argentina.gob.ar). Es la fuente contra la que se
 * verifica a un profesional antes de crearle una cuenta.
 */
export interface ProfesionalPadron {
  codigoProfesional: string;
  dni: string;
  nombre: string;
  apellido: string;
  profesion: string;
  especializaciones: string[];
  emisor: string;
  provincia: string;
  matricula: string;
  estadoMatricula: string;
}

// ---------- Notas del profesional ----------

/**
 * Nota que un profesional registra sobre un paciente. Queda asociada al profesional
 * que la escribió y solo ese profesional la ve (CLAUDE.md §10, reglas 7 y 8).
 */
export interface NotaPaciente {
  id: string;
  fecha: string;
  texto: string;
}

// ---------- Ayuda ----------

export interface PreguntaFrecuente {
  id: string;
  pregunta: string;
  respuesta: string;
}
