import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { ArrowLeft, MapPin } from "lucide-react-native";

import { Card } from "@/components";
import { Institucion } from "@/domain";
import { getPacienteActual, listInstituciones } from "@/services";
import { useTheme } from "@/theme";

const REGION_INICIAL = {
  latitude: -34.595,
  longitude: -58.42,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapaScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [seleccionada, setSeleccionada] = useState<Institucion | null>(null);

  useEffect(() => {
    getPacienteActual().then(async (p) => {
      const lista = await listInstituciones({ planMedicoId: p.planMedicoId });
      setInstituciones(lista);
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MapView provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFill} initialRegion={REGION_INICIAL}>
        {instituciones.flatMap((institucion) =>
          institucion.sedes.map((sede) => (
            <Marker
              key={sede.id}
              coordinate={{ latitude: sede.latitud, longitude: sede.longitud }}
              title={institucion.nombre}
              description={sede.direccion}
              onPress={() => setSeleccionada(institucion)}
            />
          )),
        )}
      </MapView>

      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
        style={[styles.backButton, { top: insets.top + 12, backgroundColor: `${theme.colors.card}EE`, borderColor: theme.colors.border }]}
      >
        <ArrowLeft size={20} color={theme.colors.foreground} />
      </Pressable>

      {seleccionada && (
        <Card style={[styles.infoCard, { bottom: insets.bottom + 16 }]} accessibilityLabel={seleccionada.nombre}>
          <View style={styles.infoRow}>
            <MapPin size={20} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoNombre, { color: theme.colors.foreground }]}>{seleccionada.nombre}</Text>
              <Text style={[styles.infoDireccion, { color: theme.colors.mutedForeground }]}>
                {seleccionada.sedes[0]?.direccion}
              </Text>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: { position: "absolute", left: 24, right: 24 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoNombre: { fontSize: 14, fontWeight: "600" },
  infoDireccion: { fontSize: 12, marginTop: 2 },
});
