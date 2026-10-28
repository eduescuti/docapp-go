import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Clock, MapPin, Trash2, X } from "lucide-react-native";

import { BackHeader, Card, EmptyState, PrimaryButton, ScreenContainer, SelectField, TabSwitch, Text } from "@/components";
import { DiaSemana, FranjaAtencion } from "@/domain";
import {
  DatosFranja,
  getMedicoActual,
  guardarMisFranjas,
  LugarDeAtencion,
  listLugaresDeAtencion,
  listMisFranjas,
} from "@/services";
import { Theme, useTheme } from "@/theme";

const NOMBRE_DIA: Record<DiaSemana, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};
const ABREVIATURA: Record<DiaSemana, string> = { 0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb" };
/** La semana empieza el lunes. */
const DIAS: DiaSemana[] = [1, 2, 3, 4, 5, 6, 0];

/** "06:00", "06:30", … "23:00": los turnos son de 30 min. */
const HORAS = Array.from({ length: 35 }, (_, i) => {
  const minutos = 6 * 60 + i * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${minutos % 60 === 0 ? "00" : "30"}`;
});

/** Vista semanal: alto de una hora y ancho de la columna de horas. */
const ALTO_HORA = 34;
const ANCHO_EJE = 34;

type Vista = "semana" | "dia";

const aDatos = ({ sedeId, diaSemana, desde, hasta }: FranjaAtencion): DatosFranja => ({ sedeId, diaSemana, desde, hasta });
const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
const duracionHoras = (f: FranjaAtencion) => (aMinutos(f.hasta) - aMinutos(f.desde)) / 60;
const formatHoras = (horas: number) => `${Number.isInteger(horas) ? horas : horas.toFixed(1).replace(".", ",")} h`;

/** Un color por lugar de atención, el mismo en las dos vistas y en la referencia. */
const paletaLugares = (theme: Theme) => [
  theme.colors.primary,
  theme.graficos[1],
  theme.graficos[2],
  theme.mapa.laboratorio,
  theme.mapa.hospital,
];

/**
 * Horarios de atención del profesional (franjas): en qué lugar atiende cada día de la semana y de qué hora a
 * qué hora. Los pacientes ven turnos de 30 min dentro de ellas. Se abre desde la Agenda.
 *
 * Se ven de dos formas: **Semana** (una columna por día, como una agenda semanal; tocar un bloque lo muestra
 * abajo para borrarlo) y **Por día** (una fila por día con sus horarios).
 */
export default function DoctorHorariosScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [franjas, setFranjas] = useState<FranjaAtencion[]>([]);
  const [lugares, setLugares] = useState<LugarDeAtencion[]>([]);
  const [vista, setVista] = useState<Vista>("semana");
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [sedeId, setSedeId] = useState<string | null>(null);
  const [dias, setDias] = useState<DiaSemana[]>([]);
  const [desde, setDesde] = useState<string | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const limpiar = () => {
    setSedeId(null);
    setDias([]);
    setDesde(null);
    setHasta(null);
    setError(null);
  };

  useFocusEffect(
    useCallback(() => {
      setAviso(null);
      (async () => {
        const medico = await getMedicoActual();
        const [f, l] = await Promise.all([listMisFranjas(), listLugaresDeAtencion(medico.sedesIds)]);
        setFranjas(f);
        setLugares(l);
        if (l.length === 1) setSedeId(l[0].sede.id);
      })();
    }, []),
  );

  const nombreLugar = (id: string) => lugares.find((l) => l.sede.id === id)?.institucion.nombre ?? "Lugar";

  const paleta = paletaLugares(theme);
  const colorDe = (id: string) => {
    const i = lugares.findIndex((l) => l.sede.id === id);
    return i < 0 ? theme.colors.mutedForeground : paleta[i % paleta.length];
  };

  const horasSemana = useMemo(() => franjas.reduce((total, f) => total + duracionHoras(f), 0), [franjas]);
  const seleccionada = franjas.find((f) => f.id === seleccionadaId) ?? null;

  const guardar = async (nuevas: DatosFranja[], texto: string) => {
    setError(null);
    setGuardando(true);
    try {
      setFranjas(await guardarMisFranjas(nuevas));
      setAviso(texto);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar los horarios.");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const agregar = async () => {
    if (!sedeId || dias.length === 0 || !desde || !hasta) return;
    const nuevas = dias.map((diaSemana) => ({ sedeId, diaSemana, desde, hasta }));
    const ok = await guardar([...franjas.map(aDatos), ...nuevas], `Agregaste ${desde}–${hasta} en ${nombreLugar(sedeId)}.`);
    if (ok) {
      limpiar();
      if (lugares.length === 1) setSedeId(lugares[0].sede.id);
      setFormAbierto(false);
    }
  };

  const borrar = async (franja: FranjaAtencion) => {
    const ok = await guardar(
      franjas.filter((f) => f.id !== franja.id).map(aDatos),
      `Borraste ${NOMBRE_DIA[franja.diaSemana].toLowerCase()} ${franja.desde}–${franja.hasta}. Los turnos ya pedidos no cambian.`,
    );
    if (ok) setSeleccionadaId(null);
  };

  const alternarDia = (dia: DiaSemana) => setDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));

  const completo = !!sedeId && dias.length > 0 && !!desde && !!hasta;
  const diasSinAtencion = DIAS.filter((dia) => !franjas.some((f) => f.diaSemana === dia));

  return (
    <ScreenContainer>
      <BackHeader titulo="Mis horarios" subtitulo="Dónde y cuándo atendés cada semana" />
      <Text style={[styles.intro, { color: theme.colors.mutedForeground }]}>
        Los pacientes ven turnos de 30 minutos dentro de cada horario, en el lugar que elegiste.
      </Text>

      {aviso ? (
        <Text style={[styles.aviso, { color: theme.colors.success }]} accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : null}

      {franjas.length === 0 ? (
        <EmptyState icon={Clock} titulo="Sin horarios" descripcion="Todavía no cargaste horarios: los pacientes no pueden pedirte turnos." />
      ) : (
        <>
          <View style={styles.resumen}>
            <Resumen valor={formatHoras(horasSemana)} etiqueta="por semana" />
            <Resumen valor={String(Math.floor(horasSemana * 2))} etiqueta="turnos posibles" />
            <Resumen valor={String(7 - diasSinAtencion.length)} etiqueta={7 - diasSinAtencion.length === 1 ? "día" : "días"} />
          </View>

          <TabSwitch<Vista>
            opciones={[
              { valor: "semana", etiqueta: "Semana" },
              { valor: "dia", etiqueta: "Por día" },
            ]}
            valor={vista}
            onChange={(v) => {
              setVista(v);
              setSeleccionadaId(null);
            }}
          />

          {vista === "semana" ? (
            <>
              <VistaSemana franjas={franjas} colorDe={colorDe} seleccionadaId={seleccionadaId} onSeleccionar={setSeleccionadaId} nombreLugar={nombreLugar} />
              {seleccionada ? (
                <Card style={[styles.detalle, { borderLeftWidth: 4, borderLeftColor: colorDe(seleccionada.sedeId) }]}>
                  <View style={styles.fila}>
                    <View style={styles.flex}>
                      <Text style={[styles.detalleDia, { color: theme.colors.foreground }]}>
                        {NOMBRE_DIA[seleccionada.diaSemana]} · {seleccionada.desde}–{seleccionada.hasta}
                      </Text>
                      <View style={styles.lugar}>
                        <MapPin size={12} color={theme.colors.mutedForeground} />
                        <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={2}>
                          {nombreLugar(seleccionada.sedeId)} · {formatHoras(duracionHoras(seleccionada))}
                        </Text>
                      </View>
                    </View>
                    <BotonBorrar franja={seleccionada} onPress={() => borrar(seleccionada)} disabled={guardando} />
                    <Pressable
                      onPress={() => setSeleccionadaId(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Cerrar el detalle"
                      style={styles.botonIcono}
                    >
                      <X size={18} color={theme.colors.mutedForeground} />
                    </Pressable>
                  </View>
                </Card>
              ) : (
                <Text style={[styles.pista, { color: theme.colors.mutedForeground }]}>Tocá un horario para verlo o borrarlo.</Text>
              )}
            </>
          ) : (
            <View style={styles.porDia}>
              {DIAS.filter((dia) => franjas.some((f) => f.diaSemana === dia)).map((dia) => (
                <View key={dia} style={[styles.filaDia, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.chipDia, { backgroundColor: theme.colors.highlight, borderRadius: theme.radii.md }]}>
                    <Text style={[styles.chipDiaTexto, { color: theme.colors.primary }]}>{ABREVIATURA[dia]}</Text>
                  </View>
                  <View style={styles.flex}>
                    {franjas
                      .filter((f) => f.diaSemana === dia)
                      .sort((a, b) => a.desde.localeCompare(b.desde))
                      .map((f) => (
                        <View key={f.id} style={styles.franjaDia}>
                          <View style={[styles.barraColor, { backgroundColor: colorDe(f.sedeId) }]} />
                          <View style={styles.flex}>
                            <Text style={[styles.horaTexto, { color: theme.colors.foreground }]}>
                              {f.desde}–{f.hasta}
                            </Text>
                            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                              {nombreLugar(f.sedeId)}
                            </Text>
                          </View>
                          <BotonBorrar franja={f} onPress={() => borrar(f)} disabled={guardando} />
                        </View>
                      ))}
                  </View>
                </View>
              ))}
              {diasSinAtencion.length > 0 ? (
                <Text style={[styles.pista, { color: theme.colors.mutedForeground }]}>
                  Sin atención: {diasSinAtencion.map((d) => NOMBRE_DIA[d].toLowerCase()).join(", ")}.
                </Text>
              ) : null}
            </View>
          )}

          {/* Referencia de colores: uno por lugar de atención. */}
          {lugares.length > 1 ? (
            <View style={styles.referencias} accessibilityLabel="Referencia de colores por lugar">
              {lugares.map((l) => (
                <View key={l.sede.id} style={styles.referencia}>
                  <View style={[styles.punto, { backgroundColor: colorDe(l.sede.id) }]} />
                  <Text style={[styles.meta, { color: theme.colors.foreground }]} numberOfLines={1}>
                    {l.institucion.nombre}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}

      {lugares.length === 0 ? (
        <Card style={styles.form}>
          <Text style={[styles.textoForm, { color: theme.colors.foreground }]}>Para cargar horarios primero elegí dónde atendés.</Text>
          <View style={styles.botones}>
            <PrimaryButton label="Elegir lugares" onPress={() => router.push("/(doctor)/lugares")} />
          </View>
        </Card>
      ) : formAbierto ? (
        <Card style={styles.form}>
          <Text variant="heading" style={[styles.tituloForm, { color: theme.colors.foreground }]}>
            Nuevo horario
          </Text>
          <SelectField
            label="Lugar"
            placeholder="Elegí dónde atendés"
            options={lugares.map((l) => ({ value: l.sede.id, label: l.institucion.nombre, description: l.sede.direccion }))}
            value={sedeId}
            onChange={setSedeId}
          />
          <Text style={[styles.etiqueta, { color: theme.colors.mutedForeground }]}>Días (podés elegir varios)</Text>
          {/* Los 7 días en una sola fila: cada botón ocupa la séptima parte del ancho. */}
          <View style={styles.dias} accessibilityRole="none">
            {DIAS.map((dia) => {
              const elegido = dias.includes(dia);
              return (
                <Pressable
                  key={dia}
                  onPress={() => alternarDia(dia)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={NOMBRE_DIA[dia]}
                  accessibilityState={{ checked: elegido }}
                  aria-checked={elegido}
                  style={[
                    styles.dia,
                    {
                      backgroundColor: elegido ? theme.colors.primary : theme.colors.card,
                      borderColor: elegido ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                >
                  <Text style={[styles.diaTexto, { color: elegido ? theme.colors.primaryForeground : theme.colors.foreground }]}>
                    {ABREVIATURA[dia]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.horas}>
            <View style={styles.flex}>
              <SelectField
                label="Desde"
                placeholder="--:--"
                options={HORAS.slice(0, -1).map((h) => ({ value: h, label: h }))}
                value={desde}
                onChange={(h) => {
                  setDesde(h);
                  if (hasta && hasta <= h) setHasta(null);
                }}
              />
            </View>
            <View style={styles.flex}>
              <SelectField
                label="Hasta"
                placeholder="--:--"
                options={HORAS.filter((h) => !desde || h > desde).map((h) => ({ value: h, label: h }))}
                value={hasta}
                onChange={setHasta}
              />
            </View>
          </View>
          {error ? (
            <Text style={[styles.error, { color: theme.colors.danger }]} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <View style={styles.botones}>
            <PrimaryButton label="Agregar horario" onPress={agregar} disabled={!completo} loading={guardando} />
            <PrimaryButton
              label="Cancelar"
              variant="outline"
              onPress={() => {
                limpiar();
                setFormAbierto(false);
              }}
            />
          </View>
        </Card>
      ) : (
        <View style={styles.botones}>
          {error ? (
            <Text style={[styles.error, { color: theme.colors.danger }]} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <PrimaryButton
            label="+ Agregar horario"
            onPress={() => {
              setAviso(null);
              setError(null);
              setSeleccionadaId(null);
              setFormAbierto(true);
            }}
          />
        </View>
      )}

      <Text style={[styles.nota, { color: theme.colors.mutedForeground }]}>
        Un mismo día no podés tener dos horarios que se pisen, aunque sean en lugares distintos. Si cambiás tus horarios,
        los turnos ya pedidos no cambian.
      </Text>
    </ScreenContainer>
  );
}

function Resumen({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.resumenItem, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.md }]}>
      <Text variant="heading" style={[styles.resumenValor, { color: theme.colors.foreground }]}>
        {valor}
      </Text>
      <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{etiqueta}</Text>
    </View>
  );
}

function BotonBorrar({ franja, onPress, disabled }: { franja: FranjaAtencion; onPress: () => void; disabled: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Borrar el horario del ${NOMBRE_DIA[franja.diaSemana].toLowerCase()} de ${franja.desde} a ${franja.hasta}`}
      style={styles.botonIcono}
    >
      <Trash2 size={18} color={theme.colors.danger} />
    </Pressable>
  );
}

