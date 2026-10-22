import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, CheckCircle2, Heart, Map as MapaIcono, Star } from "lucide-react-native";

import { Especialidad, Institucion, Medico, Sede, Turno } from "@/domain";
import {
  alternarInstitucionFavorita,
  crearTurno,
  FiltroDisponibilidad,
  getInstitucion,
  getMedico,
  getPacienteActual,
  HorarioLibre,
  listDiasConTurnos,
  listEspecialidades,
  listHorariosLibres,
  searchMedicos,
} from "@/services";
import { useTheme } from "@/theme";
import { formatFechaLarga, iniciales, nombreConTitulo } from "@/utils/format";
import { ETIQUETA_TIPO } from "@/utils/institucion";
import { Avatar } from "./Avatar";
import { BottomSheet } from "./BottomSheet";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { estilosMiniCard, SEPARACION_MINI_CARDS } from "./miniCards";
import { PasoFecha, DiaTira } from "./PasoFecha";
import { PasoReserva as Paso } from "./PasoReserva";
import { PrimaryButton } from "./PrimaryButton";
import { SelectField, SelectOption } from "./SelectField";
import { Text } from "./Text";

interface ReservaTurnoProps {
  /** Entra con este profesional ya elegido (desde su perfil). */
  medicoIdInicial?: string;
  /** Hospital elegido en el mapa. `n` cambia en cada elección para que se aplique aunque sea el mismo. */
  sedeDelMapa?: { sedeId: string; n: string };
  /** El turno quedó reservado y el paciente cerró el aviso. */
  onReservado: (turno: Turno) => void;
}

/** Cuántos días hacia adelante se puede reservar. */
const DIAS_RESERVABLES = 90;
/** Valor de la opción "Cualquiera" del selector de hospitales. */
const CUALQUIERA = "__cualquiera__";

/** Qué son los favoritos y cómo repercuten en los turnos: se muestra con el "?" de "Tus favoritos". */
const AYUDA_FAVORITOS = {
  titulo: "¿Para qué sirven los favoritos?",
  lineas: [
    "Son los hospitales o centros que marcás con el corazón, en el mapa o debajo de este selector.",
    "Cuando reservás un turno, si tu favorito tiene lugar en el horario que elegiste, ya aparece elegido: no tenés que buscarlo.",
    "Si tenés varios favoritos disponibles, aparecen primero en la lista.",
    "Podés elegir otro lugar cuando quieras: tu favorito no cambia.",
  ],
};

