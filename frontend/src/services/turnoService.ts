import { addDays, addMinutes, format, parseISO } from "date-fns";

import { Especialidad, Institucion, Medico, Sede, Turno } from "@/domain";
import { especialidadesMock, medicosMock, turnosMock } from "@/mocks";

import { delay } from "./apiClient";
import { getInstitucionEnMemoria, getSedeEnMemoria } from "./institucionService";

// Estado en memoria: simula la tabla de turnos hasta que exista backend real.
let turnos: Turno[] = [...turnosMock];

/** Acceso sincrónico para otros services (p. ej. pacientes asignados). Las pantallas usan las funciones async. */
export function getTurnosEnMemoria(): Turno[] {
  return turnos;
}

export async function listTurnosMedico(medicoId: string): Promise<Turno[]> {
  return delay(
    turnos
      .filter((t) => t.medicoId === medicoId)
      .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`)),
  );
}

export async function listTurnosPaciente(pacienteId: string): Promise<Turno[]> {
  return delay(turnos.filter((t) => t.pacienteId === pacienteId));
}

/** Un turno con el profesional, la especialidad y el lugar ya resueltos, como lo devolvería un endpoint con joins. */
export interface TurnoConDetalle {
  turno: Turno;
  medico?: Medico;
  especialidad?: Especialidad;
  sede?: Sede;
  institucion?: Institucion;
}

function conDetalle(turno: Turno): TurnoConDetalle {
  const medico = medicosMock.find((m) => m.id === turno.medicoId);
  const sede = getSedeEnMemoria(turno.sedeId);
  return {
    turno,
    medico,
    especialidad: medico ? especialidadesMock.find((e) => e.id === medico.especialidadId) : undefined,
    sede,
    institucion: sede ? getInstitucionEnMemoria(sede.institucionId) : undefined,
  };
}

export interface MisTurnos {
  proximos: TurnoConDetalle[];
  historial: TurnoConDetalle[];
}

/** Prioridad en "Próximos": los confirmados arriba de todo, después los reprogramados, los pendientes y al final los rechazados. */
const PRIORIDAD_PROXIMOS: Record<Turno["estado"], number> = {
  confirmado: 0,
  reprogramado: 1,
  pendiente: 2,
  rechazado: 3,
  cancelado: 4,
  completado: 5,
};

/**
 * Turnos de la pantalla "Mis turnos". Próximos: los solicitados desde hoy, sin cancelar ni completar
 * (confirmados primero y, dentro de cada estado, del más cercano al más lejano). Historial: el resto,
 * sin los que el paciente sacó (del más reciente al más viejo).
 */
function clasificarMisTurnos(pacienteId: string): { proximos: Turno[]; historial: Turno[] } {
  const hoy = new Date().toISOString().slice(0, 10);
  const propios = turnos.filter((t) => t.pacienteId === pacienteId);
  const esProximo = (t: Turno) => t.fecha >= hoy && t.estado !== "cancelado" && t.estado !== "completado";
  const orden = (a: Turno, b: Turno) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`);
  const porPrioridad = (a: Turno, b: Turno) => PRIORIDAD_PROXIMOS[a.estado] - PRIORIDAD_PROXIMOS[b.estado] || orden(a, b);
  return {
    proximos: propios.filter(esProximo).sort(porPrioridad),
    historial: propios.filter((t) => !esProximo(t) && !t.ocultoEnHistorial).sort((a, b) => orden(b, a)),
  };
}

export async function listMisTurnos(pacienteId: string): Promise<MisTurnos> {
  const { proximos, historial } = clasificarMisTurnos(pacienteId);
  return delay({ proximos: proximos.map(conDetalle), historial: historial.map(conDetalle) });
}

/** Saca un turno del historial del paciente. Solo se oculta: el registro médico no se borra. */
export async function ocultarTurnoDelHistorial(turnoId: string): Promise<void> {
  turnos = turnos.map((t) => (t.id === turnoId ? { ...t, ocultoEnHistorial: true } : t));
  return delay(undefined);
}

/** "Eliminar todo" del historial: oculta todos los turnos que hoy figuran en él. */
export async function vaciarHistorialTurnos(pacienteId: string): Promise<void> {
  const ids = new Set(clasificarMisTurnos(pacienteId).historial.map((t) => t.id));
  turnos = turnos.map((t) => (ids.has(t.id) ? { ...t, ocultoEnHistorial: true } : t));
  return delay(undefined);
}

/** El próximo turno (confirmado o pendiente) de la fecha más cercana, con su detalle. */
export async function getProximoTurno(pacienteId: string): Promise<TurnoConDetalle | undefined> {
  const hoy = new Date().toISOString().slice(0, 10);
  const proximos = turnos
    .filter((t) => t.pacienteId === pacienteId)
    .filter((t) => t.estado === "confirmado" || t.estado === "pendiente")
    .filter((t) => t.fecha >= hoy)
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
  return delay(proximos[0] ? conDetalle(proximos[0]) : undefined);
}

/** Duración de cada turno, en minutos. */
const DURACION_TURNO_MIN = 30;

/**
 * Regla #3 (CLAUDE.md §10): los horarios salen de lo que configuró el profesional en esa sede.
 *
 * Por ahora el mismo horario rige todos los días (se ignora `diaSemana`): qué días atiende cada
 * profesional lo va a definir el backend, no el frontend.
 */
