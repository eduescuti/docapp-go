import { ReactNode, useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import {
  Archive,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Folder,
  Stethoscope,
} from "lucide-react-native";

import {
  BottomSheet,
  Card,
  EmptyState,
  EncabezadoTab,
  PrimaryButton,
  ScreenContainer,
  StatusBadge,
  TabSwitch,
  Text,
  VisorPdfModal,
} from "@/components";
import { Especialidad, Estudio, Institucion, Medico, OrdenLaboratorio } from "@/domain";
import {
  archivarEstudio,
  archivarOrden,
  CarpetaAnio,
  desarchivarEstudio,
  desarchivarOrden,
  getEspecialidad,
  getInstitucion,
  getMedico,
  getOrden,
  getPacienteActual,
  getResultadoPdf,
  listArchivadosPaciente,
  listOrdenesArchivadasPaciente,
  listOrdenesPaciente,
  listResultadosPaciente,
  listResultadosVistos,
  marcarResultadoVisto,
} from "@/services";
import { useTheme } from "@/theme";
import { conservarSiIgual } from "@/utils/estable";
import { formatFechaCorta, formatFechaLarga, nombreConTitulo, tituloMedico } from "@/utils/format";

type Tab = "ordenes" | "resultados";
/** Las dos carpetas de Archivados. */
type Seccion = "ordenes" | "resultados";

const NOMBRE_SECCION: Record<Seccion, string> = { ordenes: "Órdenes", resultados: "Resultados" };

interface EstudioDetalle {
  estudio: Estudio;
  medico?: Medico;
  especialidad?: Especialidad;
  institucion?: Institucion;
  orden?: OrdenLaboratorio;
}

interface OrdenDetalle {
  orden: OrdenLaboratorio;
  medico?: Medico;
  especialidad?: Especialidad;
  institucion?: Institucion;
}

async function estudioConDetalle(estudio: Estudio): Promise<EstudioDetalle> {
  const [medico, institucion, orden] = await Promise.all([
    getMedico(estudio.medicoSolicitanteId),
    getInstitucion(estudio.institucionId),
    getOrden(estudio.ordenId),
  ]);
  const especialidad = medico ? await getEspecialidad(medico.especialidadId) : undefined;
  return { estudio, medico, especialidad, institucion, orden };
}

async function ordenConDetalle(orden: OrdenLaboratorio): Promise<OrdenDetalle> {
  const [medico, institucion] = await Promise.all([getMedico(orden.medicoId), getInstitucion(orden.institucionId)]);
  const especialidad = medico ? await getEspecialidad(medico.especialidadId) : undefined;
  return { orden, medico, especialidad, institucion };
}

/** "2026-10" → "2026 › Octubre", la carpeta donde quedó algo archivado. */
function nombreCarpeta<T>(archivo: CarpetaAnio<T>[], archivadoEl: string): string {
  const clave = archivadoEl.slice(0, 7);
  const mes = archivo.flatMap((a) => a.meses).find((m) => m.clave === clave);
  return `${clave.slice(0, 4)} › ${mes?.nombre ?? clave.slice(5)}`;
}

export default function EstudiosScreen() {
  const { theme } = useTheme();

  const [tab, setTab] = useState<Tab>("ordenes");
  // Los archivados se abren desde el botón de arriba, aparte de las pestañas.
  const [verArchivados, setVerArchivados] = useState(false);
  const [seccion, setSeccion] = useState<Seccion | null>(null);
  const [anio, setAnio] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);

  const [ordenes, setOrdenes] = useState<OrdenDetalle[]>([]);
  const [resultados, setResultados] = useState<EstudioDetalle[]>([]);
  const [archivoOrdenes, setArchivoOrdenes] = useState<CarpetaAnio<OrdenLaboratorio>[]>([]);
  const [archivoResultados, setArchivoResultados] = useState<CarpetaAnio<Estudio>[]>([]);
  const [detalleOrdenes, setDetalleOrdenes] = useState<Record<string, OrdenDetalle>>({});
  const [detalleEstudios, setDetalleEstudios] = useState<Record<string, EstudioDetalle>>({});

  const [estudioAbierto, setEstudioAbierto] = useState<EstudioDetalle | null>(null);
  const [ordenAbierta, setOrdenAbierta] = useState<OrdenDetalle | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [visor, setVisor] = useState<{ titulo: string; datos: string | null } | null>(null);
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  // Resultados que el paciente ya abrió: los demás muestran el aviso de "Nuevo" (solo frontend, no es un estado).
  const [vistos, setVistos] = useState<string[]>([]);

  const cargar = useCallback(async () => {
    const paciente = await getPacienteActual();
    setPacienteId(paciente.id);
    const [listaOrdenes, listaResultados, archOrdenes, archResultados, idsVistos] = await Promise.all([
      listOrdenesPaciente(paciente.id),
      listResultadosPaciente(paciente.id),
      listOrdenesArchivadasPaciente(paciente.id),
      listArchivadosPaciente(paciente.id),
      listResultadosVistos(paciente.id),
    ]);
    setVistos((anterior) => conservarSiIgual(anterior, idsVistos));
    const ordenesArchivadas = archOrdenes.flatMap((a) => a.meses.flatMap((m) => m.items));
    const estudiosArchivados = archResultados.flatMap((a) => a.meses.flatMap((m) => m.items));
    const [todasOrdenes, todosEstudios] = await Promise.all([
      Promise.all([...listaOrdenes, ...ordenesArchivadas].map(ordenConDetalle)),
      Promise.all([...listaResultados, ...estudiosArchivados].map(estudioConDetalle)),
    ]);
    setDetalleOrdenes((anterior) => conservarSiIgual(anterior, Object.fromEntries(todasOrdenes.map((d) => [d.orden.id, d]))));
    setDetalleEstudios((anterior) => conservarSiIgual(anterior, Object.fromEntries(todosEstudios.map((d) => [d.estudio.id, d]))));
    setOrdenes((anterior) => conservarSiIgual(anterior, todasOrdenes.slice(0, listaOrdenes.length)));
    setResultados((anterior) => conservarSiIgual(anterior, todosEstudios.slice(0, listaResultados.length)));
    setArchivoOrdenes((anterior) => conservarSiIgual(anterior, archOrdenes));
    setArchivoResultados((anterior) => conservarSiIgual(anterior, archResultados));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const archivoActual: CarpetaAnio<OrdenLaboratorio | Estudio>[] =
    seccion === "ordenes" ? archivoOrdenes : seccion === "resultados" ? archivoResultados : [];

  // Si una carpeta queda vacía (por desarchivar), se vuelve al nivel de arriba.
  const carpetaAnio = archivoActual.find((a) => a.anio === anio);
  const carpetaMes = carpetaAnio?.meses.find((m) => m.clave === mes);
  useEffect(() => {
    if (anio && !carpetaAnio) {
      setAnio(null);
      setMes(null);
    } else if (mes && !carpetaMes) {
      setMes(null);
    }
  }, [anio, mes, carpetaAnio, carpetaMes]);

  /** Un nivel hacia arriba dentro de Archivados; desde la raíz, sale de Archivados. */
  const volver = () => {
    if (mes) setMes(null);
    else if (anio) setAnio(null);
    else if (seccion) setSeccion(null);
    else setVerArchivados(false);
  };

  const alternarArchivoEstudio = async () => {
    if (!estudioAbierto) return;
    setProcesando(true);
    try {
      if (estudioAbierto.estudio.archivadoEl) {
        await desarchivarEstudio(estudioAbierto.estudio.id);
        setAviso(`"${estudioAbierto.estudio.tipo}" volvió a Resultados.`);
      } else {
        const archivado = await archivarEstudio(estudioAbierto.estudio.id);
        const nuevo = await listArchivadosPaciente(archivado.pacienteId);
        setAviso(`Archivado en Resultados › ${nombreCarpeta(nuevo, archivado.archivadoEl ?? "")}.`);
      }
      setEstudioAbierto(null);
      await cargar();
    } finally {
      setProcesando(false);
    }
  };

  const alternarArchivoOrden = async () => {
    if (!ordenAbierta) return;
    const nombre = ordenAbierta.orden.estudiosSolicitados.join(", ");
    setProcesando(true);
    try {
      if (ordenAbierta.orden.archivadoEl) {
        await desarchivarOrden(ordenAbierta.orden.id);
        setAviso(`"${nombre}" volvió a Órdenes.`);
      } else {
        const archivada = await archivarOrden(ordenAbierta.orden.id);
        const nuevo = await listOrdenesArchivadasPaciente(archivada.pacienteId);
        setAviso(`Archivada en Órdenes › ${nombreCarpeta(nuevo, archivada.archivadoEl ?? "")}.`);
      }
      setOrdenAbierta(null);
      await cargar();
    } finally {
      setProcesando(false);
    }
  };

  // Se cierra la hoja y se espera su animación antes de abrir el visor: iOS no muestra dos modales a la vez.
  const verEstudio = async (detalle: EstudioDetalle) => {
    setEstudioAbierto(null);
    await new Promise((resolver) => setTimeout(resolver, 250));
    setVisor({ titulo: detalle.estudio.tipo, datos: null });
    const datos = await getResultadoPdf(detalle.estudio.id);
    setVisor(datos ? { titulo: detalle.estudio.tipo, datos } : null);
  };

  const esNuevo = (estudio: Estudio) => !vistos.includes(estudio.id);

  /** Abrir un resultado es "verlo": el aviso de Nuevo se va. */
  const abrirEstudio = (item: EstudioDetalle) => {
    setEstudioAbierto(item);
    if (!pacienteId || !esNuevo(item.estudio)) return;
    setVistos((anterior) => [...anterior, item.estudio.id]);
    marcarResultadoVisto(pacienteId, item.estudio.id);
  };

  const tarjetaEstudio = (item: EstudioDetalle) => (
    <Card
      style={styles.tarjeta}
      onPress={() => abrirEstudio(item)}
      accessibilityLabel={`${item.estudio.tipo}, ${formatFechaCorta(item.estudio.fecha)}${esNuevo(item.estudio) ? ", resultado nuevo" : ""}. Ver detalle`}
    >
      <View style={styles.fila}>
        <View style={[styles.icono, { backgroundColor: theme.colors.accent }]}>
          <FileText size={18} color={theme.colors.accentForeground} />
        </View>
        <Text style={[styles.nombre, styles.flex, { color: theme.colors.foreground }]} numberOfLines={2}>
          {item.estudio.tipo}
        </Text>
        {esNuevo(item.estudio) ? (
          <View style={[styles.nuevo, { backgroundColor: theme.colors.accent }]}>
            <View style={[styles.nuevoPunto, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.nuevoTexto, { color: theme.colors.accentForeground }]}>Nuevo</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.pieTarjeta, { borderTopColor: theme.colors.border }]}>
        <View style={styles.dato}>
          <Calendar size={14} color={theme.colors.primary} />
          <Text style={[styles.datoTexto, { color: theme.colors.mutedForeground }]}>{formatFechaCorta(item.estudio.fecha)}</Text>
        </View>
        <View style={styles.dato}>
          <Stethoscope size={14} color={theme.colors.primary} />
          <Text style={[styles.datoTexto, { color: theme.colors.mutedForeground }]}>
            {item.medico ? `${tituloMedico(item.medico)} ${item.medico.apellido}` : ""}
          </Text>
        </View>
        <View style={styles.flex} />
        <ChevronRight size={18} color={theme.colors.mutedForeground} />
      </View>
    </Card>
  );

  const tarjetaOrden = (item: OrdenDetalle) => {
    const titulo = item.orden.estudiosSolicitados.join(", ");
    return (
      <Card
        style={styles.tarjeta}
        onPress={() => setOrdenAbierta(item)}
        accessibilityLabel={`Orden de ${titulo}, ${formatFechaCorta(item.orden.fecha)}. Ver detalle`}
      >
        <View style={styles.fila}>
          <View style={[styles.icono, { backgroundColor: theme.colors.accent }]}>
            <ClipboardList size={18} color={theme.colors.accentForeground} />
          </View>
          <Text style={[styles.nombre, styles.flex, { color: theme.colors.foreground }]} numberOfLines={2}>
            {titulo}
          </Text>
          <StatusBadge estado={item.orden.estado} />
        </View>
        <View style={[styles.pieTarjeta, { borderTopColor: theme.colors.border }]}>
          <View style={styles.dato}>
            <Calendar size={14} color={theme.colors.primary} />
            <Text style={[styles.datoTexto, { color: theme.colors.mutedForeground }]}>{formatFechaCorta(item.orden.fecha)}</Text>
          </View>
          <View style={styles.dato}>
            <Stethoscope size={14} color={theme.colors.primary} />
            <Text style={[styles.datoTexto, { color: theme.colors.mutedForeground }]}>
              {item.medico ? `${tituloMedico(item.medico)} ${item.medico.apellido}` : ""}
            </Text>
          </View>
          <View style={styles.flex} />
          <ChevronRight size={18} color={theme.colors.mutedForeground} />
        </View>
      </Card>
    );
  };

  const tarjetaCarpeta = (titulo: string, cantidad: number, onPress: () => void) => (
    <Card style={styles.tarjeta} onPress={onPress} accessibilityLabel={`Carpeta ${titulo}, ${cantidad} ${cantidad === 1 ? "elemento" : "elementos"}`}>
      <View style={styles.fila}>
        <View style={[styles.icono, { backgroundColor: theme.colors.accent }]}>
          <Folder size={18} color={theme.colors.accentForeground} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.nombre, { color: theme.colors.foreground }]}>{titulo}</Text>
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
            {cantidad} {cantidad === 1 ? "elemento" : "elementos"}
          </Text>
        </View>
        <ChevronRight size={18} color={theme.colors.mutedForeground} />
      </View>
    </Card>
  );

  const cantidadSeccion = (archivo: CarpetaAnio<unknown>[]) => archivo.reduce((n, a) => n + a.cantidad, 0);
  const tituloArchivados = ["Archivados", seccion ? NOMBRE_SECCION[seccion] : null, anio, carpetaMes?.nombre].filter(Boolean).join(" › ");

  /** Lo que se ve dentro de Archivados, según el nivel: carpetas → año → mes → elementos. */
  const contenidoArchivados = () => {
    if (!seccion) {
      return (
        <FlatList
          data={["ordenes", "resultados"] as Seccion[]}
          keyExtractor={(s) => s}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) =>
            tarjetaCarpeta(NOMBRE_SECCION[item], cantidadSeccion(item === "ordenes" ? archivoOrdenes : archivoResultados), () => setSeccion(item))
          }
        />
      );
    }
    if (archivoActual.length === 0) {
      return (
        <EmptyState
          icon={Archive}
          titulo={`No archivaste ${seccion === "ordenes" ? "órdenes" : "resultados"}`}
          descripcion={`Desde ${seccion === "ordenes" ? "una orden" : "un resultado"} tocá Archivar: lo vas a encontrar acá, ordenado en carpetas por año y mes.`}
        />
      );
    }
    if (!carpetaAnio) {
      return (
        <FlatList
          data={archivoActual}
          keyExtractor={(a) => a.anio}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => tarjetaCarpeta(item.anio, item.cantidad, () => setAnio(item.anio))}
        />
      );
    }
    if (!carpetaMes) {
      return (
        <FlatList
          data={carpetaAnio.meses}
          keyExtractor={(m) => m.clave}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => tarjetaCarpeta(item.nombre, item.items.length, () => setMes(item.clave))}
        />
      );
    }
    return seccion === "ordenes" ? (
      <FlatList
        data={carpetaMes.items.map((o) => detalleOrdenes[o.id]).filter((d): d is OrdenDetalle => !!d)}
        keyExtractor={(d) => d.orden.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => tarjetaOrden(item)}
      />
    ) : (
      <FlatList
        data={carpetaMes.items.map((e) => detalleEstudios[e.id]).filter((d): d is EstudioDetalle => !!d)}
        keyExtractor={(d) => d.estudio.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => tarjetaEstudio(item)}
      />
    );
  };

  return (
    <ScreenContainer scroll={false}>
      <EncabezadoTab
        titulo={verArchivados ? tituloArchivados : "Mis Estudios"}
        onVolver={verArchivados ? volver : undefined}
        etiquetaVolver={seccion ? "Volver a la carpeta anterior" : "Volver a Estudios"}
        accion={
          verArchivados ? undefined : (
            <Pressable
              onPress={() => setVerArchivados(true)}
              accessibilityRole="button"
              accessibilityLabel="Ver los archivados"
              hitSlop={8}
              style={[styles.botonArchivados, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            >
              <Archive size={20} color={theme.colors.primary} />
            </Pressable>
          )
        }
      />

      {verArchivados ? null : (
        <TabSwitch
          opciones={[
            { valor: "ordenes", etiqueta: "Órdenes" },
            { valor: "resultados", etiqueta: "Resultados", avisos: resultados.filter((r) => esNuevo(r.estudio)).length },
          ]}
          valor={tab}
          onChange={setTab}
        />
      )}

      {aviso ? (
        <View style={[styles.aviso, { backgroundColor: `${theme.colors.success}1F` }]} accessibilityLiveRegion="polite">
          <CheckCircle2 size={16} color={theme.colors.success} />
          <Text style={[styles.avisoTexto, { color: theme.colors.foreground }]}>{aviso}</Text>
        </View>
      ) : null}

      {verArchivados ? (
        <View style={styles.flex}>{contenidoArchivados()}</View>
      ) : tab === "ordenes" ? (
        <FlatList
          data={ordenes}
          keyExtractor={(d) => d.orden.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              titulo="No tenés órdenes médicas"
              descripcion="Las órdenes de laboratorio y estudios que te indiquen van a aparecer acá."
            />
          }
          renderItem={({ item }) => tarjetaOrden(item)}
        />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(d) => d.estudio.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon={FileText} titulo="Sin resultados" descripcion="Cuando tengas estudios con resultado, van a aparecer acá." />
          }
          renderItem={({ item }) => tarjetaEstudio(item)}
        />
      )}

      <BottomSheet
        visible={!!estudioAbierto}
        titulo={estudioAbierto?.estudio.tipo ?? ""}
        onClose={() => !procesando && setEstudioAbierto(null)}
        pie={
          estudioAbierto ? (
            <>
              <PrimaryButton label="Ver estudio" onPress={() => verEstudio(estudioAbierto)} />
              <PrimaryButton
                label={estudioAbierto.estudio.archivadoEl ? "Desarchivar" : "Archivar"}
                variant="outline"
                onPress={alternarArchivoEstudio}
                loading={procesando}
              />
            </>
          ) : undefined
        }
      >
        {estudioAbierto ? (
          <View>
            <Seccion icono={Stethoscope} titulo="Médico solicitante">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                {estudioAbierto.medico ? nombreConTitulo(estudioAbierto.medico) : "-"}
              </Text>
              {estudioAbierto.especialidad ? (
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{estudioAbierto.especialidad.nombre}</Text>
              ) : null}
            </Seccion>
            <Seccion icono={Calendar} titulo="Fecha del estudio">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{formatFechaLarga(estudioAbierto.estudio.fecha)}</Text>
            </Seccion>
            <Seccion icono={Building2} titulo="Dónde se hizo">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{estudioAbierto.institucion?.nombre ?? "-"}</Text>
              {estudioAbierto.institucion?.sedes[0] ? (
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  {estudioAbierto.institucion.sedes[0].direccion}, {estudioAbierto.institucion.sedes[0].ciudad}
                </Text>
              ) : null}
            </Seccion>
            {estudioAbierto.orden ? (
              <Seccion icono={ClipboardList} titulo="Orden médica">
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                  Del {formatFechaLarga(estudioAbierto.orden.fecha)}
                </Text>
                {estudioAbierto.orden.indicaciones ? (
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>Indicaciones: {estudioAbierto.orden.indicaciones}</Text>
                ) : null}
              </Seccion>
            ) : null}
            {estudioAbierto.estudio.archivadoEl ? (
              <Seccion icono={Archive} titulo="Archivado">
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                  {formatFechaLarga(estudioAbierto.estudio.archivadoEl)}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  Carpeta Resultados › {nombreCarpeta(archivoResultados, estudioAbierto.estudio.archivadoEl)}
                </Text>
              </Seccion>
            ) : null}
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={!!ordenAbierta}
        titulo={ordenAbierta?.orden.estudiosSolicitados.join(", ") ?? ""}
        extraTitulo={ordenAbierta ? <StatusBadge estado={ordenAbierta.orden.estado} /> : undefined}
        onClose={() => !procesando && setOrdenAbierta(null)}
        pie={
          ordenAbierta ? (
            <PrimaryButton
              label={ordenAbierta.orden.archivadoEl ? "Desarchivar" : "Archivar"}
              variant="outline"
              onPress={alternarArchivoOrden}
              loading={procesando}
            />
          ) : undefined
        }
      >
        {ordenAbierta ? (
          <View>
            <Seccion icono={Stethoscope} titulo="Médico solicitante">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                {ordenAbierta.medico ? nombreConTitulo(ordenAbierta.medico) : "-"}
              </Text>
              {ordenAbierta.especialidad ? (
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{ordenAbierta.especialidad.nombre}</Text>
              ) : null}
            </Seccion>
            <Seccion icono={Calendar} titulo="Fecha de la orden">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{formatFechaLarga(ordenAbierta.orden.fecha)}</Text>
            </Seccion>
            <Seccion icono={Building2} titulo="Dónde realizarla">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{ordenAbierta.institucion?.nombre ?? "-"}</Text>
              {ordenAbierta.institucion?.sedes[0] ? (
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  {ordenAbierta.institucion.sedes[0].direccion}, {ordenAbierta.institucion.sedes[0].ciudad}
                </Text>
              ) : null}
            </Seccion>
            {ordenAbierta.orden.indicaciones ? (
              <Seccion icono={ClipboardList} titulo="Indicaciones">
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>{ordenAbierta.orden.indicaciones}</Text>
              </Seccion>
            ) : null}
            {ordenAbierta.orden.archivadoEl ? (
              <Seccion icono={Archive} titulo="Archivada">
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                  {formatFechaLarga(ordenAbierta.orden.archivadoEl)}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  Carpeta Órdenes › {nombreCarpeta(archivoOrdenes, ordenAbierta.orden.archivadoEl)}
                </Text>
              </Seccion>
            ) : null}
          </View>
        ) : null}
      </BottomSheet>

      <VisorPdfModal visible={!!visor} titulo={visor?.titulo ?? ""} datos={visor?.datos ?? null} onClose={() => setVisor(null)} />
    </ScreenContainer>
  );
}

function Seccion({ icono: Icono, titulo, children }: { icono: typeof Calendar; titulo: string; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.seccion, { borderTopColor: theme.colors.border }]}>
      <View style={styles.dato}>
        <Icono size={14} color={theme.colors.primary} />
        <Text style={[styles.seccionTitulo, { color: theme.colors.mutedForeground }]}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  botonArchivados: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  aviso: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  avisoTexto: { flex: 1, fontSize: 13 },
  lista: { paddingBottom: 32 },
  tarjeta: { marginBottom: 12 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  icono: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  nombre: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  pieTarjeta: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  dato: { flexDirection: "row", alignItems: "center", gap: 6 },
  datoTexto: { fontSize: 13 },
  seccion: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 4 },
  seccionTitulo: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  valor: { fontSize: 15, fontWeight: "500" },
  nuevo: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  nuevoPunto: { width: 7, height: 7, borderRadius: 4 },
  nuevoTexto: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
});
