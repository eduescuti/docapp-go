import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  Archive,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock,
  Pill,
  Repeat,
  Stethoscope,
  StickyNote,
  Timer,
} from "lucide-react-native";

import { AvisoTemporal, BotonIcono, BottomSheet, Card, CarpetasArchivo, EmptyState, EncabezadoTab, FilaProfesional, IconBadge, PrimaryButton, ScreenContainer, SeccionDetalle, TabSwitch, Text } from "@/components";
import { Receta } from "@/domain";
import {
  archivarReceta,
  CarpetaAnio,
  desarchivarReceta,
  esRecetaActiva,
  listMisRecetas,
  RecetaConDetalle,
} from "@/services";
import { useTheme } from "@/theme";
import { useAviso } from "@/hooks/useAviso";
import { useCarpetasArchivo } from "@/hooks/useCarpetasArchivo";
import { conservarSiIgual } from "@/utils/ui";
import { formatFechaLarga, nombreConTitulo } from "@/utils/format";

type Tab = "activas" | "pasadas";

/** Cuánto queda para el último día de consumo: "Quedan 12 días", "Último día de consumo". */
function textoVigencia(receta: Receta): string {
  const fecha = parseISO(receta.vigenteHasta);
  const dias = differenceInCalendarDays(fecha, new Date());

  if (dias < 0) return `Venció ${format(fecha, "dd/MM/yy")}`;
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
 * Cada receta queda asociada al profesional que la emitió.
 */
export default function RecetasScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("activas");
  const [activas, setActivas] = useState<RecetaConDetalle[]>([]);
  const [pasadas, setPasadas] = useState<RecetaConDetalle[]>([]);
  const [archivo, setArchivo] = useState<CarpetaAnio<RecetaConDetalle>[]>([]);
  const [abierta, setAbierta] = useState<RecetaConDetalle | null>(null);

  const [verArchivados, setVerArchivados] = useState(false);
  const carpetas = useCarpetasArchivo(archivo);
  const [procesando, setProcesando] = useState(false);
  const { aviso, mostrarAviso } = useAviso();

  /** Cierra el detalle y abre el perfil del profesional que la emitió (como en el detalle de un turno). */
  const irAlPerfil = (medicoId: string) => {
    if (procesando) return;
    setAbierta(null);
    router.push(`/medico/${medicoId}`);
  };

  const cargar = useCallback(async () => {
    // Un solo pedido: las recetas ya vienen con el profesional y su especialidad.
    const mis = await listMisRecetas();
    setActivas((anterior) => conservarSiIgual(anterior, mis.activas));
    setPasadas((anterior) => conservarSiIgual(anterior, mis.pasadas));
    setArchivo((anterior) => conservarSiIgual(anterior, mis.archivadas));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  /** Un nivel hacia arriba dentro de Archivados; desde la raíz, sale de Archivados. */
  const volver = () => {
    if (!carpetas.subir()) setVerArchivados(false);
  };

  const alternarArchivo = async () => {
    if (!abierta) return;
    const { receta } = abierta;
    setProcesando(true);
    try {
      if (receta.archivadoEl) {
        await desarchivarReceta(receta.id);
        mostrarAviso(`"${receta.medicacion}" volvió a Pasadas.`);
      } else {
        const archivada = await archivarReceta(receta.id);
        const mis = await listMisRecetas();
        mostrarAviso(`Archivada en ${nombreCarpeta(mis.archivadas, archivada.archivadoEl ?? "")}.`);
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
            <Stethoscope size={13} color={theme.colors.primary} />
            <Text style={[styles.datoTexto, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
              {medico ? nombreConTitulo(medico) : "Profesional"}
            </Text>
          </View>

          <View style={styles.dato}>
            <Clock size={13} color={vigente ? theme.colors.primary : theme.colors.mutedForeground} />
            <Text
              style={[
                styles.datoTexto,
                { color: vigente ? theme.colors.foreground : theme.colors.mutedForeground, fontWeight: vigente ? "600" : "400" },
              ]}
              numberOfLines={1}
            >
              {textoVigencia(receta)}
            </Text>
            <ChevronRight size={15} color={theme.colors.mutedForeground} />
          </View>
        </View>
      </Card>
    );
  };

  const lista = tab === "activas" ? activas : pasadas;
  const tituloArchivados = ["Archivados", carpetas.ruta].filter(Boolean).join(" › ");
  // Solo las pasadas se pueden archivar (las archivadas, desarchivar); las activas no tienen acción.
  const puedeArchivar = !!abierta && (!!abierta.receta.archivadoEl || !esRecetaActiva(abierta.receta));

  return (
    <ScreenContainer scroll={false}>
      <EncabezadoTab
        titulo={verArchivados ? tituloArchivados : "Mis recetas"}
        onVolver={verArchivados ? volver : undefined}
        etiquetaVolver={carpetas.carpetaAnio ? "Volver a la carpeta anterior" : "Volver a Recetas"}
        accion={
          verArchivados ? undefined : (
            <BotonIcono icono={Archive} accessibilityLabel="Ver las recetas archivadas" onPress={() => setVerArchivados(true)} />
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

      <AvisoTemporal aviso={aviso} />

      {verArchivados ? (
        <View style={styles.flex}>
          <CarpetasArchivo
            navegacion={carpetas}
            unidad={["receta", "recetas"]}
            vacio={
              <EmptyState
                icon={Archive}
                titulo="Todavía no archivaste recetas"
                descripcion="Desde una receta pasada tocá Archivar: la vas a encontrar acá, ordenada en carpetas por año y mes."
              />
            }
            keyExtractor={(d) => d.receta.id}
            renderItem={tarjetaReceta}
          />
        </View>
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
            <SeccionDetalle icono={Repeat} titulo="Cómo tomarla">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{abierta.receta.dosis}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{abierta.receta.frecuencia}</Text>
            </SeccionDetalle>
            <SeccionDetalle icono={Timer} titulo="Duración del tratamiento">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{abierta.receta.duracion}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                Hasta el {formatFechaLarga(abierta.receta.vigenteHasta)} · {textoVigencia(abierta.receta)}
              </Text>
            </SeccionDetalle>
            {abierta.receta.indicaciones ? (
              <SeccionDetalle icono={ClipboardList} titulo="Indicaciones del profesional">
                <Text style={[styles.valor, styles.parrafo, { color: theme.colors.foreground }]}>{abierta.receta.indicaciones}</Text>
              </SeccionDetalle>
            ) : null}
            {abierta.receta.observaciones ? (
              <SeccionDetalle icono={StickyNote} titulo="Observaciones">
                <Text style={[styles.valor, styles.parrafo, { color: theme.colors.foreground }]}>{abierta.receta.observaciones}</Text>
              </SeccionDetalle>
            ) : null}
            <SeccionDetalle icono={Stethoscope} titulo="Emitida por">
              {abierta.medico ? (
                <FilaProfesional medico={abierta.medico} detalle={abierta.especialidad?.nombre} onPress={() => abierta.medico && irAlPerfil(abierta.medico.id)} />
              ) : (
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>Profesional</Text>
              )}
            </SeccionDetalle>
            <SeccionDetalle icono={Calendar} titulo="Fecha de emisión">
              <Text style={[styles.valor, { color: theme.colors.foreground }]}>{formatFechaLarga(abierta.receta.fecha)}</Text>
            </SeccionDetalle>
            {abierta.receta.archivadoEl ? (
              <SeccionDetalle icono={Archive} titulo="Archivada">
                <Text style={[styles.valor, { color: theme.colors.foreground }]}>{formatFechaLarga(abierta.receta.archivadoEl)}</Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  Carpeta {nombreCarpeta(archivo, abierta.receta.archivadoEl)}
                </Text>
              </SeccionDetalle>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  lista: { paddingBottom: 32 },
  tarjeta: { marginBottom: 12 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  medicacion: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  estado: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  estadoTexto: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  pie: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  dato: { flexDirection: "row", alignItems: "center", gap: 6 },
  datoTexto: { fontSize: 13 },
  valor: { fontSize: 15, fontWeight: "500" },
  parrafo: { lineHeight: 22 },
});
