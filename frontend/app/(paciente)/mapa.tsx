import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Heart, List, LocateFixed, Map as MapaIcono, MapPinOff, X } from "lucide-react-native";

import { Card, Chip, MapaCentros, PedidoVuelo, PrimaryButton, PuntoMapa, Text } from "@/components";
import { Medico, PlanMedico, TipoInstitucion } from "@/domain";
import { CENTRO_CABA, useUbicacion } from "@/hooks/useUbicacion";
import {
  alternarInstitucionFavorita,
  buscarCentros,
  CentroCercano,
  getPacienteActual,
  getPlanMedico,
  listCentrosPorSedes,
  searchMedicos,
} from "@/services";
import { useTheme } from "@/theme";
import { formatDistancia, nombreConTitulo } from "@/utils/format";
import { colorTipo, ETIQUETA_TIPO, ETIQUETA_TIPO_PLURAL } from "@/utils/institucion";

const TIPOS: TipoInstitucion[] = ["hospital", "clinica", "centro_medico", "laboratorio"];

/**
 * Centros de salud que acepta la cobertura del paciente, en mapa y en lista (CLAUDE.md §9).
 * El mapa es MapLibre + OpenFreeMap: anda igual en Expo Go, en la app compilada y en web.
 *
 * Con `elegir=1` es el selector de hospital de la reserva de turnos: muestra solo las sedes de `sedes`
 * (las que tienen turnos libres) y cada tarjeta tiene "Elegir este hospital", que vuelve a Turnos.
 */
