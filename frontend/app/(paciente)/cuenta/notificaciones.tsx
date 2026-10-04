import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BellOff } from "lucide-react-native";

import { BackHeader, Card, EmptyState, NotificacionItem, PrimaryButton, ScreenContainer, Text } from "@/components";
import { Notificacion, Paciente } from "@/domain";
import { getPacienteActual, listNotificacionesPaciente, marcarNotificacionLeida, marcarTodasLeidas } from "@/services";
import { useTheme } from "@/theme";

/** Todas las notificaciones del paciente. Tocar una la marca como leída. */
export default function NotificacionesScreen() {
  const { theme } = useTheme();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[] | null>(null);

  const cargar = useCallback(async () => {
    const p = await getPacienteActual();
    setPaciente(p);
    setNotificaciones(await listNotificacionesPaciente(p.id));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const noLeidas = notificaciones?.filter((n) => !n.leida).length ?? 0;

  return (
    <ScreenContainer>
      <BackHeader titulo="Notificaciones" subtitulo={noLeidas > 0 ? `${noLeidas} sin leer` : "Estás al día"} />

      {noLeidas > 0 && paciente && (
        <View style={{ marginBottom: 16 }}>
          <PrimaryButton
            label="Marcar todas como leídas"
            variant="outline"
            onPress={async () => {
              await marcarTodasLeidas(paciente.id);
              cargar();
            }}
          />
        </View>
      )}

      {notificaciones?.length === 0 && (
        <EmptyState icon={BellOff} titulo="No tenés notificaciones" descripcion="Te avisamos acá sobre turnos, resultados, recetas y órdenes." />
      )}
      {notificaciones && notificaciones.length > 0 && (
        <Card padded={false} style={styles.lista}>
          {notificaciones.map((n, i) => (
            <View key={n.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: theme.colors.border } : undefined}>
              <NotificacionItem
                notificacion={n}
                onPress={async () => {
                  if (n.leida) return;
                  await marcarNotificacionLeida(n.id);
                  cargar();
                }}
              />
            </View>
          ))}
        </Card>
      )}
      {notificaciones && notificaciones.length > 0 && (
        <Text style={[styles.ayuda, { color: theme.colors.mutedForeground }]}>Tocá una notificación para marcarla como leída.</Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lista: { padding: 4 },
  ayuda: { fontSize: 12, textAlign: "center", marginTop: 12 },
});
