import { ReactNode, useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  Archive,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Folder,
  Pill,
  Repeat,
  Stethoscope,
  StickyNote,
  Timer,
} from "lucide-react-native";

import { BottomSheet, Card, EmptyState, EncabezadoTab, IconBadge, PrimaryButton, ScreenContainer, TabSwitch, Text } from "@/components";
import { Receta } from "@/domain";
import {
  archivarReceta,
  CarpetaAnio,
  desarchivarReceta,
  esRecetaActiva,
  getPacienteActual,
  listMisRecetas,
  RecetaConDetalle,
} from "@/services";
import { useTheme } from "@/theme";
import { conservarSiIgual } from "@/utils/estable";
import { formatFechaCorta, formatFechaLarga, nombreConTitulo } from "@/utils/format";

type Tab = "activas" | "pasadas";

/** Cuánto queda para el último día de consumo: "Quedan 12 días", "Último día de consumo". */
function textoVigencia(receta: Receta): string {
  const dias = differenceInCalendarDays(parseISO(receta.vigenteHasta), new Date());
  if (dias < 0) return `Venció el ${formatFechaCorta(receta.vigenteHasta)}`;
  if (dias === 0) return "Hoy es el último día";
  return dias === 1 ? "Queda 1 día" : `Quedan ${dias} días`;
}

/** "2026-10" → "2026 › Octubre", la carpeta donde quedó una receta archivada. */
function nombreCarpeta(archivo: CarpetaAnio<RecetaConDetalle>[], archivadoEl: string): string {
  const clave = archivadoEl.slice(0, 7);
  const mes = archivo.flatMap((a) => a.meses).find((m) => m.clave === clave);
  return `${clave.slice(0, 4)} › ${mes?.nombre ?? clave.slice(5)}`;
}

/**
 * Pestaña Recetas: las que el paciente tiene que tomar ahora (Activas) y las que ya pasaron su fecha
 * límite de consumo (Pasadas). Las pasadas se pueden archivar, en carpetas año → mes como los estudios.
 * Cada receta queda asociada al profesional que la emitió (regla #7).
 */
