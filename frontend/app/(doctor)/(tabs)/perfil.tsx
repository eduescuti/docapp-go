import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import { BadgeCheck, Fingerprint, MapPin, Settings, ShieldPlus, Star } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";

import { AvisoProfesional, Card, FotoPerfilEditable, LogoutButton, PrimaryButton, ScreenContainer, SectionHeader, Text } from "@/components";
import { Especialidad, Medico, ObraSocialConPlanes } from "@/domain";
import { useAuth } from "@/hooks/useAuth";
import {
  getEspecialidad,
  getMedicoActual,
  LugarDeAtencion,
  listLugaresDeAtencion,
  listMisFranjas,
  listObrasSociales,
} from "@/services";
import {
  estaBiometriaHabilitada,
  guardarSesionBiometrica,
  limpiarSesionBiometrica,
  setBiometriaHabilitada,
} from "@/services/biometria";
import { useTheme } from "@/theme";
import { tomarAviso } from "@/utils/avisoAlVolver";
import { resumenPlanes } from "@/utils/cobertura";
import { iniciales } from "@/utils/format";
import { alPresionar } from "@/utils/presionado";

/**
 * Perfil profesional: los datos del registro (padrón), las coberturas que atiende (las elige él, regla 17), los
 * lugares de atención (filtrados por esas coberturas) y los ajustes de seguridad. Sus horarios se cargan en la
 * Agenda, no acá. La ruedita de arriba abre Configuración (modo claro u oscuro).
 */