export default function MapaScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { elegir, sedes: sedesParam } = useLocalSearchParams<{ elegir?: string; sedes?: string }>();
  const eligiendo = elegir === "1";

  // Los favoritos se pueden cambiar desde otras pantallas: se vuelven a leer cada vez que el mapa vuelve a la vista.
  useFocusEffect(
    useCallback(() => {
      getPacienteActual().then((p) => setFavoritas(p.institucionesFavoritasIds));
    }, []),
  );
  const insets = useSafeAreaInsets();
  const { estado: estadoUbicacion, coordenada, actualizar } = useUbicacion({ pedirPermiso: true });

  const [pacienteId, setPacienteId] = useState<string>();
  const [favoritas, setFavoritas] = useState<string[]>([]);
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [planMedicoId, setPlanMedicoId] = useState<string>();
  const [plan, setPlan] = useState<PlanMedico>();
  const [centrosCargados, setCentrosCargados] = useState<CentroCercano[]>([]);
  const [tipo, setTipo] = useState<TipoInstitucion | null>(null);
  const [modo, setModo] = useState<"mapa" | "lista">("mapa");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [volarA, setVolarA] = useState<PedidoVuelo | null>(null);
  const [errorMapa, setErrorMapa] = useState(false);
  const [intentoMapa, setIntentoMapa] = useState(0);
  const [profesionales, setProfesionales] = useState<Medico[]>([]);
  const [altoEncabezado, setAltoEncabezado] = useState(0);
  const [altoPie, setAltoPie] = useState(0);
  const yaCentrado = useRef(false);

  useEffect(() => {
    getPacienteActual().then(async (p) => {
      setPacienteId(p.id);
      setPlanMedicoId(p.planMedicoId);
      setPlan(await getPlanMedico(p.planMedicoId));
    });
  }, []);

  useEffect(() => {
    if (!planMedicoId) return;
    let activo = true;
    const pedido = eligiendo
      ? listCentrosPorSedes(sedesParam ? sedesParam.split(",") : [], coordenada ?? undefined).then((todos) =>
          tipo ? todos.filter((c) => c.institucion.tipo === tipo) : todos,
        )
      : buscarCentros({ planMedicoId, tipos: tipo ? [tipo] : undefined, cerca: coordenada ?? undefined });
    pedido.then((resultado) => {
      if (activo) setCentrosCargados(resultado);
    });
    return () => {
      activo = false;
    };
  }, [planMedicoId, tipo, coordenada, eligiendo, sedesParam]);

  // La primera vez que llega la ubicación, la cámara va hasta el paciente.
  useEffect(() => {
    if (coordenada && !yaCentrado.current) {
      yaCentrado.current = true;
      setVolarA({ id: Date.now(), coordenada, zoom: 14 });
    }
  }, [coordenada]);

  const centros = useMemo(
    () => (soloFavoritas ? centrosCargados.filter((c) => favoritas.includes(c.institucion.id)) : centrosCargados),
    [centrosCargados, soloFavoritas, favoritas],
  );

  const alternarFavorita = async (institucionId: string) => {
    if (!pacienteId) return;
    const paciente = await alternarInstitucionFavorita(pacienteId, institucionId);
    setFavoritas(paciente.institucionesFavoritasIds);
  };

  const puntos = useMemo<PuntoMapa[]>(
    () => centros.map((c) => ({ id: c.institucion.id, latitud: c.sede.latitud, longitud: c.sede.longitud, tipo: c.institucion.tipo })),
    [centros],
  );

  const seleccionado = centros.find((c) => c.institucion.id === seleccionadoId) ?? null;

  // Si un filtro deja afuera al seleccionado, se cierra la tarjeta.
  useEffect(() => {
    if (seleccionadoId && !centros.some((c) => c.institucion.id === seleccionadoId)) setSeleccionadoId(null);
  }, [centros, seleccionadoId]);

  const sedeSeleccionadaId = seleccionado?.sede.id;
  useEffect(() => {
    if (!sedeSeleccionadaId || !planMedicoId) {
      setProfesionales([]);
      return;
    }
    searchMedicos({ sedeId: sedeSeleccionadaId, planMedicoId }).then(setProfesionales);
  }, [sedeSeleccionadaId, planMedicoId]);

  const irAMiUbicacion = () => {
    if (coordenada) setVolarA({ id: Date.now(), coordenada, zoom: 15 });
    else actualizar();
  };

  const verMasCercano = () => {
    const cercano = centros[0];
    if (!cercano) return;
    setModo("mapa");
    setSeleccionadoId(cercano.institucion.id);
  };

  const elegirDeLista = (id: string) => {
    setSeleccionadoId(id);
    setModo("mapa");
  };

  const reintentarMapa = () => {
    setErrorMapa(false);
    setIntentoMapa((n) => n + 1);
  };

  const motivo = (c: CentroCercano) =>
    c.motivo === "publica" ? "Público · atiende a todas las coberturas" : `Acepta ${plan?.nombre ?? "tu cobertura"}`;

  const cantidad = eligiendo
    ? `Elegí dónde atenderte · ${centros.length} ${centros.length === 1 ? "opción" : "opciones"}`
    : `${centros.length} ${centros.length === 1 ? "centro" : "centros"}${plan ? ` para ${plan.nombre}` : ""}`;

  // Vuelve a Turnos con el hospital elegido; "n" cambia siempre para que se aplique aunque sea el mismo.
  const elegirHospital = (sedeId: string) => {
    router.dismissTo({ pathname: "/turnos", params: { sedeElegida: sedeId, n: String(Date.now()) } });
  };
  const sinUbicacion = estadoUbicacion === "denegada" || estadoUbicacion === "error";
  const fondoFlotante = { backgroundColor: theme.colors.card, borderColor: theme.colors.border, ...theme.shadow };

  return (
    <View style={[styles.pantalla, { backgroundColor: theme.colors.background }]}>
      <MapaCentros
        key={intentoMapa}
        style={StyleSheet.absoluteFill}
        puntos={puntos}
        seleccionadoId={seleccionadoId}
        ubicacion={coordenada}
        centroInicial={coordenada ?? CENTRO_CABA}
        volarA={volarA}
        onSeleccionar={setSeleccionadoId}
        onError={() => setErrorMapa(true)}
        onListo={() => setErrorMapa(false)}
        margenInferior={altoPie > 0 ? altoPie + 20 : 0}
      />

      {modo === "lista" && (
        <FlatList
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={[styles.lista, { paddingTop: altoEncabezado + 8 }]}
          data={centros}
          keyExtractor={(c) => c.institucion.id}
          initialNumToRender={15}
          ListEmptyComponent={
            <Text style={[styles.vacio, { color: theme.colors.mutedForeground }]}>
              {soloFavoritas ? "Todavía no marcaste favoritos entre estos centros." : "No hay centros de este tipo para tu cobertura."}
            </Text>
          }
          renderItem={({ item }) => (
            <Card
              style={styles.itemLista}
              onPress={() => elegirDeLista(item.institucion.id)}
              accessibilityLabel={`${item.institucion.nombre}, ${ETIQUETA_TIPO[item.institucion.tipo]}, ${item.sede.direccion}${
                item.distanciaKm !== undefined ? `, ${formatDistancia(item.distanciaKm)}` : ""
              }. Ver en el mapa`}
            >
              <View style={styles.fila}>
                <View style={[styles.punto, { backgroundColor: colorTipo(theme.mapa, item.institucion.tipo) }]} />
                <View style={styles.flex}>
                  <Text style={[styles.nombreLista, { color: theme.colors.foreground }]}>{item.institucion.nombre}</Text>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                    {ETIQUETA_TIPO[item.institucion.tipo]} · {item.sede.direccion}
                    {item.distanciaKm !== undefined ? ` · ${formatDistancia(item.distanciaKm)}` : ""}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.primary }]}>{motivo(item)}</Text>
                </View>
                {favoritas.includes(item.institucion.id) ? (
                  <Heart size={18} color={theme.colors.danger} fill={theme.colors.danger} accessibilityLabel="Favorito" />
                ) : null}
              </View>
            </Card>
          )}
        />
      )}

      <View
        style={[styles.encabezado, { paddingTop: insets.top + 8 }]}
        onLayout={(e) => setAltoEncabezado(e.nativeEvent.layout.height)}
        pointerEvents="box-none"
      >
        <View style={styles.filaEncabezado} pointerEvents="box-none">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={4}
            style={[styles.botonRedondo, fondoFlotante]}
          >
            <ArrowLeft size={20} color={theme.colors.foreground} />
          </Pressable>
          <View style={[styles.pastilla, fondoFlotante]}>
            <Text style={[styles.pastillaTexto, { color: theme.colors.foreground }]} numberOfLines={1}>
              {cantidad}
            </Text>
          </View>
          <Pressable
            onPress={() => setModo(modo === "mapa" ? "lista" : "mapa")}
            accessibilityRole="button"
            accessibilityLabel={modo === "mapa" ? "Ver como lista" : "Ver en el mapa"}
            style={[styles.botonModo, fondoFlotante]}
          >
            {modo === "mapa" ? <List size={18} color={theme.colors.primary} /> : <MapaIcono size={18} color={theme.colors.primary} />}
            <Text style={[styles.botonModoTexto, { color: theme.colors.primary }]}>{modo === "mapa" ? "Lista" : "Mapa"}</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Todos" selected={tipo === null} onPress={() => setTipo(null)} />
          {TIPOS.map((t) => (
            <Chip key={t} label={ETIQUETA_TIPO_PLURAL[t]} selected={tipo === t} onPress={() => setTipo(t)} />
          ))}
          <Chip label="Favoritos" selected={soloFavoritas} onPress={() => setSoloFavoritas((v) => !v)} />
          {coordenada && centros.length > 0 ? <Chip label="Más cercano" onPress={verMasCercano} /> : null}
        </ScrollView>

        {sinUbicacion && (
          <View style={[styles.aviso, fondoFlotante]}>
            <MapPinOff size={16} color={theme.colors.mutedForeground} />
            <Text style={[styles.avisoTexto, { color: theme.colors.mutedForeground }]}>
              Sin tu ubicación: te mostramos el centro de CABA.
            </Text>
            <Pressable onPress={actualizar} accessibilityRole="button" accessibilityLabel="Activar ubicación" hitSlop={10}>
              <Text style={[styles.avisoAccion, { color: theme.colors.primary }]}>Activar</Text>
            </Pressable>
          </View>
        )}
      </View>

      {modo === "mapa" && (
        <View style={[styles.pie, { bottom: 16 + insets.bottom }]} pointerEvents="box-none" onLayout={(e) => setAltoPie(e.nativeEvent.layout.height)}>
          <Pressable
            onPress={irAMiUbicacion}
            accessibilityRole="button"
            accessibilityLabel="Ir a mi ubicación"
            style={[styles.botonRedondo, styles.botonUbicacion, fondoFlotante]}
          >
            <LocateFixed size={20} color={theme.colors.primary} />
          </Pressable>

          {errorMapa ? (
            <Card>
              <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>No pudimos cargar el mapa</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                Revisá tu conexión. Mientras tanto podés ver los centros en la lista.
              </Text>
              <View style={styles.acciones}>
                <View style={styles.flex}>
                  <PrimaryButton label="Ver lista" onPress={() => setModo("lista")} />
                </View>
                <View style={styles.flex}>
                  <PrimaryButton label="Reintentar" variant="outline" onPress={reintentarMapa} />
                </View>
              </View>
            </Card>
          ) : seleccionado ? (
            <Card>
              <View style={styles.fila}>
                <View style={[styles.punto, { backgroundColor: colorTipo(theme.mapa, seleccionado.institucion.tipo) }]} />
                <Text style={[styles.meta, styles.flex, { color: theme.colors.mutedForeground, marginTop: 0 }]} numberOfLines={1}>
                  {ETIQUETA_TIPO[seleccionado.institucion.tipo]} · {motivo(seleccionado)}
                </Text>
                <Pressable
                  onPress={() => alternarFavorita(seleccionado.institucion.id)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    favoritas.includes(seleccionado.institucion.id)
                      ? `Quitar ${seleccionado.institucion.nombre} de favoritos`
                      : `Agregar ${seleccionado.institucion.nombre} a favoritos`
                  }
                  accessibilityState={{ selected: favoritas.includes(seleccionado.institucion.id) }}
                  hitSlop={8}
                  style={styles.botonCorazon}
                >
                  <Heart
                    size={22}
                    color={favoritas.includes(seleccionado.institucion.id) ? theme.colors.danger : theme.colors.mutedForeground}
                    fill={favoritas.includes(seleccionado.institucion.id) ? theme.colors.danger : "transparent"}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setSeleccionadoId(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  hitSlop={12}
                >
                  <X size={18} color={theme.colors.mutedForeground} />
                </Pressable>
              </View>
              <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
                {seleccionado.institucion.nombre}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                {seleccionado.sede.direccion}, {seleccionado.sede.ciudad}
                {seleccionado.distanciaKm !== undefined ? ` · ${formatDistancia(seleccionado.distanciaKm)}` : ""}
              </Text>

              {!eligiendo && profesionales.length > 0 && (
                <View style={styles.profesionales}>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginTop: 0 }]}>Atienden acá:</Text>
                  {profesionales.slice(0, 3).map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => router.push(`/medico/${m.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver turnos con ${nombreConTitulo(m)}`}
                      style={styles.profesional}
                    >
                      <Text style={[styles.profesionalTexto, { color: theme.colors.primary }]}>{nombreConTitulo(m)}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {eligiendo ? (
                <View style={styles.acciones}>
                  <View style={styles.flex}>
                    <PrimaryButton
                      label="Elegir este hospital"
                      onPress={() => elegirHospital(seleccionado.sede.id)}
                      accessibilityLabel={`Elegir ${seleccionado.institucion.nombre} para el turno`}
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.acciones}>
                <View style={styles.flex}>
                  <PrimaryButton
                    variant={eligiendo ? "outline" : "primary"}
                    label="Cómo llegar"
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${seleccionado.sede.latitud},${seleccionado.sede.longitud}`,
                      )
                    }
                    accessibilityLabel={`Cómo llegar a ${seleccionado.institucion.nombre}`}
                  />
                </View>
                {seleccionado.sede.telefono ? (
                  <View style={styles.flex}>
                    <PrimaryButton
                      label="Llamar"
                      variant="outline"
                      onPress={() => Linking.openURL(`tel:${seleccionado.sede.telefono?.replace(/\s/g, "")}`)}
                      accessibilityLabel={`Llamar a ${seleccionado.institucion.nombre}`}
                    />
                  </View>
                ) : null}
              </View>
            </Card>
          ) : (
            <View style={[styles.leyenda, fondoFlotante]} accessibilityLabel="Referencias de colores del mapa">
              {TIPOS.map((t) => (
                <View key={t} style={styles.leyendaItem}>
                  <View style={[styles.puntoChico, { backgroundColor: colorTipo(theme.mapa, t) }]} />
                  <Text style={[styles.leyendaTexto, { color: theme.colors.foreground }]}>{ETIQUETA_TIPO[t]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  flex: { flex: 1 },
  encabezado: { position: "absolute", top: 0, left: 0, right: 0, gap: 10 },
  filaEncabezado: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 },
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pastilla: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: "center", paddingHorizontal: 16 },
  pastillaTexto: { fontSize: 13, fontWeight: "600" },
  botonModo: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  botonModoTexto: { fontSize: 13, fontWeight: "600" },
  chips: { gap: 8, paddingHorizontal: 16 },
  aviso: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avisoTexto: { flex: 1, fontSize: 12 },
  avisoAccion: { fontSize: 13, fontWeight: "700" },
  lista: { paddingHorizontal: 16, paddingBottom: 24 },
  itemLista: { marginBottom: 10 },
  vacio: { textAlign: "center", marginTop: 32, fontSize: 14 },
  fila: { flexDirection: "row", alignItems: "center", gap: 10 },
  punto: { width: 12, height: 12, borderRadius: 6 },
  puntoChico: { width: 10, height: 10, borderRadius: 5 },
  nombreLista: { fontSize: 15, fontWeight: "600" },
  nombre: { fontSize: 17, fontWeight: "700", marginTop: 8 },
  meta: { fontSize: 12, marginTop: 3 },
  pie: { position: "absolute", left: 16, right: 16, bottom: 16, gap: 12 },
  botonUbicacion: { alignSelf: "flex-end" },
  botonCorazon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginVertical: -10 },
  profesionales: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 4, marginTop: 10 },
  profesional: { minHeight: 32, justifyContent: "center", paddingHorizontal: 4 },
  profesionalTexto: { fontSize: 13, fontWeight: "600" },
  acciones: { flexDirection: "row", gap: 10, marginTop: 14 },
  leyenda: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  leyendaTexto: { fontSize: 12, fontWeight: "500" },
});
