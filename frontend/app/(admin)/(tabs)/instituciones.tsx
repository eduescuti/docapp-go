import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Building2, ChevronRight, FlaskConical, Hospital, Stethoscope } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import {
  CampoBusqueda,
  CamposFuente,
  Card,
  FuenteEditable,
  IconBadge,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  SelectField,
  SelectorCoberturas,
  Text,
  TextField,
} from "@/components";
import { CoberturaAceptada, Institucion, ObraSocialConPlanes, TipoInstitucion } from "@/domain";
import { crearInstitucion, listInstituciones, listObrasSociales } from "@/services";
import { useTheme } from "@/theme";
import { resumenCoberturas } from "@/utils/cobertura";
import { hoyIso } from "@/utils/format";

const TIPOS: { value: TipoInstitucion; label: string; icon: LucideIcon }[] = [
  { value: "hospital", label: "Hospital", icon: Hospital },
  { value: "clinica", label: "Clínica", icon: Building2 },
  { value: "centro_medico", label: "Centro médico", icon: Stethoscope },
  { value: "laboratorio", label: "Laboratorio", icon: FlaskConical },
];

const esTipo = (v: string): v is TipoInstitucion => TIPOS.some((t) => t.value === v);

/** Con ~1.000 establecimientos del REFES no se dibujan todos: se busca por nombre. */
const LIMITE_LISTA = 30;

const FUENTE_VACIA: FuenteEditable = { fuente: "web_institucion", fuenteUrl: "" };

/** Sin tildes ni mayúsculas, para que "guemes" encuentre "Güemes". */
const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** "-34,60" o "-34.60" -> -34.6 */
const parseCoordenada = (v: string) => Number.parseFloat(v.replace(",", "."));

/**
 * Alta y listado de hospitales, clínicas, centros médicos y laboratorios. Tocar una abre la edición de sus
 * coberturas (las carga solo el admin, regla 17).
 */
export default function AdminInstitucionesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [obrasSociales, setObrasSociales] = useState<ObraSocialConPlanes[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoInstitucion>("hospital");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [coberturas, setCoberturas] = useState<CoberturaAceptada[]>([]);
  const [fuente, setFuente] = useState<FuenteEditable>(FUENTE_VACIA);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    Promise.all([listInstituciones(), listObrasSociales()]).then(([i, os]) => {
      setInstituciones(i);
      setObrasSociales(os);
    });
  }, []);

  useFocusEffect(cargar);

  const limpiar = () => {
    setNombre("");
    setTipo("hospital");
    setDireccion("");
    setCiudad("");
    setTelefono("");
    setLatitud("");
    setLongitud("");
    setCoberturas([]);
    setFuente(FUENTE_VACIA);
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
        coberturas,
        fuente: { fuente: fuente.fuente, fuenteUrl: fuente.fuenteUrl, verificadoEl: hoyIso() },
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

  const coberturaTexto = (inst: Institucion) => {
    if (inst.origen === "publico") return "Público: atiende a todas las coberturas";
    return inst.coberturas.length > 0 ? `Acepta: ${resumenCoberturas(inst.coberturas, obrasSociales)}` : "Sin obras sociales cargadas";
  };

  // Primero las que ya tienen coberturas (las del seed y las que cargó el admin); el resto, en el orden de carga.
  const buscada = normalizar(busqueda.trim());
  const filtradas = instituciones
    .filter((i) => !buscada || normalizar(i.nombre).includes(buscada))
    .sort((a, b) => Number(b.coberturas.length > 0) - Number(a.coberturas.length > 0));
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
            <SelectorCoberturas obrasSociales={obrasSociales} value={coberturas} onChange={setCoberturas} />
            <View style={{ height: 16 }} />
            <CamposFuente value={fuente} onChange={setFuente} />
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
        <CampoBusqueda
          valor={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre"
          accessibilityLabel="Buscar institución por nombre"
        />
        <Text style={[styles.sub, { color: theme.colors.mutedForeground, marginTop: 8 }]}>
          {filtradas.length === 0
            ? "No hay instituciones con ese nombre."
            : filtradas.length > LIMITE_LISTA
              ? `Se muestran ${LIMITE_LISTA} de ${filtradas.length}: primero las que tienen coberturas. Tocá una para editarlas.`
              : "Tocá una para editar sus coberturas."}
        </Text>
        {filtradas.slice(0, LIMITE_LISTA).map((inst) => {
          const info = tipoInfo(inst.tipo);
          const sede = inst.sedes[0];
          return (
            <Card
              key={inst.id}
              style={styles.item}
              onPress={() => router.push(`/(admin)/institucion/${inst.id}`)}
              accessibilityLabel={`${inst.nombre}. Editar coberturas`}
            >
              <View style={styles.row}>
                <IconBadge icon={info.icon} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{inst.nombre}</Text>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                    {info.label}
                    {sede ? ` · ${sede.direccion}, ${sede.ciudad}` : ""}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]} numberOfLines={2}>
                    {coberturaTexto(inst)}
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.colors.mutedForeground} />
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
  coordRow: { flexDirection: "row", gap: 12 },
  msg: { fontSize: 13, marginBottom: 12 },
  item: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
});