interface SedeConInstitucion {
  sede: Sede;
  institucion: Institucion;
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Franja del día a la que pertenece un horario. */
function franja(hora: string): "Mañana" | "Tarde" | "Noche" {
  const h = Number(hora.slice(0, 2));
  if (h < 12) return "Mañana";
  return h < 20 ? "Tarde" : "Noche";
}

const sinRepetidos = <T,>(lista: T[]): T[] => [...new Set(lista)];

/**
 * Reserva de un turno en pasos: fecha → horario → hospital → especialidad → profesional.
 * Se empieza por cuándo y las opciones siguientes se arman con quién atiende en ese horario: cada paso
 * muestra solo lo que está libre (reglas 3 y 4) y de profesionales que aceptan el plan del paciente (regla 1).
 */
export function ReservaTurno({ medicoIdInicial, sedeDelMapa, onReservado }: ReservaTurnoProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [planMedicoId, setPlanMedicoId] = useState<string | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [sedes, setSedes] = useState<Record<string, SedeConInstitucion>>({});

  // Entra con hoy elegido: la tira y los pasos se muestran de entrada y los horarios se piden en paralelo con el resto.
  const [fecha, setFecha] = useState<string | null>(() => format(new Date(), "yyyy-MM-dd"));
  const fechaElegidaPorElPaciente = useRef(false);
  const [hora, setHora] = useState<string | null>(null);
  // null: todavía no eligió (rige el favorito); CUALQUIERA: eligió ver todos los lugares.
  const [sedeId, setSedeId] = useState<string | null>(null);
  const [favoritas, setFavoritas] = useState<string[]>([]);
  const [especialidadId, setEspecialidadId] = useState<string | null>(null);
  const [medicoId, setMedicoId] = useState<string | null>(null);

  const [libres, setLibres] = useState<HorarioLibre[] | null>(null);
  const [reservando, setReservando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Copia de lo reservado para el aviso: al refrescar la disponibilidad ese horario deja de estar entre las opciones.
  const [reservado, setReservado] = useState<{ turno: Turno; medico: Medico; lugar?: SedeConInstitucion } | null>(null);

  const hoy = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const limite = useMemo(() => format(addDays(new Date(), DIAS_RESERVABLES), "yyyy-MM-dd"), []);
  // Los 91 días de la tira, con sus textos ya armados (una sola vez).
  const dias = useMemo<DiaTira[]>(
    () =>
      Array.from({ length: DIAS_RESERVABLES + 1 }, (_, i) => {
        const dia = addDays(new Date(), i);
        return {
          iso: format(dia, "yyyy-MM-dd"),
          diaSemana: capitalizar(format(dia, "EEE", { locale: es })),
          diaMes: format(dia, "d"),
          etiqueta: `Elegir ${format(dia, "EEEE d 'de' MMMM", { locale: es })}`,
        };
      }),
    [],
  );

  // A quiénes se les piden los horarios: solo al profesional del perfil o a todos los que aceptan el plan.
  const filtro = useMemo<FiltroDisponibilidad | null>(
    () => (medicoIdInicial ? { medicoIds: [medicoIdInicial] } : planMedicoId ? { planMedicoId } : null),
    [medicoIdInicial, planMedicoId],
  );

  // El paciente de la sesión (ya está en la app: no espera nada).
  useEffect(() => {
    getPacienteActual().then((p) => {
      setPacienteId(p.id);
      setPlanMedicoId(p.planMedicoId);
    });
  }, []);

  // Especialidades y profesionales, y después las sedes donde atienden. Todo se pide en paralelo con los
  // horarios de más abajo: las pantallas no esperan una cadena de pedidos uno tras otro.
  useEffect(() => {
    if (!planMedicoId) return;
    let activo = true;
    (async () => {
      const [esp, lista] = await Promise.all([
        listEspecialidades(),
        // Si vienen del perfil de un profesional, la reserva es solo con él.
        medicoIdInicial
          ? getMedico(medicoIdInicial).then((m) => (m ? [m] : []))
          : searchMedicos({ planMedicoId }),
      ]);
      if (!activo) return;
      setEspecialidades(esp);
      setMedicos(lista);
      if (medicoIdInicial && lista[0]) {
        setMedicoId(lista[0].id);
        setEspecialidadId(lista[0].especialidadId);
      }
      const institucionIds = sinRepetidos(lista.flatMap((m) => m.institucionesIds));
      const instituciones = (await Promise.all(institucionIds.map(getInstitucion))).filter((i): i is Institucion => !!i);
      if (!activo) return;
      setSedes(
        Object.fromEntries(instituciones.flatMap((institucion) => institucion.sedes.map((sede) => [sede.id, { sede, institucion }]))),
      );
    })();
    return () => {
      activo = false;
    };
  }, [planMedicoId, medicoIdInicial]);

  const medicoPorId = useMemo(() => Object.fromEntries(medicos.map((m) => [m.id, m])), [medicos]);

  // Hospitales favoritos del paciente: se vuelven a leer al volver a esta pantalla (se pueden marcar en el mapa).
  useFocusEffect(
    useCallback(() => {
      getPacienteActual().then((p) => setFavoritas(p.institucionesFavoritasIds));
    }, []),
  );

  // Horarios libres del día elegido, entre todos los profesionales.
  useEffect(() => {
    setLibres(null);
    if (!fecha || !filtro) return;
    let activo = true;
    listHorariosLibres(filtro, fecha).then((lista) => activo && setLibres(lista));
    return () => {
      activo = false;
    };
  }, [fecha, filtro]);

  // Si hoy ya no quedan horarios y el paciente todavía no tocó la fecha, se pasa al primer día que tiene.
  // Cualquier otro día se puede elegir igual: qué días hay turnos lo informa el servicio (después el backend).
  useEffect(() => {
    if (libres === null || libres.length > 0 || !filtro || fechaElegidaPorElPaciente.current || fecha !== hoy) return;
    let activo = true;
    listDiasConTurnos(filtro, hoy, limite).then((lista) => {
      if (activo && lista[0] && !fechaElegidaPorElPaciente.current) setFecha(lista[0]);
    });
    return () => {
      activo = false;
    };
  }, [libres, filtro, fecha, hoy, limite]);

  // Cada paso muestra lo que queda libre según los anteriores.
  const horas = useMemo(() => sinRepetidos((libres ?? []).map((l) => l.hora)).sort(), [libres]);
  const delHorario = useMemo(() => (libres ?? []).filter((l) => l.hora === hora), [libres, hora]);
  const sedesOpcionIds = useMemo(() => sinRepetidos(delHorario.map((l) => l.sedeId)), [delHorario]);
  // Hospital favorito: si hay exactamente uno entre las opciones, queda elegido de entrada.
  const favoritasOpcionIds = useMemo(
    () => sedesOpcionIds.filter((id) => favoritas.includes(sedes[id]?.institucion.id ?? "")),
    [sedesOpcionIds, favoritas, sedes],
  );
  const favoritaPorDefectoId = favoritasOpcionIds.length === 1 ? favoritasOpcionIds[0] : null;
  // Lo que rige sin que el paciente haya elegido (favorito o única opción) no se guarda: si cambia el horario se recalcula.
  const sedeEfectivaId =
    sedeId === CUALQUIERA ? null : (sedeId ?? favoritaPorDefectoId ?? (sedesOpcionIds.length === 1 ? sedesOpcionIds[0] : null));
  const delSitio = useMemo(
    () => delHorario.filter((l) => !sedeEfectivaId || l.sedeId === sedeEfectivaId),
    [delHorario, sedeEfectivaId],
  );
  const especialidadesOpcionIds = useMemo(
    () => sinRepetidos(delSitio.map((l) => medicoPorId[l.medicoId]?.especialidadId).filter((id): id is string => !!id)),
    [delSitio, medicoPorId],
  );
  const especialidadEfectivaId = especialidadId ?? (especialidadesOpcionIds.length === 1 ? especialidadesOpcionIds[0] : null);
  const opcionesMedico = useMemo(
    () =>
      delSitio
        .filter((l) => !especialidadEfectivaId || medicoPorId[l.medicoId]?.especialidadId === especialidadEfectivaId)
        .sort((a, b) => (medicoPorId[b.medicoId]?.valoracion ?? 0) - (medicoPorId[a.medicoId]?.valoracion ?? 0)),
    [delSitio, especialidadEfectivaId, medicoPorId],
  );

  // Si un cambio de arriba deja afuera lo ya elegido más abajo, se suelta.
  useEffect(() => {
    if (libres && hora && !horas.includes(hora)) setHora(null);
  }, [libres, hora, horas]);
  useEffect(() => {
    if (hora && sedeId && sedeId !== CUALQUIERA && !sedesOpcionIds.includes(sedeId)) setSedeId(null);
  }, [hora, sedeId, sedesOpcionIds]);
  useEffect(() => {
    if (hora && especialidadId && !especialidadesOpcionIds.includes(especialidadId)) setEspecialidadId(null);
  }, [hora, especialidadId, especialidadesOpcionIds]);
  useEffect(() => {
    if (hora && libres && medicoId && !opcionesMedico.some((l) => l.medicoId === medicoId)) setMedicoId(null);
  }, [hora, libres, medicoId, opcionesMedico]);

  // Hospital elegido en el mapa.
  const ultimoDelMapa = useRef<string | null>(null);
  useEffect(() => {
    if (!sedeDelMapa || sedeDelMapa.n === ultimoDelMapa.current || sedesOpcionIds.length === 0) return;
    ultimoDelMapa.current = sedeDelMapa.n;
    if (sedesOpcionIds.includes(sedeDelMapa.sedeId)) setSedeId(sedeDelMapa.sedeId);
  }, [sedeDelMapa, sedesOpcionIds]);

  const tiraHoras = useRef<ScrollView>(null);
  // Al cambiar de día, la tira de horarios vuelve a empezar por el primero.
  useEffect(() => {
    tiraHoras.current?.scrollTo({ x: 0, animated: false });
  }, [fecha]);

  const elegirFecha = useCallback((iso: string) => {
    fechaElegidaPorElPaciente.current = true;
    setFecha(iso);
    setHora(null);
    setError(null);
  }, []);

  const elegida = opcionesMedico.find((l) => l.medicoId === medicoId);
  const medico = medicoId ? medicoPorId[medicoId] : undefined;
  const sedeElegida = elegida ? sedes[elegida.sedeId] : undefined;
  const puedeReservar = !!(pacienteId && fecha && hora && medico && elegida);

  const confirmar = async () => {
    if (!pacienteId || !fecha || !hora || !medico || !elegida) return;
    setReservando(true);
    setError(null);
    try {
      const turno = await crearTurno({
        pacienteId,
        medicoId: medico.id,
        sedeId: elegida.sedeId,
        fecha,
        hora,
        tipoConsulta: "primera_consulta",
      });
      setReservado({ turno, medico, lugar: sedes[elegida.sedeId] });
      // El horario reservado ya no está libre: se actualizan los horarios.
      if (filtro) listHorariosLibres(filtro, fecha).then(setLibres);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos reservar el turno. Intentá de nuevo.");
      // Se refresca la disponibilidad: es probable que el horario se haya ocupado.
      setHora(null);
      if (filtro) listHorariosLibres(filtro, fecha).then(setLibres);
    } finally {
      setReservando(false);
    }
  };

  const cerrarAviso = () => {
    const turno = reservado?.turno;
    setReservado(null);
    // Queda la pantalla lista para otra reserva.
    setHora(null);
    setSedeId(null);
    setMedicoId(medicoIdInicial ?? null);
    setEspecialidadId(medicoIdInicial ? (medicoPorId[medicoIdInicial]?.especialidadId ?? null) : null);
    if (turno) onReservado(turno);
  };

  const irAlMapa = () => {
    router.push({ pathname: "/mapa", params: { elegir: "1", sedes: sedesOpcionIds.join(",") } });
  };

  const hayFavoritas = favoritasOpcionIds.length > 0;
  const opcionesSede: SelectOption[] = [
    { value: CUALQUIERA, label: "Cualquiera", description: "Ver profesionales de todos los lugares" },
    ...sedesOpcionIds
      .map((id) => sedes[id])
      .filter((x): x is SedeConInstitucion => !!x)
      // Los favoritos primero, el resto por nombre.
      .sort(
        (a, b) =>
          Number(favoritas.includes(b.institucion.id)) - Number(favoritas.includes(a.institucion.id)) ||
          a.institucion.nombre.localeCompare(b.institucion.nombre, "es"),
      )
      .map(({ sede, institucion }): SelectOption => {
        const cantidad = sinRepetidos(delHorario.filter((l) => l.sedeId === sede.id).map((l) => l.medicoId)).length;
        return {
          value: sede.id,
          label: institucion.nombre,
          description: `${ETIQUETA_TIPO[institucion.tipo]}${institucion.origen === "publico" ? " público" : ""} · ${sede.direccion} · ${cantidad} ${cantidad === 1 ? "profesional" : "profesionales"}`,
          group: hayFavoritas ? (favoritas.includes(institucion.id) ? "Tus favoritos" : "Otros lugares") : undefined,
          destacada: favoritas.includes(institucion.id),
          ayudaGrupo: favoritas.includes(institucion.id) ? AYUDA_FAVORITOS : undefined,
        };
      }),
  ];

  const institucionEfectiva = sedeEfectivaId ? sedes[sedeEfectivaId]?.institucion : undefined;
  const esFavorita = !!institucionEfectiva && favoritas.includes(institucionEfectiva.id);
  const alternarFavorita = async () => {
    if (!pacienteId || !institucionEfectiva) return;
    const paciente = await alternarInstitucionFavorita(pacienteId, institucionEfectiva.id);
    setFavoritas(paciente.institucionesFavoritasIds);
  };

  return (
    <View>
      <PasoFecha fecha={fecha} hoy={hoy} limite={limite} dias={dias} onElegirFecha={elegirFecha} />

      <Paso numero={2} titulo="Horario" completo={!!hora}>
        {!fecha ? (
          <Aviso texto="Elegí una fecha para ver los horarios." />
        ) : libres === null ? (
          <Aviso texto="Buscando horarios..." />
        ) : horas.length === 0 ? (
          <Aviso texto="No hay horarios disponibles ese día. Probá con otra fecha." />
        ) : (
          // Mismo formato que la tira de días: una mini card por horario, en 24 h ("09:00", "14:30").
          <ScrollView ref={tiraHoras} horizontal showsHorizontalScrollIndicator={false} style={estilosMiniCard.tira} contentContainerStyle={{ gap: SEPARACION_MINI_CARDS }}>
            {horas.map((h) => {
              const seleccionado = h === hora;
              return (
                <Pressable
                  key={h}
                  onPress={() => {
                    setHora(h);
                    setError(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Elegir horario ${h}`}
                  accessibilityState={{ selected: seleccionado }}
                  style={[
                    estilosMiniCard.miniCard,
                    {
                      backgroundColor: seleccionado ? theme.colors.primary : theme.colors.card,
                      borderColor: seleccionado ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, color: seleccionado ? theme.colors.primaryForeground : theme.colors.mutedForeground }}>
                    {franja(h)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: seleccionado ? theme.colors.primaryForeground : theme.colors.foreground,
                    }}
                  >
                    {h}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Paso>

      <Paso numero={3} titulo="Hospital o centro" completo={!!hora && !!sedeEfectivaId}>
        {!hora ? (
          <Aviso texto="Elegí un horario para ver dónde se atiende." />
        ) : (
          <SelectField
            label="¿Dónde querés atenderte?"
            placeholder="Cualquiera"
            options={opcionesSede}
            value={sedeEfectivaId ?? CUALQUIERA}
            onChange={setSedeId}
            accion={
              <Pressable
                onPress={irAlMapa}
                accessibilityRole="button"
                accessibilityLabel="Elegir el hospital en el mapa"
                style={[styles.botonMapa, { backgroundColor: theme.colors.accent, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}
              >
                <MapaIcono size={20} color={theme.colors.accentForeground} />
              </Pressable>
            }
          />
        )}
        {hora && institucionEfectiva ? (
          <View style={styles.favorito}>
            {sedeId === null && favoritaPorDefectoId ? (
              <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]}>
                Te propusimos tu hospital favorito. Podés elegir otro.
              </Text>
            ) : null}
            <Pressable
              onPress={alternarFavorita}
              accessibilityRole="button"
              accessibilityLabel={
                esFavorita
                  ? `Quitar ${institucionEfectiva.nombre} de tus hospitales favoritos`
                  : `Guardar ${institucionEfectiva.nombre} como tu hospital favorito`
              }
              style={styles.botonFavorito}
            >
              <Heart
                size={16}
                color={esFavorita ? theme.colors.danger : theme.colors.primary}
                fill={esFavorita ? theme.colors.danger : "transparent"}
              />
              <Text style={[styles.botonFavoritoTexto, { color: esFavorita ? theme.colors.danger : theme.colors.primary }]}>
                {esFavorita ? "Es tu favorito · Quitar" : "Guardar como mi hospital favorito"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </Paso>

      <Paso numero={4} titulo="Especialidad" completo={!!especialidadEfectivaId}>
        {!hora ? (
          <Aviso texto="Elegí un horario para ver las especialidades." />
        ) : especialidadesOpcionIds.length === 0 ? (
          <Aviso texto="No hay especialidades disponibles con esos filtros." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {especialidadesOpcionIds.length > 1 ? (
              <Chip label="Todas" selected={!especialidadEfectivaId} onPress={() => setEspecialidadId(null)} />
            ) : null}
            {especialidadesOpcionIds.map((id) => {
              const nombre = especialidades.find((e) => e.id === id)?.nombre ?? id;
              return <Chip key={id} label={nombre} selected={especialidadEfectivaId === id} onPress={() => setEspecialidadId(id)} />;
            })}
          </ScrollView>
        )}
      </Paso>

      <Paso numero={5} titulo="Profesional" completo={!!medico}>
        {!hora ? (
          <Aviso texto="Elegí un horario para ver los profesionales." />
        ) : opcionesMedico.length === 0 ? (
          <Aviso texto="No hay profesionales con esos filtros. Probá con otro hospital o especialidad." />
        ) : (
          opcionesMedico.map((l) => {
            const m = medicoPorId[l.medicoId];
            if (!m) return null;
            const seleccionado = m.id === medicoId;
            const especialidad = especialidades.find((e) => e.id === m.especialidadId);
            return (
              <Pressable
                key={m.id}
                onPress={() => setMedicoId(seleccionado ? null : m.id)}
                accessibilityRole="button"
                accessibilityLabel={`${nombreConTitulo(m)}, ${especialidad?.nombre ?? m.profesion}`}
                accessibilityState={{ selected: seleccionado }}
                style={[
                  styles.medico,
                  {
                    backgroundColor: seleccionado ? theme.colors.accent : theme.colors.card,
                    borderColor: seleccionado ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radii.lg,
                  },
                ]}
              >
                <Avatar uri={m.avatarUrl} iniciales={iniciales(m.nombre, m.apellido)} size={48} />
                <View style={styles.flex}>
                  <Text style={[styles.medicoNombre, { color: theme.colors.foreground }]} numberOfLines={1}>
                    {nombreConTitulo(m)}
                  </Text>
                  <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                    {[especialidad?.nombre ?? m.profesion, m.subespecialidad].filter(Boolean).join(" · ")}
                  </Text>
                  <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                    {sedes[l.sedeId]?.institucion.nombre}
                  </Text>
                </View>
                <View style={styles.derecha}>
                  <View style={styles.valoracion}>
                    <Star size={12} color="#EAB308" fill="#EAB308" />
                    <Text style={styles.valoracionTexto}>{m.valoracion.toFixed(1)}</Text>
                  </View>
                  {seleccionado ? <Check size={18} color={theme.colors.primary} /> : null}
                </View>
              </Pressable>
            );
          })
        )}
      </Paso>

      {puedeReservar && medico && sedeElegida && fecha && hora ? (
        <Card style={[styles.resumen, { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}>
          <Text style={[styles.resumenTitulo, { color: theme.colors.accentForeground }]}>Tu turno</Text>
          <Text style={[styles.resumenLinea, { color: theme.colors.foreground }]}>
            {especialidades.find((e) => e.id === medico.especialidadId)?.nombre ?? medico.profesion}
          </Text>
          <Text style={[styles.detalle, { color: theme.colors.foreground }]}>{nombreConTitulo(medico)}</Text>
          <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]}>
            {formatFechaLarga(fecha)} · {hora} h
          </Text>
          <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]}>
            {sedeElegida.institucion.nombre} · {sedeElegida.sede.direccion}
          </Text>
        </Card>
      ) : null}

      {error ? (
        <View style={[styles.error, { backgroundColor: `${theme.colors.danger}1A`, borderRadius: theme.radii.md }]} accessibilityLiveRegion="polite">
          <Text style={{ color: theme.colors.danger, fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label="Confirmar turno"
        onPress={confirmar}
        disabled={!puedeReservar}
        loading={reservando}
        accessibilityLabel="Confirmar turno"
      />

      <BottomSheet
        visible={!!reservado}
        titulo="Turno confirmado"
        onClose={cerrarAviso}
        pie={<PrimaryButton label="Ver mis turnos" onPress={cerrarAviso} />}
      >
        {reservado ? (
          <View style={styles.exito}>
            <CheckCircle2 size={40} color={theme.colors.success} />
            <Text style={[styles.resumenLinea, { color: theme.colors.foreground }]}>
              {especialidades.find((e) => e.id === reservado.medico.especialidadId)?.nombre ?? reservado.medico.profesion}
            </Text>
            <Text style={[styles.detalle, { color: theme.colors.foreground }]}>{nombreConTitulo(reservado.medico)}</Text>
            <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]}>
              {formatFechaLarga(reservado.turno.fecha)} · {reservado.turno.hora} h
            </Text>
            {reservado.lugar ? (
              <Text style={[styles.detalle, { color: theme.colors.mutedForeground }]}>
                {reservado.lugar.institucion.nombre} · {reservado.lugar.sede.direccion}
              </Text>
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function Aviso({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return <Text style={[styles.vacio, { color: theme.colors.mutedForeground }]}>{texto}</Text>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { gap: 8, alignItems: "center" },
  vacio: { fontSize: 13, lineHeight: 19 },
  favorito: { gap: 2 },
  botonFavorito: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 44 },
  botonFavoritoTexto: { fontSize: 13, fontWeight: "600" },
  botonMapa: { width: 48, height: 48, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  medico: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  medicoNombre: { fontSize: 14, fontWeight: "600" },
  detalle: { fontSize: 12, marginTop: 2 },
  derecha: { alignItems: "flex-end", gap: 6 },
  valoracion: { flexDirection: "row", alignItems: "center", gap: 3 },
  valoracionTexto: { fontSize: 12, fontWeight: "600", color: "#EAB308" },
  resumen: { marginBottom: 16, gap: 2 },
  resumenTitulo: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  resumenLinea: { fontSize: 16, fontWeight: "700" },
  error: { padding: 12, marginBottom: 12 },
  exito: { alignItems: "center", gap: 6, paddingVertical: 8 },
});
