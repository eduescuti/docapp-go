import { EstadoEstudio, EstadoTurno } from "@/domain";
import { etiquetaTipoConsulta, hoyIso, nombreConTitulo } from "@/utils/format";

import { delay } from "./apiClient";
import { listEstudiosPaciente } from "./estudioService";
import { getInstitucion } from "./institucionService";
import { getMedico } from "./medicoService";
import { listRecetasPaciente } from "./recetaService";
import { listTurnosPaciente } from "./turnoService";

export type TipoEventoHistorial = "consulta" | "estudio" | "receta";

export interface EventoHistorial {
  id: string;
  tipo: TipoEventoHistorial;
  fecha: string; // ISO "yyyy-MM-dd"
  titulo: string;
  detalle: string;
  estado?: EstadoTurno | EstadoEstudio;
}

/** Línea de tiempo del paciente: consultas cumplidas, estudios y recetas, del más reciente al más viejo. */
export async function getHistorialPaciente(pacienteId: string): Promise<EventoHistorial[]> {
  const hoy = hoyIso();
  const [turnos, estudios, recetas] = await Promise.all([
    listTurnosPaciente(pacienteId),
    listEstudiosPaciente(pacienteId),
    listRecetasPaciente(pacienteId),
  ]);

  const consultas = await Promise.all(
    turnos
      .filter((t) => t.estado === "completado" && t.fecha <= hoy)
      .map(async (t): Promise<EventoHistorial> => {
        const medico = await getMedico(t.medicoId);
        return {
          id: t.id,
          tipo: "consulta",
          fecha: t.fecha,
          titulo: etiquetaTipoConsulta(t.tipoConsulta),
          detalle: medico ? nombreConTitulo(medico) : "Profesional",
          estado: t.estado,
        };
      }),
  );

  const eventosEstudios = await Promise.all(
    estudios.map(async (e): Promise<EventoHistorial> => {
      const institucion = await getInstitucion(e.institucionId);
      return { id: e.id, tipo: "estudio", fecha: e.fecha, titulo: e.tipo, detalle: institucion?.nombre ?? "", estado: e.estado };
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

  return delay(
    [...consultas, ...eventosEstudios, ...eventosRecetas].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    0,
  );
}
