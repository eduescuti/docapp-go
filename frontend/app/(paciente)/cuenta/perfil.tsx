import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Lock } from "lucide-react-native";

import {
  BackHeader,
  Card,
  FotoPerfilEditable,
  PasswordField,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  SelectorPlan,
  Text,
} from "@/components";
import { ObraSocialConPlanes, Paciente } from "@/domain";
import { cambiarCobertura, cambiarPassword, getPacienteActual, listObrasSociales } from "@/services";
import { useTheme } from "@/theme";
import { iniciales } from "@/utils/format";
import { esPasswordValida } from "@/utils/validation";

type Mensaje = { tipo: "ok" | "error"; texto: string } | null;

/**
 * Mi perfil: muestra solo los datos que se cargan en el registro. Nombre, apellido y
 * DNI son de solo lectura; foto, obra social y contraseña se pueden cambiar.
 */
export default function PerfilScreen() {
  const { theme } = useTheme();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [obrasSociales, setObrasSociales] = useState<ObraSocialConPlanes[]>([]);

  const [planId, setPlanId] = useState<string | null>(null);
  const [msgCobertura, setMsgCobertura] = useState<Mensaje>(null);
  const [guardandoCobertura, setGuardandoCobertura] = useState(false);

  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passRepetida, setPassRepetida] = useState("");
  const [msgPassword, setMsgPassword] = useState<Mensaje>(null);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  // Al entrar a la pantalla se descartan los cambios sin guardar de una visita anterior.
  useFocusEffect(
    useCallback(() => {
      Promise.all([getPacienteActual(), listObrasSociales()]).then(([p, os]) => {
        setPaciente(p);
        setPlanId(p.planMedicoId);
        setObrasSociales(os);
      });
      setPassActual("");
      setPassNueva("");
      setPassRepetida("");
      setMsgCobertura(null);
      setMsgPassword(null);
    }, []),
  );

  const coberturaCambio = !!paciente && !!planId && planId !== paciente.planMedicoId;
  const passwordsCoinciden = passNueva === passRepetida;
  const puedeCambiarPassword = !!passActual && esPasswordValida(passNueva) && passwordsCoinciden;

  const guardarCobertura = async () => {
    if (!paciente || !planId) return;
    setMsgCobertura(null);
    setGuardandoCobertura(true);
    try {
      const actualizado = await cambiarCobertura(paciente.id, planId);
      setPaciente(actualizado);
      setPlanId(actualizado.planMedicoId);
      setMsgCobertura({ tipo: "ok", texto: "Obra social actualizada. Ya ves los profesionales de tu nuevo plan." });
    } catch (e) {
      setMsgCobertura({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo guardar." });
    } finally {
      setGuardandoCobertura(false);
    }
  };

  const guardarPassword = async () => {
    setMsgPassword(null);
    setGuardandoPassword(true);
    try {
      await cambiarPassword(passActual, passNueva);
      setPassActual("");
      setPassNueva("");
      setPassRepetida("");
      setMsgPassword({ tipo: "ok", texto: "Contraseña actualizada." });
    } catch (e) {
      setMsgPassword({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo cambiar la contraseña." });
    } finally {
      setGuardandoPassword(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenContainer>
        <BackHeader titulo="Mi perfil" />

        <View style={styles.avatar}>
          <FotoPerfilEditable
            avatarUrl={paciente?.avatarUrl}
            iniciales={paciente ? iniciales(paciente.nombre, paciente.apellido) : "--"}
            quienLaVe="Tu foto la ven solo vos y los profesionales con los que tenés un turno."
            deshabilitado={!paciente}
            onCambio={(avatarUrl) => setPaciente((p) => (p ? { ...p, avatarUrl } : p))}
          />
        </View>

        <SectionHeader title="Datos personales" />
        <Card style={styles.bloque}>
          <Dato label="Nombre" valor={paciente?.nombre ?? "—"} />
          <Dato label="Apellido" valor={paciente?.apellido ?? "—"} />
          <Dato label="DNI" valor={paciente?.dni ?? "—"} />
          <View style={styles.lockRow}>
            <Lock size={12} color={theme.colors.mutedForeground} />
            <Text style={[styles.nota, { color: theme.colors.mutedForeground, marginBottom: 0 }]}>
              Estos datos no se pueden modificar.
            </Text>
          </View>
        </Card>

        <SectionHeader title="Obra social" />
        <Card style={styles.bloque}>
          <SelectorPlan obrasSociales={obrasSociales} planId={planId} onChange={setPlanId} />
          <Text style={[styles.nota, { color: theme.colors.mutedForeground }]}>
            Tu obra social y tu plan definen qué profesionales e instituciones ves en la app. Tus turnos ya pedidos no cambian.
          </Text>
          <Aviso mensaje={msgCobertura} />
          <PrimaryButton
            label="Guardar obra social"
            onPress={guardarCobertura}
            disabled={!coberturaCambio}
            loading={guardandoCobertura}
          />
        </Card>

        <SectionHeader title="Contraseña" />
        <Card style={styles.bloque}>
          <PasswordField label="Contraseña actual" value={passActual} onChangeText={setPassActual} textContentType="password" />
          <PasswordField
            label="Nueva contraseña"
            value={passNueva}
            onChangeText={setPassNueva}
            textContentType="newPassword"
            mostrarRequisitos
          />
          <PasswordField
            label="Repetir nueva contraseña"
            value={passRepetida}
            onChangeText={setPassRepetida}
            textContentType="newPassword"
            error={passRepetida && !passwordsCoinciden ? "Las contraseñas no coinciden." : undefined}
          />
          <Aviso mensaje={msgPassword} />
          <PrimaryButton
            label="Cambiar contraseña"
            onPress={guardarPassword}
            disabled={!puedeCambiarPassword}
            loading={guardandoPassword}
          />
        </Card>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.datoRow, { borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.datoLabel, { color: theme.colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.datoValor, { color: theme.colors.foreground }]}>{valor}</Text>
    </View>
  );
}

function Aviso({ mensaje }: { mensaje: Mensaje }) {
  const { theme } = useTheme();
  if (!mensaje) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.aviso, { color: mensaje.tipo === "ok" ? theme.colors.success : theme.colors.danger }]}
    >
      {mensaje.texto}
    </Text>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: "center", marginBottom: 24 },
  bloque: { marginBottom: 28 },
  datoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  datoLabel: { fontSize: 13 },
  datoValor: { fontSize: 14, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  nota: { fontSize: 12, marginBottom: 12 },
  aviso: { fontSize: 13, marginBottom: 12 },
});
