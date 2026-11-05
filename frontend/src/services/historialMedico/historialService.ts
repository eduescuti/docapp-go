import { EstadoTurno } from "@/domain";
import { hoyIso, nombreConTitulo } from "@/utils/format";

import { getEspecialidad } from "../catalogos/catalogoService";
import { listEstudiosPaciente } from "./estudioService";
import { getInstitucion } from "../catalogos/institucionService";
import { getMedico } from "../usuarios/medicoService";
import { listRecetasPaciente } from "./recetaService";
import { listTurnosPaciente } from "../turnos/turnoService";

export type TipoEventoHistorial = "consulta" | "estudio" | "receta";

export interface EventoHistorial {
  id: string;
  tipo: TipoEventoHistorial;
  fecha: string; // ISO "yyyy-MM-dd"
  titulo: string;
  detalle: string;
  estado?: EstadoTurno;
}

/** Línea de tiempo del paciente: consultas cumplidas, estudios y recetas, del más reciente al más viejo. 
 *  
 * - Tiene varias llamadas a GETs de distintas funciones, para armar la línea de tiempo completa.
*/
export async function getHistorialPaciente(): Promise<EventoHistorial[]> {
  const hoy = hoyIso();
  const [turnos, estudios, recetas] = await Promise.all([
    listTurnosPaciente(),
    listEstudiosPaciente(),
    listRecetasPaciente(),
  ]);

  const consultas = await Promise.all(
    turnos
      .filter((t) => t.estado === "completado" && t.fecha <= hoy)
      .map(async (t): Promise<EventoHistorial> => {
        const medico = await getMedico(t.medicoId);
        const especialidad = medico ? await getEspecialidad(medico.especialidadId) : undefined;
        return {
          id: t.id,
          tipo: "consulta",
          fecha: t.fecha,
          titulo: especialidad ? `Consulta de ${especialidad.nombre}` : "Consulta",
          detalle: medico ? nombreConTitulo(medico) : "Profesional",
          estado: t.estado,
        };
      }),
  );

  const eventosEstudios = await Promise.all(
    estudios.map(async (e): Promise<EventoHistorial> => {
      const institucion = await getInstitucion(e.institucionId);
      return { id: e.id, tipo: "estudio", fecha: e.fecha, titulo: e.tipo, detalle: institucion?.nombre ?? "" };
    }),
  );

  const eventosRecetas = await Promise.all(
    recetas.map(async (r): Promise<EventoHistorial> => {
      const medico = await getMedico(r.medicoId);
      return {
        id: r.id,
        tipo: "receta",
        fecha: r.fecha,
        titulo: `Receta: ${r.medicacion}`,
        detalle: medico ? nombreConTitulo(medico) : "Profesional",
      };
    }),
  );

  return [...consultas, ...eventosEstudios, ...eventosRecetas].sort((a, b) => b.fecha.localeCompare(a.fecha));
}
