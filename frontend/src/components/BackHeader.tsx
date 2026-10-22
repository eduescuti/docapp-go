import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface BackHeaderProps {
  titulo: string;
  subtitulo?: string;
  onBack?: () => void;
}

/**
 * Vuelve a la pantalla anterior. Si hay teclado abierto (formularios), primero lo cierra y espera a que
 * termine: cerrar el teclado y deslizar la pantalla a la vez hace que Android redimensione la pantalla
 * en medio de la animación y se entrecorte.
 */
function volverSinTeclado(router: { back: () => void }) {
  if (!Keyboard.isVisible()) {
    router.back();
    return;
  }
  let listo = false;
  const volver = () => {
    if (listo) return;
    listo = true;
    suscripcion.remove();
    router.back();
  };
  const suscripcion = Keyboard.addListener("keyboardDidHide", volver);
  // Por si el evento no llega (teclado físico, simulador): no se queda esperando.
  setTimeout(volver, 400);
  Keyboard.dismiss();
}

/** Encabezado de pantalla secundaria con botón de volver (área táctil 44px). */
export function BackHeader({ titulo, subtitulo, onBack }: BackHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack ?? (() => volverSinTeclado(router))}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
        style={[styles.backBtn, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.full }]}
      >
        <ChevronLeft size={22} color={theme.colors.foreground} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={[styles.subtitulo, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  titulo: { fontSize: 20, fontWeight: "700" },
  subtitulo: { fontSize: 13, marginTop: 2 },
});
