import { useEffect, useState } from "react";
import { LayoutAnimation, Pressable, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import { BackHeader, Card, ScreenContainer, SectionHeader, Text } from "@/components";
import { PreguntaFrecuente } from "@/domain";
import { FuenteInstituciones, getFuenteInstituciones, listPreguntasFrecuentes } from "@/services";
import { useTheme } from "@/theme";

/** Ayuda: preguntas frecuentes en acordeón. */
export default function AyudaScreen() {
  const { theme } = useTheme();
  const [preguntas, setPreguntas] = useState<PreguntaFrecuente[]>([]);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [fuente, setFuente] = useState<FuenteInstituciones | null>(null);

  useEffect(() => {
    listPreguntasFrecuentes().then(setPreguntas);
    getFuenteInstituciones().then(setFuente);
  }, []);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAbierta((actual) => (actual === id ? null : id));
  };

  return (
    <ScreenContainer>
      <BackHeader titulo="Ayuda" />
      <SectionHeader title="Preguntas frecuentes" />
      <Card padded={false}>
        {preguntas.map((p, i) => {
          const expandida = abierta === p.id;
          return (
            <View key={p.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: theme.colors.border } : undefined}>
              <Pressable
                onPress={() => toggle(p.id)}
                accessibilityRole="button"
                accessibilityLabel={p.pregunta}
                accessibilityState={{ expanded: expandida }}
                style={styles.pregunta}
              >
                <Text style={[styles.preguntaTexto, { color: theme.colors.foreground }]}>{p.pregunta}</Text>
                {expandida ? (
                  <ChevronUp size={18} color={theme.colors.primary} />
                ) : (
                  <ChevronDown size={18} color={theme.colors.mutedForeground} />
                )}
              </Pressable>
              {expandida && <Text style={[styles.respuesta, { color: theme.colors.mutedForeground }]}>{p.respuesta}</Text>}
            </View>
          );
        })}
      </Card>

      {/* Atribuciones obligatorias: REFES (CC BY 4.0, decisión D6) y los datos del mapa. */}
      <SectionHeader title="Datos y fuentes" />
      <Card>
        {fuente ? (
          <Text style={[styles.fuente, { color: theme.colors.mutedForeground }]}>
            Establecimientos de salud: {fuente.fuente} ({fuente.licencia}), versión {fuente.version}.
          </Text>
        ) : null}
        <Text style={[styles.fuente, { color: theme.colors.mutedForeground }]}>
          Mapa: © OpenStreetMap, OpenMapTiles y OpenFreeMap.
        </Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pregunta: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 52 },
  preguntaTexto: { flex: 1, fontSize: 14, fontWeight: "600" },
  respuesta: { fontSize: 13, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 16 },
  fuente: { fontSize: 12, lineHeight: 18 },
});