export default function DoctorPerfilScreen() {
  const { theme } = useTheme();
  const { sesion } = useAuth();
  const router = useRouter();

  const [medico, setMedico] = useState<Medico | null>(null);
  const [especialidad, setEspecialidad] = useState<Especialidad | undefined>();
  const [lugares, setLugares] = useState<LugarDeAtencion[]>([]);
  const [obrasSociales, setObrasSociales] = useState<ObraSocialConPlanes[]>([]);
  const [sinHorarios, setSinHorarios] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [biometriaActiva, setBiometriaActiva] = useState(false);
  const [soportaBiometria, setSoportaBiometria] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        const [m, tieneHardware, tieneEnrolamiento, habilitada] = await Promise.all([
          getMedicoActual(),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          estaBiometriaHabilitada(),
        ]);

        const [esp, l, os, franjas] = await Promise.all([
          getEspecialidad(m.especialidadId),
          listLugaresDeAtencion(m.sedesIds),
          listObrasSociales(),
          listMisFranjas(),
        ]);

        if (!activo) return;
        setMedico(m);
        setEspecialidad(esp);
        setLugares(l);
        setObrasSociales(os);
        setSinHorarios(franjas.length === 0);
        setAviso(tomarAviso());
        setSoportaBiometria(tieneHardware && tieneEnrolamiento);
        setBiometriaActiva(habilitada);
      })();

      return () => {
        activo = false;
      };
    }, []),
  );

  const toggleBiometria = async (valor: boolean) => {
    if (!valor) {
      await setBiometriaHabilitada(false);
      await limpiarSesionBiometrica();
      setBiometriaActiva(false);
      return;
    }

    try {
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirmá tu huella para habilitar el ingreso rápido",
        cancelLabel: "Cancelar",
        disableDeviceFallback: true,
      });

      if (resultado.success) {
        await setBiometriaHabilitada(true);
        if (sesion?.dni) {
          await guardarSesionBiometrica(sesion.dni);
        }
        setBiometriaActiva(true);
      } else {
        setBiometriaActiva(false);
      }
    } catch {
      Alert.alert("Error", "No se pudo vincular la huella digital en este dispositivo.");
      setBiometriaActiva(false);
    }
  };

  if (!medico) {
    return (
      <ScreenContainer>
        <Text style={{ color: theme.colors.mutedForeground }}>Cargando...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.encabezado}>
        <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>
          Mi perfil
        </Text>
        {/* Misma pantalla de Configuración que el paciente (modo claro u oscuro). */}
        <Pressable
          onPress={() => router.push("/(doctor)/configuracion")}
          accessibilityRole="button"
          accessibilityLabel="Configuración"
          hitSlop={4}
          style={({ pressed }) => [
            styles.botonConfig,
            { backgroundColor: theme.colors.muted, borderRadius: theme.radii.full },
            alPresionar(pressed),
          ]}
        >
          <Settings size={20} color={theme.colors.foreground} />
        </Pressable>
      </View>

      <Card style={styles.perfil}>
        <FotoPerfilEditable
          avatarUrl={medico.avatarUrl}
          iniciales={iniciales(medico.nombre, medico.apellido)}
          quienLaVe="Tu foto la ven los pacientes en tu perfil, al reservar un turno y en sus turnos con vos."
          colorFondo={theme.colors.card}
          onCambio={(avatarUrl) => setMedico((m) => (m ? { ...m, avatarUrl } : m))}
        />
        <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
          {medico.nombre} {medico.apellido}
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>
          {medico.profesion}
          {especialidad ? ` · ${especialidad.nombre}` : ""}
        </Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.full }]}>
            <BadgeCheck size={14} color={theme.colors.accentForeground} />
            <Text style={[styles.badgeText, { color: theme.colors.accentForeground }]}>Mat. {medico.matricula}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.full }]}>
            <Star size={14} color={theme.colors.foreground} />
            <Text style={[styles.badgeText, { color: theme.colors.foreground }]}>
              {medico.valoracion.toFixed(1)} ({medico.cantidadValoraciones})
            </Text>
          </View>
        </View>
        <Text style={[styles.descripcion, { color: theme.colors.mutedForeground }]}>{medico.descripcion}</Text>
      </Card>

      <AvisoProfesional
        sinCoberturas={medico.coberturas.length === 0}
        sinHorarios={sinHorarios}
        onCargarCoberturas={() => router.push("/(doctor)/coberturas")}
        onCargarHorarios={() => router.push("/(doctor)/horarios")}
      />

      <SectionHeader title="Coberturas que atiendo" />
      {aviso ? (
        <Text style={[styles.aviso, { color: theme.colors.success }]} accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : null}
      {medico.coberturas.length === 0 ? (
        <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginBottom: 10 }]}>
          Todavía no elegiste coberturas: ningún paciente te ve.
        </Text>
      ) : (
        <Card style={styles.item}>
          {medico.coberturas.map((c) => {
            const obraSocial = obrasSociales.find((o) => o.id === c.obraSocialId);
            return (
              <View key={c.obraSocialId} style={[styles.itemRow, styles.cobertura]}>
                <ShieldPlus size={16} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{obraSocial?.nombre ?? "Obra social"}</Text>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{resumenPlanes(c, obraSocial)}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}
      <PrimaryButton
        label={medico.coberturas.length === 0 ? "Elegir coberturas" : "Editar coberturas"}
        variant="outline"
        onPress={() => router.push("/(doctor)/coberturas")}
      />

      {/* Los lugares van después de las coberturas: se eligen entre los que aceptan alguna de ellas. */}
      <View style={{ height: 16 }} />
      <SectionHeader title="Lugares de atención" />
      {lugares.length === 0 ? (
        <Text style={[styles.meta, { color: theme.colors.mutedForeground, marginBottom: 10 }]}>
          Todavía no elegiste dónde atendés: sin lugares no podés cargar horarios.
        </Text>
      ) : null}
      {lugares.map(({ sede, institucion }) => (
        <Card key={sede.id} style={styles.item}>
          <View style={styles.itemRow}>
            <MapPin size={16} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{institucion.nombre}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                {sede.direccion}, {sede.ciudad}
              </Text>
            </View>
          </View>
        </Card>
      ))}

      <PrimaryButton
        label={lugares.length === 0 ? "Elegir lugares" : "Editar lugares"}
        variant="outline"
        onPress={() => router.push("/(doctor)/lugares")}
      />


      {/* Ajuste de ingreso con huella para el médico */}
      {soportaBiometria ? (
        <>
          <View style={{ height: 16 }} />
          <SectionHeader title="Seguridad de la cuenta" />
          <Card style={styles.item}>
            <View style={styles.itemRow}>
              <Fingerprint size={22} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>
                  Ingreso con huella digital
                </Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  Accedé rápidamente a tus turnos sin escribir tu contraseña.
                </Text>
              </View>
              <Switch
                value={biometriaActiva}
                onValueChange={toggleBiometria}
                thumbColor={Platform.OS === "android" ? (biometriaActiva ? theme.colors.primary : "#f4f3f4") : undefined}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
              />
            </View>
          </Card>
        </>
      ) : null}

      <View style={{ marginTop: 24, marginBottom: 32 }}>
        <LogoutButton />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700" },
  botonConfig: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  perfil: { alignItems: "center", gap: 8, marginBottom: 28, paddingVertical: 24 },
  nombre: { fontSize: 20, fontWeight: "700", marginTop: 4 },
  badges: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  descripcion: { fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 19 },
  item: { marginBottom: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 14, fontWeight: "600" },
  cobertura: { paddingVertical: 6 },
  aviso: { fontSize: 13, marginBottom: 10 },
  meta: { fontSize: 12, marginTop: 2 },
});