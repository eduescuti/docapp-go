import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { urlDeLaApi } from "@/services/apiClient";
import { useTheme } from "@/theme";
import { Text } from "./Text";

interface AvatarProps {
  /** Foto de perfil: la ruta que da la API (`/api/fotos/...`) o una URL completa. */
  uri?: string;
  iniciales: string;
  size?: number;
}

/** Foto de perfil redonda. Sin foto, o si no se pudo cargar, muestra las iniciales. */
export function Avatar({ uri, iniciales, size = 48 }: AvatarProps) {
  const { theme } = useTheme();
  const radius = size / 2;
  const fuente = urlDeLaApi(uri);
  // Se guarda cuál falló (y no un sí/no) para que una foto nueva se vuelva a intentar.
  const [fallida, setFallida] = useState<string | null>(null);

  if (fuente && fuente !== fallida) {
    return (
      <Image
        source={{ uri: fuente }}
        onError={() => setFallida(fuente)}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.colors.muted }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: `${theme.colors.primary}33`,
        },
      ]}
    >
      <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: size * 0.35 }}>{iniciales}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
