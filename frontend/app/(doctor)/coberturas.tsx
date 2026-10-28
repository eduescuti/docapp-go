import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BackHeader, PrimaryButton, ScreenContainer, SelectorCoberturas, Text } from "@/components";
import { CoberturaAceptada, ObraSocialConPlanes } from "@/domain";
import { getMedicoActual, guardarMisCoberturas, listObrasSociales } from "@/services";
import { useTheme } from "@/theme";
import { dejarAviso } from "@/utils/avisoAlVolver";

/**
 * "Coberturas que atiendo": el profesional elige con qué obras sociales (y, si quiere, qué planes) trabaja
 * (regla 17). Los pacientes de otras coberturas no lo ven (regla 18). Se abre desde su Perfil.
 */
export default function DoctorCoberturasScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [obrasSociales, setObrasSociales] = useState<ObraSocialConPlanes[]>([]);
  const [coberturas, setCoberturas] = useState<CoberturaAceptada[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre arranca con lo guardado (se descartan cambios de una visita anterior).
  useFocusEffect(
    useCallback(() => {
      setError(null);
      Promise.all([getMedicoActual(), listObrasSociales()]).then(([m, os]) => {
        setCoberturas(m.coberturas);
        setObrasSociales(os);
      });
    }, []),
  );

  const guardar = async () => {
    setError(null);
    setGuardando(true);
    try {
      await guardarMisCoberturas(coberturas);
      dejarAviso("Guardaste tus coberturas. Los pacientes de esas obras sociales ya te ven.");
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar las coberturas.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScreenContainer>
      <BackHeader titulo="Coberturas que atiendo" subtitulo="Solo te ven los pacientes de estas obras sociales" />

      <SelectorCoberturas obrasSociales={obrasSociales} value={coberturas} onChange={setCoberturas} />

      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <View style={styles.pie}>
        <PrimaryButton label="Guardar coberturas" onPress={guardar} loading={guardando} />
        <Text style={[styles.nota, { color: theme.colors.mutedForeground }]}>
          Los turnos que ya tenés no cambian aunque saques una obra social.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: 13, marginTop: 16 },
  pie: { marginTop: 24, marginBottom: 32, gap: 10 },
  nota: { fontSize: 12, textAlign: "center" },
});
