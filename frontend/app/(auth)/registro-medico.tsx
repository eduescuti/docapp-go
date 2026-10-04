import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BadgeCheck, ShieldCheck } from "lucide-react-native";

import {
  BackHeader,
  Card,
  FormLayout,
  IconBadge,
  PasswordField,
  PrimaryButton,
  SelectField,
  StepIndicator,
  Text,
  TextField,
} from "@/components";
import { DatosRegistroMedico, ProfesionalPadron } from "@/domain";
import {
  getEjemploRegistroProfesional,
  listProfesiones,
  REGISTRO_HABILITADO,
  registrarMedico,
  verificarProfesional,
} from "@/services";
import { useTheme } from "@/theme";
import { esDniValido, esPasswordValida } from "@/utils/validation";

const PASOS = ["Tus datos", "Confirmación", "Crear cuenta"];
const EJEMPLO = getEjemploRegistroProfesional();

/**
 * Registro de profesional en 3 pasos:
 * 1. DNI + matrícula + profesión + contraseña → se busca la terna en el padrón.
 * 2. "¿Esta es tu información?" con los datos del padrón.
 * 3. Botón final "Crear cuenta".
 */
export default function RegistroMedicoScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [paso, setPaso] = useState(0);
  const [profesiones, setProfesiones] = useState<string[]>([]);
  const [dni, setDni] = useState("");
  const [matricula, setMatricula] = useState("");
  const [profesion, setProfesion] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [encontrado, setEncontrado] = useState<ProfesionalPadron | null>(null);

  useEffect(() => {
    listProfesiones().then(setProfesiones);
  }, []);

  const errores = {
    dni: !esDniValido(dni) ? "Ingresá un DNI válido (7 u 8 dígitos)." : undefined,
    matricula: !matricula.trim() ? "Ingresá tu número de matrícula." : undefined,
    profesion: !profesion ? "Elegí tu profesión." : undefined,
    password: !esPasswordValida(password) ? "La contraseña no cumple los requisitos." : undefined,
  };
  const valido = Object.values(errores).every((e) => !e);
  const mostrar = (campo: keyof typeof errores) => (intentoEnviar ? errores[campo] : undefined);

  const datos = (): DatosRegistroMedico => ({ dni, matricula, profesion: profesion ?? "", password });

  const handleVerificar = async () => {
    setIntentoEnviar(true);
    setError(null);
    if (!valido) return;
    setCargando(true);
    try {
      setEncontrado(await verificarProfesional(datos()));
      setPaso(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo verificar la matrícula.");
    } finally {
      setCargando(false);
    }
  };

  const handleCrear = async () => {
    setError(null);
    setCargando(true);
    try {
      await registrarMedico(datos());
      router.replace("/(auth)/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  const volver = () => {
    setError(null);
    if (paso === 0) router.back();
    else setPaso(paso - 1);
  };

  const footer =
    paso === 0 ? (
      <PrimaryButton label="Verificar matrícula" onPress={handleVerificar} loading={cargando} />
    ) : paso === 1 ? (
      <>
        <PrimaryButton label="Sí, soy yo" onPress={() => setPaso(2)} />
        <PrimaryButton label="No, revisar mis datos" variant="outline" onPress={() => setPaso(0)} />
      </>
    ) : (
      <>
        <PrimaryButton label="Crear cuenta" onPress={handleCrear} loading={cargando} disabled={!REGISTRO_HABILITADO} />
        {!REGISTRO_HABILITADO && (
          <Text style={[styles.nota, { color: theme.colors.mutedForeground }]}>
            Tu matrícula fue verificada. La creación de cuentas se habilita cuando conectemos la base de datos.
          </Text>
        )}
      </>
    );

  return (
    <FormLayout
      header={
        <>
          <BackHeader titulo="Registro profesional" subtitulo="Verificación en el padrón nacional" onBack={volver} />
          <StepIndicator pasos={PASOS} actual={paso} />
        </>
      }
      footer={footer}
    >
      {paso === 0 && (
        <View>
          <TextField
            label="DNI"
            value={dni}
            onChangeText={setDni}
            placeholder={`Ej. ${EJEMPLO.dni}`}
            keyboardType="number-pad"
            maxLength={10}
            error={mostrar("dni")}
          />
          <TextField
            label="Matrícula"
            value={matricula}
            onChangeText={setMatricula}
            placeholder={`Ej. ${EJEMPLO.matricula}`}
            keyboardType="number-pad"
            error={mostrar("matricula")}
          />
          <SelectField
            label="Profesión"
            placeholder={`Elegí tu profesión (ej. ${EJEMPLO.profesion})`}
            options={profesiones.map((p) => ({ value: p, label: p }))}
            value={profesion}
            onChange={setProfesion}
            error={mostrar("profesion")}
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
          {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        </View>
      )}

      {paso === 1 && encontrado && (
        <View>
          <Text variant="heading" style={[styles.pregunta, { color: theme.colors.foreground }]}>
            ¿Esta es tu información?
          </Text>
          <Card>
            <View style={styles.fichaHeader}>
              <IconBadge icon={BadgeCheck} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fichaNombre, { color: theme.colors.foreground }]}>
                  {encontrado.nombre} {encontrado.apellido}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>{encontrado.profesion}</Text>
              </View>
            </View>
            <Dato label="DNI" valor={encontrado.dni} />
            <Dato label="Matrícula" valor={encontrado.matricula} />
            <Dato label="Estado de matrícula" valor={encontrado.estadoMatricula} />
            <Dato label="Provincia" valor={encontrado.provincia} />
            <Dato label="Emisor" valor={encontrado.emisor} />
            <Dato label="Código del profesional" valor={encontrado.codigoProfesional} />
            {encontrado.especializaciones.length > 0 && (
              <Dato label="Especializaciones" valor={encontrado.especializaciones.join(", ")} />
            )}
          </Card>
        </View>
      )}

      {paso === 2 && encontrado && (
        <View style={styles.finalWrapper}>
          <Card style={styles.finalCard}>
            <IconBadge icon={ShieldCheck} size={56} />
            <Text variant="heading" style={[styles.pregunta, { color: theme.colors.foreground, textAlign: "center" }]}>
              Todo listo, {encontrado.nombre}
            </Text>
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 14, textAlign: "center" }}>
              Vas a ingresar con tu DNI {encontrado.dni} y la contraseña que elegiste.
            </Text>
          </Card>
          {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        </View>
      )}
    </FormLayout>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.datoRow, { borderTopColor: theme.colors.border }]}>
      <Text style={[styles.datoLabel, { color: theme.colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.datoValor, { color: theme.colors.foreground }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: 4, fontSize: 13 },
  pregunta: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  fichaHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  fichaNombre: { fontSize: 16, fontWeight: "700" },
  datoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 8, borderTopWidth: 1 },
  datoLabel: { fontSize: 13 },
  datoValor: { fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  nota: { fontSize: 13, textAlign: "center" },
  finalWrapper: { flex: 1, justifyContent: "center" },
  finalCard: { alignItems: "center", gap: 12, paddingVertical: 28 },
});