function horariosDelDia(medico: Medico, sedeId: string, fechaIso: string): string[] {
  const horas: string[] = [];
  for (const bloque of medico.horarios) {
    if (bloque.sedeId !== sedeId) continue;
    const fin = parseISO(`${fechaIso}T${bloque.horaFin}`);
    for (let t = parseISO(`${fechaIso}T${bloque.horaInicio}`); t < fin; t = addMinutes(t, DURACION_TURNO_MIN)) {
      horas.push(format(t, "HH:mm"));
    }
  }
  return horas.sort();
}

/** Los turnos del profesional ocupan su horario sin importar la sede (regla #4). Uno cancelado o rechazado lo libera. */
function estaOcupado(medicoId: string, fechaIso: string, hora: string): boolean {
  return turnos.some(
    (t) =>
      t.medicoId === medicoId &&
      t.fecha === fechaIso &&
      t.hora === hora &&
      t.estado !== "cancelado" &&
      t.estado !== "rechazado",
  );
}

export interface HorarioLibre {
  medicoId: string;
  sedeId: string;
  hora: string; // "09:30"
}

/** Horarios libres de un profesional un día, en todas sus sedes. Los que ya pasaron hoy no cuentan. */
function horariosLibresDelMedico(medico: Medico, fechaIso: string): HorarioLibre[] {
  const ahora = format(new Date(), "yyyy-MM-dd HH:mm");
  const libres: HorarioLibre[] = [];
  // Un profesional no puede estar en dos sedes a la misma hora: si sus bloques se pisan, queda el primero.
  const tomadas = new Set<string>();
  for (const sedeId of new Set(medico.horarios.map((h) => h.sedeId))) {
    for (const hora of horariosDelDia(medico, sedeId, fechaIso)) {
      if (tomadas.has(hora)) continue;
      if (!estaOcupado(medico.id, fechaIso, hora) && `${fechaIso} ${hora}` > ahora) {
        tomadas.add(hora);
        libres.push({ medicoId: medico.id, sedeId, hora });
      }
    }
  }
  return libres;
}

/**
 * A qué profesionales se refiere una consulta de disponibilidad: uno o varios puntuales (`medicoIds`) o todos
 * los que aceptan un plan (`planMedicoId`, regla 1). Así la pantalla no tiene que pedir primero la lista de
 * profesionales para después pedir sus horarios.
 */
export interface FiltroDisponibilidad {
  medicoIds?: string[];
  planMedicoId?: string;
}

function medicosDelFiltro({ medicoIds, planMedicoId }: FiltroDisponibilidad): Medico[] {
  return medicosMock.filter(
    (m) => (!medicoIds || medicoIds.includes(m.id)) && (!planMedicoId || m.planesAceptadosIds.includes(planMedicoId)),
  );
}

/**
 * Horarios libres de un día entre varios profesionales (la reserva empieza por la fecha y el horario,
 * y después se elige dónde y con quién). Con backend sería `GET /turnos/disponibles?fecha=&plan=&medicos=`.
 */
export async function listHorariosLibres(filtro: FiltroDisponibilidad, fechaIso: string): Promise<HorarioLibre[]> {
  return delay(medicosDelFiltro(filtro).flatMap((m) => horariosLibresDelMedico(m, fechaIso)));
}

/** Días (ISO) del rango `[desde, hasta]` en que alguno de los profesionales tiene un horario libre. */
export async function listDiasConTurnos(filtro: FiltroDisponibilidad, desdeIso: string, hastaIso: string): Promise<string[]> {
  const medicos = medicosDelFiltro(filtro);
  const dias: string[] = [];
  const hasta = parseISO(hastaIso);
  for (let dia = parseISO(desdeIso); dia <= hasta; dia = addDays(dia, 1)) {
    const iso = format(dia, "yyyy-MM-dd");
    if (medicos.some((m) => horariosLibresDelMedico(m, iso).length > 0)) dias.push(iso);
  }
  return delay(dias);
}

export interface DatosNuevoTurno {
  pacienteId: string;
  medicoId: string;
  sedeId: string;
  fecha: string;
  hora: string;
  tipoConsulta: Turno["tipoConsulta"];
}

/** Regla de negocio #4 (CLAUDE.md §10): una reserva bloquea el horario, no puede haber doble reserva. */
export async function crearTurno(datos: DatosNuevoTurno): Promise<Turno> {
  const medico = medicosMock.find((m) => m.id === datos.medicoId);
  const enHorario = medico ? horariosDelDia(medico, datos.sedeId, datos.fecha).includes(datos.hora) : false;
  if (!enHorario || estaOcupado(datos.medicoId, datos.fecha, datos.hora)) {
    throw new Error("Ese horario ya no está disponible.");
  }

  const nuevoTurno: Turno = {
    id: `turno-${Date.now()}`,
    estado: "confirmado",
    ...datos,
  };
  turnos = [...turnos, nuevoTurno];
  return delay(nuevoTurno);
}

export async function cancelarTurno(turnoId: string): Promise<Turno> {
  turnos = turnos.map((t) => (t.id === turnoId ? { ...t, estado: "cancelado" } : t));
  const actualizado = turnos.find((t) => t.id === turnoId);
  if (!actualizado) throw new Error("Turno no encontrado");
  return delay(actualizado);
}

export async function reprogramarTurno(turnoId: string, fecha: string, hora: string): Promise<Turno> {
  turnos = turnos.map((t) => (t.id === turnoId ? { ...t, fecha, hora, estado: "reprogramado" } : t));
  const actualizado = turnos.find((t) => t.id === turnoId);
  if (!actualizado) throw new Error("Turno no encontrado");
  return delay(actualizado);
}