interface VistaSemanaProps {
  franjas: FranjaAtencion[];
  colorDe: (sedeId: string) => string;
  seleccionadaId: string | null;
  onSeleccionar: (id: string | null) => void;
  nombreLugar: (sedeId: string) => string;
}

/**
 * Agenda semanal: una columna por día (lunes a domingo) y las horas hacia abajo, solo entre la primera y la
 * última hora con atención para que entre en la pantalla. Cada horario es un bloque del color de su lugar.
 */
function VistaSemana({ franjas, colorDe, seleccionadaId, onSeleccionar, nombreLugar }: VistaSemanaProps) {
  const { theme } = useTheme();
  const inicio = Math.floor(Math.min(...franjas.map((f) => aMinutos(f.desde))) / 60);
  const fin = Math.max(inicio + 4, Math.ceil(Math.max(...franjas.map((f) => aMinutos(f.hasta))) / 60));
  const horas = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  const hoy = new Date().getDay() as DiaSemana;

  return (
    <Card padded={false} style={styles.semana}>
      <View style={[styles.cabecera, { borderBottomColor: theme.colors.border }]}>
        <View style={{ width: ANCHO_EJE }} />
        {DIAS.map((dia) => (
          <View key={dia} style={styles.columnaCabecera}>
            <View style={[styles.letraDia, dia === hoy && { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.letraDiaTexto, { color: dia === hoy ? theme.colors.primaryForeground : theme.colors.mutedForeground }]}>
                {ABREVIATURA[dia].charAt(0)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.grilla, { height: (fin - inicio) * ALTO_HORA }]}>
        {/* Líneas de cada hora, detrás de las columnas. */}
        {horas.map((h, i) => (
          <View key={h} style={[styles.lineaHora, { top: i * ALTO_HORA }]} pointerEvents="none">
            <Text style={[styles.etiquetaHora, { color: theme.colors.mutedForeground }]}>{String(h).padStart(2, "0")}</Text>
            <View style={[styles.linea, { backgroundColor: theme.colors.border }]} />
          </View>
        ))}

        <View style={styles.columnas}>
          <View style={{ width: ANCHO_EJE }} />
          {DIAS.map((dia) => (
            <View key={dia} style={[styles.columna, { borderLeftColor: theme.colors.border }]}>
              {franjas
                .filter((f) => f.diaSemana === dia)
                .map((f) => {
                  const top = ((aMinutos(f.desde) - inicio * 60) / 60) * ALTO_HORA;
                  const alto = ((aMinutos(f.hasta) - aMinutos(f.desde)) / 60) * ALTO_HORA;
                  const color = colorDe(f.sedeId);
                  const elegida = f.id === seleccionadaId;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => onSeleccionar(elegida ? null : f.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${NOMBRE_DIA[dia]} de ${f.desde} a ${f.hasta} en ${nombreLugar(f.sedeId)}`}
                      accessibilityState={{ selected: elegida }}
                      hitSlop={{ top: 4, bottom: 4 }}
                      style={[
                        styles.bloque,
                        {
                          top,
                          height: Math.max(alto - 2, 14),
                          backgroundColor: elegida ? color : `${color}2E`,
                          borderLeftColor: color,
                        },
                      ]}
                    >
                      {alto >= 26 ? (
                        <Text style={[styles.bloqueTexto, { color: elegida ? theme.colors.background : theme.colors.foreground }]}>
                          {f.desde}
                        </Text>
                      ) : null}
                      {alto >= 52 ? (
                        <Text style={[styles.bloqueTexto, styles.bloqueFin, { color: elegida ? theme.colors.background : theme.colors.mutedForeground }]}>
                          {f.hasta}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  aviso: { fontSize: 13, marginBottom: 16 },
  resumen: { flexDirection: "row", gap: 8, marginBottom: 16 },
  resumenItem: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  resumenValor: { fontSize: 18, fontWeight: "700" },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  lugar: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  meta: { fontSize: 12, flexShrink: 1 },
  pista: { fontSize: 12, textAlign: "center", marginTop: 10 },
  botonIcono: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  // Vista semanal
  semana: { marginTop: 16, paddingBottom: 12, paddingRight: 6 },
  cabecera: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, marginBottom: 10 },
  columnaCabecera: { flex: 1, alignItems: "center" },
  letraDia: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  letraDiaTexto: { fontSize: 12, fontWeight: "700" },
  grilla: { position: "relative", marginTop: 4 },
  lineaHora: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", height: 12, marginTop: -6 },
  etiquetaHora: { width: ANCHO_EJE, fontSize: 10, textAlign: "center" },
  linea: { flex: 1, height: StyleSheet.hairlineWidth },
  columnas: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "row" },
  columna: { flex: 1, position: "relative", borderLeftWidth: StyleSheet.hairlineWidth },
  bloque: { position: "absolute", left: 2, right: 2, borderLeftWidth: 3, borderRadius: 5, paddingHorizontal: 2, paddingTop: 2, overflow: "hidden" },
  bloqueTexto: { fontSize: 9, fontWeight: "700" },
  bloqueFin: { position: "absolute", bottom: 2, left: 2 },
  detalle: { marginTop: 12 },
  detalleDia: { fontSize: 15, fontWeight: "700" },

  // Vista por día
  porDia: { marginTop: 12 },
  filaDia: { flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  chipDia: { width: 48, height: 40, alignItems: "center", justifyContent: "center", marginTop: 2 },
  chipDiaTexto: { fontSize: 13, fontWeight: "700" },
  franjaDia: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  barraColor: { width: 4, alignSelf: "stretch", borderRadius: 2, marginVertical: 4 },
  horaTexto: { fontSize: 14, fontWeight: "700" },

  referencias: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 6, marginTop: 12 },
  referencia: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "100%" },
  punto: { width: 10, height: 10, borderRadius: 5 },

  // Formulario
  form: { marginTop: 20 },
  textoForm: { fontSize: 14 },
  tituloForm: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  etiqueta: { fontSize: 12, fontWeight: "500", marginBottom: 8 },
  dias: { flexDirection: "row", gap: 4, marginBottom: 16 },
  dia: { flex: 1, height: 44, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  diaTexto: { fontSize: 12, fontWeight: "700" },
  horas: { flexDirection: "row", gap: 12 },
  error: { fontSize: 13, marginBottom: 12 },
  botones: { gap: 12, marginTop: 16 },
  nota: { fontSize: 12, lineHeight: 18, marginTop: 20, marginBottom: 32 },
});