export default function RecetasScreen() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>("activas");
  const [activas, setActivas] = useState<RecetaConDetalle[]>([]);
  const [pasadas, setPasadas] = useState<RecetaConDetalle[]>([]);
  const [archivo, setArchivo] = useState<CarpetaAnio<RecetaConDetalle>[]>([]);
  const [abierta, setAbierta] = useState<RecetaConDetalle | null>(null);
  // Los archivados se abren desde el botón de arriba, aparte de las pestañas.
  const [verArchivados, setVerArchivados] = useState(false);
  const [anio, setAnio] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const p = await getPacienteActual();
    // Un solo pedido: las recetas ya vienen con el profesional y su especialidad.
    const mis = await listMisRecetas(p.id);
    setActivas((anterior) => conservarSiIgual(anterior, mis.activas));
    setPasadas((anterior) => conservarSiIgual(anterior, mis.pasadas));
    setArchivo((anterior) => conservarSiIgual(anterior, mis.archivadas));
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

  /** Un nivel hacia arriba dentro de Archivados; desde la raíz, sale de Archivados. */
  const volver = () => {
    if (mes) setMes(null);
    else if (anio) setAnio(null);
    else setVerArchivados(false);
  };

  const alternarArchivo = async () => {
    if (!abierta) return;
    const { receta } = abierta;
    setProcesando(true);
    try {
      if (receta.archivadoEl) {
        await desarchivarReceta(receta.id);
        setAviso(`"${receta.medicacion}" volvió a Pasadas.`);
      } else {
        const archivada = await archivarReceta(receta.id);
        const mis = await listMisRecetas(archivada.pacienteId);
        setAviso(`Archivada en ${nombreCarpeta(mis.archivadas, archivada.archivadoEl ?? "")}.`);
      }
      setAbierta(null);
      await cargar();
    } finally {
      setProcesando(false);
    }
  };

  const tarjetaReceta = (item: RecetaConDetalle) => {
    const { receta, medico } = item;
    const vigente = esRecetaActiva(receta);
    return (
      <Card
        style={styles.tarjeta}
        onPress={() => setAbierta(item)}
        accessibilityLabel={`${receta.medicacion}, ${textoVigencia(receta)}. Ver detalle`}
      >
        <View style={styles.fila}>
          <IconBadge icon={Pill} size={40} />
          <View style={styles.flex}>
            <Text variant="heading" style={[styles.medicacion, { color: theme.colors.foreground }]} numberOfLines={2}>
              {receta.medicacion}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
              {receta.dosis} · {receta.frecuencia}
            </Text>
          </View>
          <EstadoReceta activa={vigente} />
        </View>
        <View style={[styles.pie, { borderTopColor: theme.colors.border }]}>
          <View style={styles.dato}>
            <Stethoscope size={14} color={theme.colors.primary} />
            <Text style={[styles.datoTexto, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
              {medico ? nombreConTitulo(medico) : "Profesional"}
            </Text>
          </View>
          <View style={styles.flex} />
          <View style={styles.dato}>
            <Clock size={14} color={vigente ? theme.colors.primary : theme.colors.mutedForeground} />
            <Text
              style={[styles.datoTexto, { color: vigente ? theme.colors.foreground : theme.colors.mutedForeground, fontWeight: vigente ? "600" : "400" }]}
            >
              {textoVigencia(receta)}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.mutedForeground} />
        </View>
      </Card>
    );
  };

  const tarjetaCarpeta = (titulo: string, cantidad: number, onPress: () => void) => (
    <Card style={styles.tarjeta} onPress={onPress} accessibilityLabel={`Carpeta ${titulo}, ${cantidad} ${cantidad === 1 ? "receta" : "recetas"}`}>
      <View style={styles.fila}>
        <View style={[styles.icono, { backgroundColor: theme.colors.accent }]}>
          <Folder size={18} color={theme.colors.accentForeground} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.nombreCarpeta, { color: theme.colors.foreground }]}>{titulo}</Text>
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
            {cantidad} {cantidad === 1 ? "receta" : "recetas"}
          </Text>
        </View>
        <ChevronRight size={18} color={theme.colors.mutedForeground} />
      </View>
    </Card>
  );

  /** Lo que se ve dentro de Archivados, según el nivel: año → mes → recetas. */
  const contenidoArchivados = () => {
    if (archivo.length === 0) {
      return (
        <EmptyState
          icon={Archive}
          titulo="Todavía no archivaste recetas"
          descripcion="Desde una receta pasada tocá Archivar: la vas a encontrar acá, ordenada en carpetas por año y mes."
        />
      );
    }
    if (!carpetaAnio) {
      return (
        <FlatList
          data={archivo}
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
    return (
      <FlatList
        data={carpetaMes.items}
        keyExtractor={(d) => d.receta.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => tarjetaReceta(item)}
      />
    );
  };

  const lista = tab === "activas" ? activas : pasadas;
  const tituloArchivados = ["Archivados", anio, carpetaMes?.nombre].filter(Boolean).join(" › ");
  // Solo las pasadas se pueden archivar (las archivadas, desarchivar); las activas no tienen acción.
  const puedeArchivar = !!abierta && (!!abierta.receta.archivadoEl || !esRecetaActiva(abierta.receta));

  return (
    <ScreenContainer scroll={false}>
      <EncabezadoTab
        titulo={verArchivados ? tituloArchivados : "Mis recetas"}
        onVolver={verArchivados ? volver : undefined}
        etiquetaVolver={anio ? "Volver a la carpeta anterior" : "Volver a Recetas"}
        accion={
          verArchivados ? undefined : (
            <Pressable
              onPress={() => setVerArchivados(true)}
              accessibilityRole="button"
              accessibilityLabel="Ver las recetas archivadas"
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
            { valor: "activas", etiqueta: `Activas · ${activas.length}` },
            { valor: "pasadas", etiqueta: `Pasadas · ${pasadas.length}` },
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
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(d) => d.receta.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            tab === "activas" ? (
              <EmptyState
                icon={Pill}
                titulo="No tenés recetas activas"
                descripcion="Las recetas que tenés que tomar ahora van a aparecer acá. Cuando pasa su fecha límite, quedan en Pasadas."
              />
            ) : (
              <EmptyState icon={Pill} titulo="Todavía no tenés recetas pasadas" descripcion="Acá quedan las recetas cuya fecha de consumo ya pasó." />
            )
          }
          renderItem={({ item }) => tarjetaReceta(item)}
        />
      )}

      <BottomSheet
        visible={!!abierta}
        titulo={abierta?.receta.medicacion ?? ""}
        extraTitulo={abierta ? <EstadoReceta activa={esRecetaActiva(abierta.receta)} /> : undefined}
        onClose={() => !procesando && setAbierta(null)}
        pie={
          abierta && puedeArchivar ? (
            <PrimaryButton
              label={abierta.receta.archivadoEl ? "Desarchivar" : "Archivar"}
              variant="outline"
              onPress={alternarArchivo}
              loading={procesando}
            />
          ) : undefined
        }
      >
        {abierta ? (
          <View>
            <Seccion icono={Repeat} titulo="Cómo tomarla">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{abierta.receta.dosis}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{abierta.receta.frecuencia}</Text>
            </Seccion>
            <Seccion icono={Timer} titulo="Duración del tratamiento">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{abierta.receta.duracion}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                Hasta el {formatFechaLarga(abierta.receta.vigenteHasta)} · {textoVigencia(abierta.receta)}
              </Text>
            </Seccion>
            {abierta.receta.indicaciones ? (
              <Seccion icono={ClipboardList} titulo="Indicaciones del profesional">
                <Text style={[styles.valor, styles.parrafo, { color: theme.colors.foreground }]}>{abierta.receta.indicaciones}</Text>
              </Seccion>
            ) : null}
            {abierta.receta.observaciones ? (
              <Seccion icono={StickyNote} titulo="Observaciones">
                <Text style={[styles.valor, styles.parrafo, { color: theme.colors.foreground }]}>{abierta.receta.observaciones}</Text>
              </Seccion>
            ) : null}
            <Seccion icono={Stethoscope} titulo="Emitida por">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>
                {abierta.medico ? nombreConTitulo(abierta.medico) : "Profesional"}
              </Text>
              {abierta.especialidad ? (
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{abierta.especialidad.nombre}</Text>
              ) : null}
            </Seccion>
            <Seccion icono={Calendar} titulo="Fecha de emisión">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{formatFechaLarga(abierta.receta.fecha)}</Text>
            </Seccion>
            {abierta.receta.archivadoEl ? (
              <Seccion icono={Archive} titulo="Archivada">
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>{formatFechaLarga(abierta.receta.archivadoEl)}</Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  Carpeta {nombreCarpeta(archivo, abierta.receta.archivadoEl)}
                </Text>
              </Seccion>
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </ScreenContainer>
  );
}

function EstadoReceta({ activa }: { activa: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.estado, { backgroundColor: activa ? `${theme.colors.success}22` : theme.colors.muted }]}>
      <Text style={[styles.estadoTexto, { color: activa ? theme.colors.success : theme.colors.mutedForeground }]}>
        {activa ? "Activa" : "Pasada"}
      </Text>
    </View>
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
  nombreCarpeta: { fontSize: 15, fontWeight: "600" },
  medicacion: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  estado: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  estadoTexto: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  pie: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  dato: { flexDirection: "row", alignItems: "center", gap: 6 },
  datoTexto: { fontSize: 13 },
  seccion: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 4 },
  seccionTitulo: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  valor: { fontSize: 15, fontWeight: "500" },
  parrafo: { lineHeight: 22 },
});
