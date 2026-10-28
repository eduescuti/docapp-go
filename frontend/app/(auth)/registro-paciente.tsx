import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";

import {
  BackHeader,
  Card,
  FormLayout,
  IconBadge,
  PasswordField,
  PrimaryButton,
  SelectorPlan,
  Text,
  VerificarDni,
} from "@/components";
import { DniLeido, ObraSocialConPlanes } from "@/domain";
import { useAuth } from "@/hooks/useAuth";
import { listObrasSociales } from "@/services";
import { useTheme } from "@/theme";
import { esPasswordValida } from "@/utils/validation";

/**
 * Registro de paciente: primero verifica su identidad escaneando el DNI (de ahí salen DNI, nombre y apellido;
 * decidido el 28/10/2026), después elige obra social y plan y una contraseña. Crea la cuenta y entra directo (la
 * confirmación lleva al Inicio).
 */
export default function RegistroPacienteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { registrarPaciente } = useAuth();

  const [obrasSociales, setObrasSociales] = useState<ObraSocialConPlanes[]>([]);
  const [documento, setDocumento] = useState<{ codigo: string; datos: DniLeido } | null>(null);
  const [password, setPassword] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cuentaCreada, setCuentaCreada] = useState(false);

  useEffect(() => {
    listObrasSociales().then(setObrasSociales);
  }, []);

  const errores = {
    dni: !documento ? "Escaneá tu DNI para verificar tu identidad." : undefined,
    password: !esPasswordValida(password) ? "La contraseña no cumple los requisitos." : undefined,
    plan: !planId ? "Elegí tu obra social o prepaga." : undefined,
  };
  const valido = Object.values(errores).every((e) => !e);
  const mostrar = (campo: keyof typeof errores) => (intentoEnviar ? errores[campo] : undefined);

  const handleCrear = async () => {
    setIntentoEnviar(true);
    setError(null);
    if (!valido || !planId || !documento) return;
    setCargando(true);
    try {
      await registrarPaciente({ codigoDni: documento.codigo, password, planMedicoId: planId });
      setCuentaCreada(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  // La cuenta ya fue creada y la sesión quedó iniciada: el botón lleva directo al Inicio.
  if (cuentaCreada) {
    return (
      <FormLayout
        header={<BackHeader titulo="Registro completado" onBack={() => router.replace("/")} />}
        footer={<PrimaryButton label="Ir al inicio" onPress={() => router.replace("/")} />}
      >
        <View style={styles.finalWrapper}>
          <Card style={styles.finalCard}>
            <IconBadge icon={ShieldCheck} size={56} />
            <Text variant="heading" style={[styles.tituloExito, { color: theme.colors.foreground }]}>
              ¡Todo listo, {documento?.datos.nombre}!
            </Text>
            <Text style={[styles.subtituloExito, { color: theme.colors.mutedForeground }]}>
              Tu cuenta fue creada y ya iniciaste sesión. La próxima vez entrás con tu DNI {documento?.datos.dni} y la
              contraseña que elegiste.
            </Text>
          </Card>
        </View>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      header={<BackHeader titulo="Registro de paciente" subtitulo="Verificá tu DNI y elegí tu cobertura" />}
      footer={
        <>
          <PrimaryButton label="Crear cuenta" onPress={handleCrear} loading={cargando} />
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            style={styles.linkWrapper}
          >
            <Text style={[styles.linkTexto, { color: theme.colors.mutedForeground }]}>
              ¿Ya tenés una cuenta?{" "}
              <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>Iniciá sesión</Text>
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      <VerificarDni
        verificado={documento?.datos ?? null}
        onVerificado={(codigo, datos) => {
          setDocumento({ codigo, datos });
          setError(null);
        }}
        onReiniciar={() => setDocumento(null)}
      />
      {mostrar("dni") ? <Text style={[styles.errorCampo, { color: theme.colors.danger }]}>{mostrar("dni")}</Text> : null}

      <SelectorPlan obrasSociales={obrasSociales} planId={planId} onChange={setPlanId} error={mostrar("plan")} />

      <PasswordField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="Creá una contraseña segura"
        textContentType="newPassword"
        mostrarRequisitos
        error={mostrar("password")}
      />

      {error ? <Text style={{ color: theme.colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  errorCampo: { fontSize: 12, marginTop: -8, marginBottom: 12 },
  finalWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  finalCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 28,
  },
  tituloExito: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subtituloExito: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  linkWrapper: {
    paddingVertical: 12,
    alignItems: "center",
  },
  linkTexto: {
    fontSize: 14,
    textAlign: "center",
  },
});