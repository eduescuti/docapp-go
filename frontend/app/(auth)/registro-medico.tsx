import { useEffect, useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
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
  VerificarDni,
} from "@/components";
import { DatosRegistroMedico, DniLeido, Especialidad, Genero, ProfesionalPadron } from "@/domain";
import { useAuth } from "@/hooks/useAuth";
import { getEjemploRegistroProfesional, listEspecialidades, listProfesiones, verificarProfesional } from "@/services";
import { useTheme } from "@/theme";
import { esDniValido, esPasswordValida } from "@/utils/validation";

const PASOS = ["Tus datos", "Confirmación", "Crear cuenta"];
const EJEMPLO = getEjemploRegistroProfesional();
const GENEROS: { value: Genero; label: string; description: string }[] = [
  { value: "femenino", label: "Femenino", description: "Te mostramos como Dra." },
  { value: "masculino", label: "Masculino", description: "Te mostramos como Dr." },
];
const esGenero = (v: string): v is Genero => GENEROS.some((g) => g.value === v);

/**
 * Registro de profesional en 3 pasos:
 * 1. Escanea su DNI (verificación de identidad, 28/10/2026: completa el DNI, que ya no se escribe) + matrícula +
 *    profesión + contraseña → se busca la terna en el padrón. También género (Dr./Dra.) y especialidad, que el
 *    padrón no trae (decidido el 27/10/2026). El backend revisa que el DNI escaneado sea de la persona del padrón.
 * 2. "¿Esta es tu información?" con los datos del padrón.
 * 3. Botón final "Crear cuenta": crea la cuenta y entra. Lugares, coberturas y horarios los carga después.
 */
export default function RegistroMedicoScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { registrarMedico } = useAuth();

  const [paso, setPaso] = useState(0);
  const [profesiones, setProfesiones] = useState<string[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [genero, setGenero] = useState<Genero | null>(null);
  const [especialidadId, setEspecialidadId] = useState<string | null>(null);
  const [documento, setDocumento] = useState<{ codigo: string; datos: DniLeido } | null>(null);
  const dni = documento?.datos.dni ?? "";
  const [matricula, setMatricula] = useState("");
  const [profesion, setProfesion] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [encontrado, setEncontrado] = useState<ProfesionalPadron | null>(null);

  useEffect(() => {
    Promise.all([listProfesiones(), listEspecialidades()])
      .then(([p, e]) => {
        setProfesiones(p);
        setEspecialidades(e);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "No se pudieron cargar las profesiones."));
  }, []);

  const especialidadesDeProfesion = especialidades
    .filter((e) => e.profesion === profesion)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const errores = {
    dni: !documento ? "Escaneá tu DNI para verificar tu identidad." : !esDniValido(dni) ? "El DNI escaneado no es válido." : undefined,
    matricula: !matricula.trim() ? "Ingresá tu número de matrícula." : undefined,
    profesion: !profesion ? "Elegí tu profesión." : undefined,
    genero: !genero ? "Elegí tu género." : undefined,
    especialidad: !especialidadId ? "Elegí tu especialidad." : undefined,
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
    if (!genero || !especialidadId || !documento) return;
    try {
      await registrarMedico({ ...datos(), codigoDni: documento.codigo, genero, especialidadId });
      router.replace("/");
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
      <>
        <PrimaryButton label="Verificar matrícula" onPress={handleVerificar} loading={cargando} />
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
    ) : paso === 1 ? (
      <>
        <PrimaryButton label="Sí, soy yo" onPress={() => setPaso(2)} />
        <PrimaryButton label="No, revisar mis datos" variant="outline" onPress={() => setPaso(0)} />
      </>
    ) : (
      <>
        <PrimaryButton label="Crear cuenta" onPress={handleCrear} loading={cargando} />
        <PrimaryButton
          label="Volver al inicio de sesión"
          variant="outline"
          onPress={() => router.replace("/(auth)/login")}
        />
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
          <VerificarDni
            verificado={documento?.datos ?? null}
            onVerificado={(codigo, datos) => {
              setDocumento({ codigo, datos });
              setError(null);
            }}
            onReiniciar={() => setDocumento(null)}
          />
          {/* El DNI sale del documento escaneado: no se puede escribir a mano. */}
          <TextField
            label="DNI"
            value={dni}
            editable={false}
            placeholder="Se completa al escanear tu DNI"
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
            onChange={(p) => {
              setProfesion(p);
              // La especialidad elegida puede no ser de la nueva profesión.
              if (especialidades.find((e) => e.id === especialidadId)?.profesion !== p) setEspecialidadId(null);
            }}
            error={mostrar("profesion")}
          />
          <SelectField
            label="Género"
            placeholder="Elegí cómo te mostramos"
            options={GENEROS}
            value={genero}
            onChange={(v) => esGenero(v) && setGenero(v)}
            error={mostrar("genero")}
          />
          {/* Solo las especialidades de su profesión, en orden alfabético y con buscador (son más de 70 médicas). */}
          <SelectField
            label="Especialidad"
            placeholder={profesion ? "Elegí tu especialidad" : "Primero elegí tu profesión"}
            options={especialidadesDeProfesion.map((e) => ({ value: e.id, label: e.nombre }))}
            value={especialidadId}
            onChange={setEspecialidadId}
            error={mostrar("especialidad")}
            buscador="Buscar especialidad"
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
              Vas a ingresar con tu DNI {encontrado.dni} y la contraseña que elegiste. Después cargá en tu Perfil
              dónde atendés y qué coberturas aceptás.
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
  finalWrapper: { flex: 1, justifyContent: "center" },
  finalCard: { alignItems: "center", gap: 12, paddingVertical: 28 },
  linkWrapper: {paddingVertical: 12,alignItems: "center",},
  linkTexto: {fontSize: 14,textAlign: "center",},
});
