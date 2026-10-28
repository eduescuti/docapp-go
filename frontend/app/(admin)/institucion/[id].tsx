import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import {
  BackHeader,
  CamposFuente,
  Card,
  FuenteEditable,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  SelectorCoberturas,
  Text,
} from "@/components";
import { CoberturaAceptada, Institucion, ObraSocialConPlanes } from "@/domain";
import { getInstitucion, guardarCoberturasInstitucion, listObrasSociales } from "@/services";
import { useTheme } from "@/theme";
import { textoFuente } from "@/utils/cobertura";
import { hoyIso } from "@/utils/format";
import { ETIQUETA_TIPO } from "@/utils/institucion";

const FUENTE_VACIA: FuenteEditable = { fuente: "web_institucion", fuenteUrl: "" };

/**
 * El admin edita las coberturas de una institución (regla 17): qué obras sociales acepta (enteras o algunos
 * planes) y de dónde sale el dato. Las públicas no tienen coberturas: las ven todos los pacientes (regla 15).
 */
export default function AdminInstitucionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const router = useRouter();

  const [institucion, setInstitucion] = useState<Institucion | null>(null);
  const [obrasSociales, setObrasSociales] = useState<ObraSocialConPlanes[]>([]);
  const [coberturas, setCoberturas] = useState<CoberturaAceptada[]>([]);
  const [fuente, setFuente] = useState<FuenteEditable>(FUENTE_VACIA);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      setMensaje(null);
      Promise.all([getInstitucion(id), listObrasSociales()]).then(([inst, os]) => {
        setInstitucion(inst ?? null);
        setObrasSociales(os);
        setCoberturas(inst?.coberturas ?? []);
        setFuente(
          inst?.fuenteCoberturas
            ? { fuente: inst.fuenteCoberturas.fuente, fuenteUrl: inst.fuenteCoberturas.fuenteUrl ?? "" }
            : FUENTE_VACIA,
        );
      });
    }, [id]),
  );

  const guardar = async () => {
    if (!institucion) return;
    setMensaje(null);
    setGuardando(true);
    try {
      const actualizada = await guardarCoberturasInstitucion(institucion.id, coberturas, {
        fuente: fuente.fuente,
        fuenteUrl: fuente.fuenteUrl,
        verificadoEl: hoyIso(),
      });
      setInstitucion(actualizada);
      setMensaje({ tipo: "ok", texto: "Coberturas guardadas. Los pacientes de esas obras sociales ya la ven." });
    } catch (e) {
      setMensaje({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudieron guardar las coberturas." });
    } finally {
      setGuardando(false);
    }
  };

  const sede = institucion?.sedes[0];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenContainer>
        <BackHeader titulo={institucion?.nombre ?? "Institución"} onBack={() => router.back()} />

        {institucion ? (
          <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
            {ETIQUETA_TIPO[institucion.tipo]}
            {sede ? ` · ${sede.direccion}, ${sede.ciudad}` : ""}
          </Text>
        ) : null}

        {institucion?.origen === "publico" ? (
          <Card style={styles.bloque}>
            <Text style={[styles.texto, { color: theme.colors.foreground }]}>
              Es un establecimiento público: lo ven todos los pacientes, sin importar su obra social. No hace falta cargarle
              coberturas.
            </Text>
          </Card>
        ) : institucion ? (
          <>
            {institucion.fuenteCoberturas ? (
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                Última carga: {textoFuente(institucion.fuenteCoberturas).toLowerCase()}
                {institucion.fuenteCoberturas.fuenteUrl ? `\n${institucion.fuenteCoberturas.fuenteUrl}` : ""}
              </Text>
            ) : null}

            <SectionHeader title="Obras sociales que acepta" />
            <SelectorCoberturas obrasSociales={obrasSociales} value={coberturas} onChange={setCoberturas} />

            {coberturas.length > 0 ? (
              <>
                <View style={{ height: 20 }} />
                <SectionHeader title="¿De dónde sale?" />
                <CamposFuente value={fuente} onChange={setFuente} />
              </>
            ) : null}

            {mensaje ? (
              <Text
                style={[styles.mensaje, { color: mensaje.tipo === "ok" ? theme.colors.success : theme.colors.danger }]}
                accessibilityLiveRegion="polite"
              >
                {mensaje.texto}
              </Text>
            ) : null}

            <View style={styles.pie}>
              <PrimaryButton label="Guardar coberturas" onPress={guardar} loading={guardando} />
            </View>
          </>
        ) : null}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  meta: { fontSize: 12, lineHeight: 18, marginBottom: 16 },
  bloque: { marginTop: 8 },
  texto: { fontSize: 14, lineHeight: 20 },
  mensaje: { fontSize: 13, marginTop: 16 },
  pie: { marginTop: 20, marginBottom: 32 },
});
