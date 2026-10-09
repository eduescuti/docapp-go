import { ReactNode, useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import {
  Archive,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
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
  CarpetaAnio,
  desarchivarEstudio,
  getEspecialidad,
  getInstitucion,
  getMedico,
  getOrden,
  getPacienteActual,
  getResultadoPdf,
  listArchivadosPaciente,
  listResultadosPaciente,
} from "@/services";
import { useTheme } from "@/theme";
import { formatFechaCorta, formatFechaLarga, nombreConTitulo, tituloMedico } from "@/utils/format";

type Tab = "resultados" | "archivados";

interface EstudioDetalle {
  estudio: Estudio;
  medico?: Medico;
  especialidad?: Especialidad;
  institucion?: Institucion;
  orden?: OrdenLaboratorio;
}

async function conDetalle(estudio: Estudio): Promise<EstudioDetalle> {
  const [medico, institucion, orden] = await Promise.all([
    getMedico(estudio.medicoSolicitanteId),
    getInstitucion(estudio.institucionId),
    estudio.ordenId ? getOrden(estudio.ordenId) : undefined,
  ]);
  const especialidad = medico ? await getEspecialidad(medico.especialidadId) : undefined;
  return { estudio, medico, especialidad, institucion, orden };
}

/** "2026-10" → "2026 › Octubre", la carpeta donde quedó un estudio archivado. */
function nombreCarpeta(archivo: CarpetaAnio[], archivadoEl: string): string {
  const clave = archivadoEl.slice(0, 7);
  const mes = archivo.flatMap((a) => a.meses).find((m) => m.clave === clave);
  return `${clave.slice(0, 4)} › ${mes?.nombre ?? clave.slice(5)}`;
}

export default function EstudiosScreen() {
  const { theme } = useTheme();

  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("resultados");
  const [resultados, setResultados] = useState<EstudioDetalle[]>([]);
  const [archivo, setArchivo] = useState<CarpetaAnio[]>([]);
  const [detalles, setDetalles] = useState<Record<string, EstudioDetalle>>({});
  const [anio, setAnio] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<EstudioDetalle | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [visor, setVisor] = useState<{ titulo: string; datos: string | null } | null>(null);

  const cargar = useCallback(async () => {
    const paciente = await getPacienteActual();
    setPacienteId(paciente.id);
    const [listaResultados, listaArchivo] = await Promise.all([
      listResultadosPaciente(paciente.id),
      listArchivadosPaciente(paciente.id),
    ]);
    const archivados = listaArchivo.flatMap((a) => a.meses.flatMap((m) => m.estudios));
    const todos = await Promise.all([...listaResultados, ...archivados].map(conDetalle));
    setDetalles(Object.fromEntries(todos.map((d) => [d.estudio.id, d])));
    setResultados(todos.slice(0, listaResultados.length));
    setArchivo(listaArchivo);
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

  // Si una carpeta queda vacía (por desarchivar), se vuelve al nivel de arriba.
  const carpetaAnio = archivo.find((a) => a.anio === anio);
  const carpetaMes = carpetaAnio?.meses.find((m) => m.clave === mes);
  useEffect(() => {
    if (anio && !carpetaAnio) {
      setAnio(null);
      setMes(null);
    } else if (mes && !carpetaMes) {
      setMes(null);
    }
  }, [anio, mes, carpetaAnio, carpetaMes]);

  const alternarArchivo = async () => {
    if (!abierto || !pacienteId) return;
    setProcesando(true);
    try {
      if (abierto.estudio.archivadoEl) {
        await desarchivarEstudio(abierto.estudio.id);
        setAviso(`"${abierto.estudio.tipo}" volvió a Resultados.`);
      } else {
        const archivado = await archivarEstudio(abierto.estudio.id);
        const nuevoArchivo = await listArchivadosPaciente(pacienteId);
        setAviso(`Archivado en ${nombreCarpeta(nuevoArchivo, archivado.archivadoEl ?? "")}.`);
      }
      setAbierto(null);
      await cargar();
    } finally {
      setProcesando(false);
    }
  };

  // Se cierra la hoja y se espera su animación antes de abrir el visor: iOS no muestra dos modales a la vez.
  const verEstudio = async (detalle: EstudioDetalle) => {
    setAbierto(null);
    await new Promise((resolver) => setTimeout(resolver, 250));
    setVisor({ titulo: detalle.estudio.tipo, datos: null });
    const datos = await getResultadoPdf(detalle.estudio.id);
    setVisor(datos ? { titulo: detalle.estudio.tipo, datos } : null);
  };

  const tarjetaEstudio = (item: EstudioDetalle) => (
    <Card
      style={styles.tarjeta}
      onPress={() => setAbierto(item)}
      accessibilityLabel={`${item.estudio.tipo}, ${formatFechaCorta(item.estudio.fecha)}. Ver detalle`}
    >
      <View style={styles.fila}>
        <View style={[styles.icono, { backgroundColor: theme.colors.accent }]}>
          <FileText size={18} color={theme.colors.accentForeground} />
        </View>
        <Text style={[styles.nombre, styles.flex, { color: theme.colors.foreground }]} numberOfLines={2}>
          {item.estudio.tipo}
        </Text>
        <StatusBadge estado={item.estudio.estado} />
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

  const tarjetaCarpeta = (titulo: string, cantidad: number, onPress: () => void) => (
    <Card style={styles.tarjeta} onPress={onPress} accessibilityLabel={`Carpeta ${titulo}, ${cantidad} ${cantidad === 1 ? "estudio" : "estudios"}`}>
      <View style={styles.fila}>
        <View style={[styles.icono, { backgroundColor: theme.colors.accent }]}>
          <Folder size={18} color={theme.colors.accentForeground} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.nombre, { color: theme.colors.foreground }]}>{titulo}</Text>
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
            {cantidad} {cantidad === 1 ? "estudio" : "estudios"}
          </Text>
        </View>
        <ChevronRight size={18} color={theme.colors.mutedForeground} />
      </View>
    </Card>
  );

  const ruta = ["Archivados", anio, carpetaMes?.nombre].filter(Boolean).join(" › ");

  return (
    <ScreenContainer scroll={false}>
      <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>Mis Estudios</Text>

      <TabSwitch
        opciones={[
          { valor: "resultados", etiqueta: "Resultados" },
          { valor: "archivados", etiqueta: "Archivados" },
        ]}
        valor={tab}
        onChange={setTab}
      />

      {aviso ? (
        <View style={[styles.aviso, { backgroundColor: `${theme.colors.success}1F` }]} accessibilityLiveRegion="polite">
          <CheckCircle2 size={16} color={theme.colors.success} />
          <Text style={[styles.avisoTexto, { color: theme.colors.foreground }]}>{aviso}</Text>
        </View>
      ) : null}

      {tab === "resultados" ? (
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
      ) : archivo.length === 0 ? (
        <EmptyState
          icon={Archive}
          titulo="Todavía no archivaste estudios"
          descripcion="Desde un resultado tocá Archivar: lo vas a encontrar acá, ordenado en carpetas por año y mes."
        />
      ) : (
        <View style={styles.flex}>
          {anio ? (
            <Pressable
              onPress={() => (mes ? setMes(null) : setAnio(null))}
              accessibilityRole="button"
              accessibilityLabel="Volver a la carpeta anterior"
              style={styles.ruta}
            >
              <ChevronLeft size={18} color={theme.colors.primary} />
              <Text style={[styles.rutaTexto, { color: theme.colors.primary }]} numberOfLines={1}>
                {ruta}
              </Text>
            </Pressable>
          ) : null}
          {!carpetaAnio ? (
            <FlatList
              data={archivo}
              keyExtractor={(a) => a.anio}
              contentContainerStyle={styles.lista}
              renderItem={({ item }) => tarjetaCarpeta(item.anio, item.cantidad, () => setAnio(item.anio))}
            />
          ) : !carpetaMes ? (
            <FlatList
              data={carpetaAnio.meses}
              keyExtractor={(m) => m.clave}
              contentContainerStyle={styles.lista}
              renderItem={({ item }) => tarjetaCarpeta(item.nombre, item.estudios.length, () => setMes(item.clave))}
            />
          ) : (
            <FlatList
              data={carpetaMes.estudios.map((e) => detalles[e.id]).filter((d): d is EstudioDetalle => !!d)}
              keyExtractor={(d) => d.estudio.id}
              contentContainerStyle={styles.lista}
              renderItem={({ item }) => tarjetaEstudio(item)}
            />
          )}
        </View>
      )}

      <BottomSheet
        visible={!!abierto}
        titulo={abierto?.estudio.tipo ?? ""}
        extraTitulo={abierto ? <StatusBadge estado={abierto.estudio.estado} /> : undefined}
        onClose={() => !procesando && setAbierto(null)}
        pie={
          abierto ? (
            <>
              <PrimaryButton
                label="Ver estudio"
                onPress={() => verEstudio(abierto)}
                disabled={abierto.estudio.estado !== "resultado_disponible"}
              />
              <PrimaryButton
                label={abierto.estudio.archivadoEl ? "Desarchivar" : "Archivar"}
                variant="outline"
                onPress={alternarArchivo}
                loading={procesando}
              />
            </>
          ) : undefined
        }
      >
        {abierto ? (
          <View>
            {abierto.estudio.estado !== "resultado_disponible" ? (
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>El resultado todavía no está disponible.</Text>
            ) : null}
            <Seccion icono={Stethoscope} titulo="Médico solicitante">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                {abierto.medico ? nombreConTitulo(abierto.medico) : "-"}
              </Text>
              {abierto.especialidad ? (
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{abierto.especialidad.nombre}</Text>
              ) : null}
            </Seccion>
            <Seccion icono={Calendar} titulo="Fecha del estudio">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{formatFechaLarga(abierto.estudio.fecha)}</Text>
            </Seccion>
            <Seccion icono={Building2} titulo="Dónde se hizo">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{abierto.institucion?.nombre ?? "-"}</Text>
              {abierto.institucion?.sedes[0] ? (
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  {abierto.institucion.sedes[0].direccion}, {abierto.institucion.sedes[0].ciudad}
                </Text>
              ) : null}
            </Seccion>
            {abierto.orden ? (
              <Seccion icono={ClipboardList} titulo="Orden médica">
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                  Del {formatFechaLarga(abierto.orden.fecha)}
                </Text>
                {abierto.orden.indicaciones ? (
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>Indicaciones: {abierto.orden.indicaciones}</Text>
                ) : null}
              </Seccion>
            ) : null}
            {abierto.estudio.archivadoEl ? (
              <Seccion icono={Archive} titulo="Archivado">
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                  {formatFechaLarga(abierto.estudio.archivadoEl)}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  Carpeta {nombreCarpeta(archivo, abierto.estudio.archivadoEl)}
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
  titulo: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
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
  ruta: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 40, marginBottom: 8 },
  rutaTexto: { flex: 1, fontSize: 14, fontWeight: "600" },
  seccion: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 4 },
  seccionTitulo: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  valor: { fontSize: 15, fontWeight: "500" },
});
