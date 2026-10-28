import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Camera, Images, Trash2, type LucideIcon } from "lucide-react-native";

import { elegirFotoPerfil, guardarFotoPerfil, OrigenFoto, quitarFotoPerfil } from "@/services/fotoPerfil";
import { useTheme } from "@/theme";
import { alPresionar } from "@/utils/presionado";
import { Avatar } from "./Avatar";
import { BottomSheet } from "./BottomSheet";
import { Text } from "./Text";

interface FotoPerfilEditableProps {
  avatarUrl?: string;
  iniciales: string;
  /** Quién ve la foto (se aclara en la hoja). */
  quienLaVe: string;
  /** Mientras no llegaron los datos de la persona. */
  deshabilitado?: boolean;
  /** Color de lo que hay detrás, para el borde del ícono de cámara. */
  colorFondo?: string;
  size?: number;
  onCambio: (avatarUrl: string | undefined) => void;
}

type Paso = "opciones" | "eligiendo" | "subiendo" | "quitando";

/**
 * Foto de perfil que se toca para cambiarla: abre una hoja con "Sacar una foto", "Elegir de la galería" y
 * "Quitar foto". La cámara o la galería se abren con la hoja abierta (en iOS no se pueden abrir mientras un
 * modal se está cerrando) y la hoja se cierra cuando la foto ya subió; si algo falla, el error se ve ahí.
 */
export function FotoPerfilEditable({
  avatarUrl,
  iniciales,
  quienLaVe,
  deshabilitado = false,
  colorFondo,
  size = 88,
  onCambio,
}: FotoPerfilEditableProps) {
  const { theme } = useTheme();
  const [abierta, setAbierta] = useState(false);
  const [paso, setPaso] = useState<Paso>("opciones");
  const [error, setError] = useState<string | null>(null);
  const ocupado = paso !== "opciones";

  const abrir = () => {
    setError(null);
    setAbierta(true);
  };

  const elegir = async (origen: OrigenFoto) => {
    setError(null);
    setPaso("eligiendo");
    try {
      const imagen = await elegirFotoPerfil(origen);
      if (!imagen) return;
      setPaso("subiendo");
      onCambio(await guardarFotoPerfil(imagen));
      setAbierta(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos cambiar la foto. Probá de nuevo.");
    } finally {
      setPaso("opciones");
    }
  };

  const quitar = async () => {
    setError(null);
    setPaso("quitando");
    try {
      await quitarFotoPerfil();
      onCambio(undefined);
      setAbierta(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos quitar la foto. Probá de nuevo.");
    } finally {
      setPaso("opciones");
    }
  };

  const insignia = Math.max(28, Math.round(size * 0.36));

  return (
    <>
      <Pressable
        onPress={abrir}
        disabled={deshabilitado}
        accessibilityRole="button"
        accessibilityLabel={avatarUrl ? "Cambiar foto de perfil" : "Agregar foto de perfil"}
        style={({ pressed }) => [styles.tocable, alPresionar(pressed)]}
      >
        <View>
          <Avatar uri={avatarUrl} iniciales={iniciales} size={size} />
          <View
            style={[
              styles.insignia,
              {
                width: insignia,
                height: insignia,
                borderRadius: insignia / 2,
                backgroundColor: theme.colors.primary,
                borderColor: colorFondo ?? theme.colors.background,
              },
            ]}
          >
            <Camera size={insignia * 0.5} color={theme.colors.primaryForeground} />
          </View>
        </View>
        <Text style={[styles.etiqueta, { color: theme.colors.primary }]}>{avatarUrl ? "Cambiar foto" : "Agregar foto"}</Text>
      </Pressable>

      <BottomSheet visible={abierta} titulo="Foto de perfil" onClose={() => !ocupado && setAbierta(false)}>
        <Text style={[styles.nota, { color: theme.colors.mutedForeground }]}>{quienLaVe}</Text>

        {paso === "subiendo" || paso === "quitando" ? (
          <View style={styles.progreso} accessibilityLiveRegion="polite">
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={{ color: theme.colors.foreground }}>{paso === "subiendo" ? "Subiendo la foto…" : "Quitando la foto…"}</Text>
          </View>
        ) : (
          <View>
            <Opcion icono={Camera} texto="Sacar una foto" onPress={() => elegir("camara")} deshabilitada={ocupado} />
            <Opcion icono={Images} texto="Elegir de la galería" onPress={() => elegir("galeria")} deshabilitada={ocupado} />
            {avatarUrl ? <Opcion icono={Trash2} texto="Quitar foto" onPress={quitar} deshabilitada={ocupado} peligro /> : null}
          </View>
        )}

        {error ? (
          <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.danger }]}>
            {error}
          </Text>
        ) : null}
      </BottomSheet>
    </>
  );
}

interface OpcionProps {
  icono: LucideIcon;
  texto: string;
  onPress: () => void;
  deshabilitada: boolean;
  peligro?: boolean;
}

function Opcion({ icono: Icono, texto, onPress, deshabilitada, peligro = false }: OpcionProps) {
  const { theme } = useTheme();
  const color = peligro ? theme.colors.danger : theme.colors.accentForeground;
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitada}
      accessibilityRole="button"
      accessibilityLabel={texto}
      style={({ pressed }) => [styles.opcion, { borderTopColor: theme.colors.border }, alPresionar(pressed)]}
    >
      <View
        style={[
          styles.opcionIcono,
          { backgroundColor: peligro ? `${theme.colors.danger}1A` : theme.colors.accent, borderRadius: theme.radii.md },
        ]}
      >
        <Icono size={20} color={color} />
      </View>
      <Text style={[styles.opcionTexto, { color: peligro ? theme.colors.danger : theme.colors.foreground }]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tocable: { alignItems: "center", alignSelf: "center", gap: 8, minHeight: 44 },
  insignia: { position: "absolute", right: -2, bottom: -2, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  etiqueta: { fontSize: 14, fontWeight: "600" },
  nota: { fontSize: 13, marginBottom: 12 },
  progreso: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 },
  opcion: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, borderTopWidth: 1 },
  opcionIcono: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  opcionTexto: { fontSize: 15, fontWeight: "600" },
  error: { fontSize: 13, marginTop: 12 },
});
