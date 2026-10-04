import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Building2, FlaskConical, Hospital, Stethoscope } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import {
  Card,
  Chip,
  IconBadge,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  SelectField,
  Text,
  TextField,
} from "@/components";
import { Institucion, PlanMedico, TipoInstitucion } from "@/domain";
import { crearInstitucion, listInstituciones, listPlanesMedicos } from "@/services";
import { useTheme } from "@/theme";

const TIPOS: { value: TipoInstitucion; label: string; icon: LucideIcon }[] = [
  { value: "hospital", label: "Hospital", icon: Hospital },
  { value: "clinica", label: "Clínica", icon: Building2 },
  { value: "centro_medico", label: "Centro médico", icon: Stethoscope },
  { value: "laboratorio", label: "Laboratorio", icon: FlaskConical },
];

const esTipo = (v: string): v is TipoInstitucion => TIPOS.some((t) => t.value === v);

/** "-34,60" o "-34.60" -> -34.6 */
const parseCoordenada = (v: string) => Number.parseFloat(v.replace(",", "."));

/** Alta y listado de hospitales, clínicas, centros médicos y laboratorios. */
export default function AdminInstitucionesScreen() {
  const { theme } = useTheme();
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [planes, setPlanes] = useState<PlanMedico[]>([]);
  const [formAbierto, setFormAbierto] = useState(false);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoInstitucion>("hospital");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [planesIds, setPlanesIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    Promise.all([listInstituciones(), listPlanesMedicos()]).then(([i, p]) => {
      setInstituciones(i);
      setPlanes(p);
    });
  }, []);

  useFocusEffect(cargar);

  const togglePlan = (id: string) =>
    setPlanesIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const limpiar = () => {
    setNombre("");
    setTipo("hospital");
    setDireccion("");
    setCiudad("");
    setTelefono("");
    setLatitud("");
    setLongitud("");
    setPlanesIds([]);
  };

  const handleGuardar = async () => {
    setError(null);
    setExito(null);
    setGuardando(true);
    try {
      const inst = await crearInstitucion({
        nombre,
        tipo,
        direccion,
        ciudad,
        telefono,
        latitud: parseCoordenada(latitud),
        longitud: parseCoordenada(longitud),
        planesAceptadosIds: planesIds,
      });
      limpiar();
      setFormAbierto(false);
      setExito(`Se agregó "${inst.nombre}". Ya aparece en el mapa de los pacientes.`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const nombrePlan = (id: string) => planes.find((p) => p.id === id)?.aseguradora;
  const tipoInfo = (t: TipoInstitucion) => TIPOS.find((x) => x.value === t) ?? TIPOS[0];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenContainer>
        <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>Instituciones</Text>
        <Text style={[styles.sub, { color: theme.colors.mutedForeground }]}>
          Hospitales, clínicas, centros médicos y laboratorios.
        </Text>

        {exito ? <Text style={[styles.msg, { color: theme.colors.success }]}>{exito}</Text> : null}

        {!formAbierto ? (
          <View style={{ marginBottom: 28 }}>
            <PrimaryButton
              label="Agregar institución"
              onPress={() => {
                setExito(null);
                setFormAbierto(true);
              }}
            />
          </View>
        ) : (
          <Card style={{ marginBottom: 28 }}>
            <Text variant="heading" style={[styles.cardTitle, { color: theme.colors.foreground }]}>
              Nueva institución
            </Text>
            <TextField label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej. Hospital Alemán" />
            <SelectField
              label="Tipo"
              options={TIPOS.map((t) => ({ value: t.value, label: t.label }))}
              value={tipo}
              onChange={(v) => esTipo(v) && setTipo(v)}
            />
            <TextField label="Dirección" value={direccion} onChangeText={setDireccion} placeholder="Ej. Av. Pueyrredón 1640" />
            <TextField label="Ciudad" value={ciudad} onChangeText={setCiudad} placeholder="Ej. CABA" />
            <TextField
              label="Teléfono"
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Ej. +54 11 4827-7000"
              keyboardType="phone-pad"
            />
            <View style={styles.coordRow}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Latitud"
                  value={latitud}
                  onChangeText={setLatitud}
                  placeholder="-34.5915"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Longitud"
                  value={longitud}
                  onChangeText={setLongitud}
                  placeholder="-58.4011"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Obras sociales aceptadas</Text>
            <View style={styles.chips}>
              {planes.map((p) => (
                <Chip key={p.id} label={p.nombre} selected={planesIds.includes(p.id)} onPress={() => togglePlan(p.id)} />
              ))}
            </View>
            {error ? <Text style={[styles.msg, { color: theme.colors.danger }]}>{error}</Text> : null}
            <View style={{ gap: 12 }}>
              <PrimaryButton label="Guardar institución" onPress={handleGuardar} loading={guardando} />
              <PrimaryButton
                label="Cancelar"
                variant="outline"
                onPress={() => {
                  limpiar();
                  setError(null);
                  setFormAbierto(false);
                }}
              />
            </View>
          </Card>
        )}

        <SectionHeader title={`Cargadas (${instituciones.length})`} />
        {instituciones.map((inst) => {
          const info = tipoInfo(inst.tipo);
          const sede = inst.sedes[0];
          return (
            <Card key={inst.id} style={styles.item}>
              <View style={styles.row}>
                <IconBadge icon={info.icon} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{inst.nombre}</Text>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                    {info.label}
                    {sede ? ` · ${sede.direccion}, ${sede.ciudad}` : ""}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={2}>
                    Acepta: {Array.from(new Set(inst.planesAceptadosIds.map(nombrePlan).filter(Boolean))).join(", ")}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700" },
  sub: { fontSize: 13, marginTop: 4, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "500", marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  coordRow: { flexDirection: "row", gap: 12 },
  msg: { fontSize: 13, marginBottom: 12 },
  item: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
});
