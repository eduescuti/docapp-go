import { ReactNode, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Building2, CheckCircle2, Heart, MapPin, ShieldCheck, Star } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Avatar, Card, PrimaryButton, Text } from "@/components";
import { Especialidad, Medico, ObraSocialConPlanes, PlanConObraSocial } from "@/domain";
import {
  alternarMedicoFavorito,
  esMedicoFavorito,
  getEspecialidad,
  getMedico,
  getPacienteActual,
  getPlanMedico,
  listLugaresDeAtencion,
  listObrasSociales,
  LugarDeAtencion,
} from "@/services";
import { useTheme } from "@/theme";
import { cubrePlan, resumenPlanes } from "@/utils/cobertura";
import { iniciales, nombreConTitulo } from "@/utils/format";
import { alPresionar } from "@/utils/ui";

const ROJO_FAVORITO = "#EF4444";
const AMARILLO = "#EAB308";
const TAMANO_AVATAR = 112;

interface Perfil {
  medico: Medico;
  especialidad?: Especialidad;
  lugares: LugarDeAtencion[];
  obrasSociales: ObraSocialConPlanes[];
  plan?: PlanConObraSocial;
}

/** Hace los pedidos del perfil: lo que no depende del profesional va en paralelo con él. */
async function cargarPerfil(id: string): Promise<Perfil | null> {
  const [medico, obrasSociales, paciente] = await Promise.all([getMedico(id), listObrasSociales(), getPacienteActual()]);
  if (!medico) return null;
  const [especialidad, lugares, plan] = await Promise.all([
    getEspecialidad(medico.especialidadId),
    listLugaresDeAtencion(medico.sedesIds),
    getPlanMedico(paciente.planMedicoId),
  ]);
  return { medico, especialidad, lugares, obrasSociales, plan };
}

/**
 * Perfil público de un profesional, visto por el paciente: foto, especialidad, valoración, dónde atiende y qué
 * coberturas atiende. Desde acá se solicita un turno con él (si atiende el plan del paciente) y se marca
 * como favorito. No muestra horarios: la disponibilidad sale de sus franjas, en la reserva.
 */
