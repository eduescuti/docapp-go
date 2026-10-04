import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { BackHeader, FormLayout, PasswordField, PrimaryButton, SelectField, Text, TextField } from "@/components";
import { PlanMedico } from "@/domain";
import { listPlanesMedicos, registrarPaciente } from "@/services";
import { useTheme } from "@/theme";
import { esDniValido, esPasswordValida } from "@/utils/validation";

/** Registro de paciente. Sprint 1: valida los datos pero todavía no guarda la cuenta. */
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
      Alert.alert(
        "¡Cuenta creada!",
        "Tus datos son válidos. Por ahora la cuenta no se guarda (todavía no hay base de datos), así que para probar la app ingresá con un usuario de prueba.",
        [{ text: "Ir al inicio de sesión", onPress: () => router.replace("/(auth)/login") }],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <FormLayout
      header={<BackHeader titulo="Registro de paciente" subtitulo="Completá tus datos y tu cobertura" />}
      footer={<PrimaryButton label="Crear cuenta" onPress={handleCrear} loading={cargando} />}
    >
      <View style={styles.fila}>
        <View style={styles.col}>
          <TextField label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej. Sofía" autoComplete="given-name" error={mostrar("nombre")} />
        </View>
        <View style={styles.col}>
          <TextField label="Apellido" value={apellido} onChangeText={setApellido} placeholder="Ej. Martínez" autoComplete="family-name" error={mostrar("apellido")} />
        </View>
      </View>
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
  fila: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
});
