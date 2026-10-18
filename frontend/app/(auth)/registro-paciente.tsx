import { useEffect, useMemo, useState } from "react";
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
  SelectField,
  Text,
  TextField,
} from "@/components";
import { PlanMedico } from "@/domain";
import { listPlanesMedicos, registrarPaciente } from "@/services";
import { useTheme } from "@/theme";
import { esDniValido, esPasswordValida } from "@/utils/validation";

/** Registro de paciente. Sprint 1: valida los datos y muestra confirmación con botón al Login. */
export default function RegistroPacienteScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [planes, setPlanes] = useState<PlanMedico[]>([]);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cuentaCreada, setCuentaCreada] = useState(false);

  useEffect(() => {
    listPlanesMedicos().then(setPlanes);
  }, []);

  const opcionesPlan = useMemo(
    () => planes.map((p) => ({ value: p.id, label: p.nombre, description: p.aseguradora })),
    [planes],
  );

  const errores = {
    nombre: !nombre.trim() ? "Ingresá tu nombre." : undefined,
    apellido: !apellido.trim() ? "Ingresá tu apellido." : undefined,
    dni: !esDniValido(dni) ? "Ingresá un DNI válido (7 u 8 dígitos)." : undefined,
    password: !esPasswordValida(password) ? "La contraseña no cumple los requisitos." : undefined,
    plan: !planId ? "Elegí tu obra social o prepaga." : undefined,
  };
  const valido = Object.values(errores).every((e) => !e);
  const mostrar = (campo: keyof typeof errores) => (intentoEnviar ? errores[campo] : undefined);

  const handleCrear = async () => {
    setIntentoEnviar(true);
    setError(null);
    if (!valido || !planId) return;
    setCargando(true);
    try {
      await registrarPaciente({ nombre, apellido, dni, password, planMedicoId: planId });
      setCuentaCreada(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  // Si la cuenta ya fue creada, mostramos la pantalla de éxito con el botón directo al Login
  if (cuentaCreada) {
    return (
      <FormLayout
        header={<BackHeader titulo="Registro completado" onBack={() => router.replace("/(auth)/login")} />}
        footer={
          <PrimaryButton
            label="Ir al inicio de sesión"
            onPress={() => router.replace("/(auth)/login")}
          />
        }
      >
        <View style={styles.finalWrapper}>
          <Card style={styles.finalCard}>
            <IconBadge icon={ShieldCheck} size={56} />
            <Text variant="heading" style={[styles.tituloExito, { color: theme.colors.foreground }]}>
              ¡Todo listo, {nombre}!
            </Text>
            <Text style={[styles.subtituloExito, { color: theme.colors.mutedForeground }]}>
              Tu cuenta fue registrada. Vas a ingresar con tu DNI {dni} y la contraseña que elegiste.
            </Text>
            <Text style={[styles.nota, { color: theme.colors.mutedForeground }]}>
              (Para ingresar durante el sprint podés usar los usuarios de prueba habilitados).
            </Text>
          </Card>
        </View>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      header={<BackHeader titulo="Registro de paciente" subtitulo="Completá tus datos y tu cobertura" />}
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
      <TextField
        label="Nombre"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Sofía"
        autoComplete="given-name"
        error={mostrar("nombre")}
      />

      <TextField
        label="Apellido"
        value={apellido}
        onChangeText={setApellido}
        placeholder="Ej. Martínez"
        autoComplete="family-name"
        error={mostrar("apellido")}
      />

      <TextField
        label="DNI"
        value={dni}
        onChangeText={setDni}
        placeholder="Ej. 12345678"
        keyboardType="number-pad"
        maxLength={10}
        error={mostrar("dni")}
      />

      <SelectField
        label="Obra social / prepaga"
        placeholder="Elegí tu cobertura"
        options={opcionesPlan}
        value={planId}
        onChange={setPlanId}
        error={mostrar("plan")}
      />

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
  nota: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
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