export default function MedicoProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);

  useEffect(() => {
    if (!id) return;
    cargarPerfil(id).then(setPerfil);
    esMedicoFavorito(id).then(setEsFavorito);
  }, [id]);

  const alternarFavorito = async () => {
    if (!id) return;
    setEsFavorito(await alternarMedicoFavorito(id));
  };

  if (!perfil) return <View style={[styles.flex, { backgroundColor: theme.colors.background }]} />;

  const { medico, especialidad, lugares, obrasSociales, plan } = perfil;
  const nombre = nombreConTitulo(medico);
  const atiendeMiPlan = plan ? cubrePlan(medico.coberturas, plan) : false;
  const especialidadTexto = [especialidad?.nombre, medico.subespecialidad].filter(Boolean).join(" · ");
  const tieneValoraciones = medico.cantidadValoraciones > 0;

  const botonRedondo = (icono: ReactNode, onPress: () => void, etiqueta: string) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      hitSlop={4}
      style={({ pressed }) => [
        styles.botonRedondo,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        alPresionar(pressed, 0.94),
      ]}
    >
      {icono}
    </Pressable>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Franja de color detrás de la foto, con volver y favorito encima. */}
        <View
          style={[
            styles.franja,
            { backgroundColor: theme.colors.highlight, paddingTop: insets.top + 12, height: insets.top + 132 },
          ]}
        >
          {botonRedondo(<ArrowLeft size={20} color={theme.colors.foreground} />, () => router.back(), "Volver")}
          {botonRedondo(
            <Heart
              size={20}
              color={esFavorito ? ROJO_FAVORITO : theme.colors.foreground}
              fill={esFavorito ? ROJO_FAVORITO : "transparent"}
            />,
            alternarFavorito,
            esFavorito ? "Quitar de favoritos" : "Agregar a favoritos",
          )}
        </View>

        <View style={styles.cabecera}>
          <View style={[styles.anilloAvatar, { backgroundColor: theme.colors.background, borderColor: theme.colors.background }]}>
            <Avatar uri={medico.avatarUrl} iniciales={iniciales(medico.nombre, medico.apellido)} size={TAMANO_AVATAR} />
          </View>
          <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
            {nombre}
          </Text>
          {especialidadTexto ? (
            <Text style={[styles.especialidad, { color: theme.colors.primary }]}>{especialidadTexto}</Text>
          ) : null}
          <View style={[styles.matricula, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.full }]}>
            <ShieldCheck size={13} color={theme.colors.mutedForeground} />
            <Text style={[styles.matriculaTexto, { color: theme.colors.mutedForeground }]}>Mat. {medico.matricula}</Text>
          </View>
        </View>

        <View style={styles.cuerpo}>
          <Card padded={false} style={styles.estadisticas}>
            <Estadistica
              valor={tieneValoraciones ? medico.valoracion.toFixed(1) : "—"}
              etiqueta="Valoración"
              icono={<Star size={15} color={AMARILLO} fill={AMARILLO} />}
            />
            <View style={[styles.divisor, { backgroundColor: theme.colors.border }]} />
            <Estadistica valor={String(medico.cantidadValoraciones)} etiqueta={medico.cantidadValoraciones === 1 ? "Opinión" : "Opiniones"} />
            <View style={[styles.divisor, { backgroundColor: theme.colors.border }]} />
            <Estadistica valor={`${medico.aniosExperiencia}+`} etiqueta="Años de exp." />
          </Card>

          {lugares.length > 0 ? (
            <Bloque icono={MapPin} titulo="Dónde atiende">
              <Card padded={false}>
                {lugares.map((l, i) => (
                  <View
                    key={l.sede.id}
                    style={[styles.lugar, i > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}
                  >
                    <View style={[styles.iconoLugar, { backgroundColor: theme.colors.highlight, borderRadius: theme.radii.md }]}>
                      <Building2 size={18} color={theme.colors.primary} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.lugarNombre, { color: theme.colors.foreground }]} numberOfLines={2}>
                        {l.institucion.nombre}
                      </Text>
                      <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                        {l.sede.direccion}, {l.sede.ciudad}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </Bloque>
          ) : null}

          {medico.coberturas.length > 0 ? (
            <Bloque icono={ShieldCheck} titulo="Coberturas que atiende">
              <View style={styles.coberturas}>
                {medico.coberturas.map((c) => {
                  const obraSocial = obrasSociales.find((o) => o.id === c.obraSocialId);
                  if (!obraSocial) return null;
                  const esLaMia = !!plan && cubrePlan([c], plan);
                  return (
                    <View
                      key={c.obraSocialId}
                      style={[
                        styles.cobertura,
                        {
                          borderRadius: theme.radii.md,
                          backgroundColor: esLaMia ? theme.colors.highlight : theme.colors.card,
                          borderColor: esLaMia ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      {esLaMia ? <CheckCircle2 size={14} color={theme.colors.primary} /> : null}
                      <View>
                        <Text style={[styles.coberturaNombre, { color: theme.colors.foreground }]}>{obraSocial.nombre}</Text>
                        <Text style={[styles.coberturaPlanes, { color: theme.colors.mutedForeground }]}>
                          {resumenPlanes(c, obraSocial)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Bloque>
          ) : null}
        </View>
      </ScrollView>

      {/* Solicitar turno queda fijo abajo; sin el plan del paciente entre sus coberturas no hay turnos para él. */}
      <View
        style={[
          styles.pie,
          { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 12 },
        ]}
      >
        {!atiendeMiPlan ? (
          <Text style={[styles.avisoPlan, { color: theme.colors.mutedForeground }]}>
            Este profesional no atiende tu plan médico, así que no tiene turnos para vos.
          </Text>
        ) : null}
        <PrimaryButton
          label="Solicitar turno"
          disabled={!atiendeMiPlan}
          onPress={() => router.push({ pathname: "/reservar/[medicoId]", params: { medicoId: medico.id } })}
          accessibilityLabel={`Solicitar turno con ${nombre}`}
        />
      </View>
    </View>
  );
}

function Estadistica({ valor, etiqueta, icono }: { valor: string; etiqueta: string; icono?: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.estadistica} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <View style={styles.estadisticaValorFila}>
        {icono}
        <Text variant="heading" style={[styles.estadisticaValor, { color: theme.colors.foreground }]}>
          {valor}
        </Text>
      </View>
      <Text style={[styles.estadisticaEtiqueta, { color: theme.colors.mutedForeground }]}>{etiqueta}</Text>
    </View>
  );
}

function Bloque({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: string; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.bloque}>
      <View style={styles.bloqueTitulo}>
        <Icono size={16} color={theme.colors.primary} />
        <Text variant="heading" style={[styles.bloqueTituloTexto, { color: theme.colors.foreground }]}>
          {titulo}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  franja: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cabecera: { alignItems: "center", paddingHorizontal: 24, marginTop: -(TAMANO_AVATAR / 2 + 6) },
  anilloAvatar: { borderRadius: TAMANO_AVATAR, borderWidth: 6 },
  nombre: { fontSize: 24, fontWeight: "700", textAlign: "center", marginTop: 12 },
  especialidad: { fontSize: 15, fontWeight: "600", textAlign: "center", marginTop: 4 },
  matricula: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, marginTop: 12 },
  matriculaTexto: { fontSize: 12, fontWeight: "600" },
  cuerpo: { paddingHorizontal: 24, marginTop: 24 },
  estadisticas: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
  estadistica: { flex: 1, alignItems: "center", gap: 4 },
  estadisticaValorFila: { flexDirection: "row", alignItems: "center", gap: 5 },
  estadisticaValor: { fontSize: 20, fontWeight: "700" },
  estadisticaEtiqueta: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  divisor: { width: 1, alignSelf: "stretch", marginVertical: 4 },
  bloque: { marginTop: 24 },
  bloqueTitulo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  bloqueTituloTexto: { fontSize: 16, fontWeight: "700" },
  lugar: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconoLugar: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  lugarNombre: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  coberturas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cobertura: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  coberturaNombre: { fontSize: 13, fontWeight: "600" },
  coberturaPlanes: { fontSize: 11, marginTop: 1 },
  pie: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  avisoPlan: { fontSize: 12, textAlign: "center" },
});
