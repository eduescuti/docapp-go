import { useRef, useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IdCard, Lock, ShieldCheck, Zap, ZapOff, X } from "lucide-react-native";

import { DniLeido } from "@/domain";
import { leerDni } from "@/services";
import { useTheme } from "@/theme";
import { Card } from "./Card";
import { IconBadge } from "./IconBadge";
import { PrimaryButton } from "./PrimaryButton";
import { Text } from "./Text";

interface VerificarDniProps {
  /** El DNI ya leído (se muestra como verificado) o null. */
  verificado: DniLeido | null;
  /** Se leyó un DNI válido y sin cuenta: `codigo` es el texto del código, que se manda al crear la cuenta. */
  onVerificado: (codigo: string, datos: DniLeido) => void;
  /** "Escanear de nuevo": se descarta el DNI leído. */
  onReiniciar: () => void;
}

/** Puntos de miles del DNI: "40111222" → "40.111.222". */
const conPuntos = (dni: string) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/**
 * Verificación de identidad del registro (decidido el 28/10/2026): se escanea con la cámara el código PDF417 del
 * frente del DNI. El backend lo lee, devuelve DNI, nombre y apellido y avisa si ese DNI ya tiene cuenta. No se
 * guarda ninguna imagen: la cámara solo lee el código, y en la base queda la fecha de verificación y un hash del
 * número de trámite (para que un mismo DNI no abra dos cuentas).
 */
export function VerificarDni({ verificado, onVerificado, onReiniciar }: VerificarDniProps) {
  const { theme } = useTheme();
  const [escaneando, setEscaneando] = useState(false);

  if (verificado) {
    return (
      <Card style={[styles.card, { borderColor: theme.colors.success }]} accessibilityLiveRegion="polite">
        <View style={styles.fila}>
          <IconBadge icon={ShieldCheck} size={44} />
          <View style={styles.flex}>
            <Text style={[styles.etiqueta, { color: theme.colors.success }]}>Identidad verificada</Text>
            <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
              {verificado.nombre} {verificado.apellido}
            </Text>
            <Text style={[styles.texto, { color: theme.colors.mutedForeground }]}>DNI {conPuntos(verificado.dni)}</Text>
          </View>
        </View>
        <Pressable onPress={onReiniciar} accessibilityRole="button" accessibilityLabel="Escanear otro DNI" style={styles.enlace}>
          <Text style={[styles.enlaceTexto, { color: theme.colors.primary }]}>¿No sos vos? Escanear otro DNI</Text>
        </Pressable>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.fila}>
        <IconBadge icon={IdCard} size={44} />
        <View style={styles.flex}>
          <Text variant="heading" style={[styles.nombre, { color: theme.colors.foreground }]}>
            Verificá tu identidad
          </Text>
          <Text style={[styles.texto, { color: theme.colors.mutedForeground }]}>
            Escaneá el código de barras del frente de tu DNI. Así confirmamos que el DNI es tuyo y que nadie más lo usa
            para crear una cuenta.
          </Text>
        </View>
      </View>
      <View style={[styles.privacidad, { backgroundColor: theme.colors.muted, borderRadius: theme.radii.md }]}>
        <Lock size={14} color={theme.colors.mutedForeground} />
        <Text style={[styles.privacidadTexto, { color: theme.colors.mutedForeground }]}>
          No guardamos fotos de tu DNI ni los datos del código: solo que lo verificaste.
        </Text>
      </View>
      <PrimaryButton label="Escanear mi DNI" onPress={() => setEscaneando(true)} />

      {escaneando ? (
        <EscanerDni
          onCerrar={() => setEscaneando(false)}
          onLeido={(codigo, datos) => {
            setEscaneando(false);
            onVerificado(codigo, datos);
          }}
        />
      ) : null}
    </Card>
  );
}

/**
 * Cámara a pantalla completa que busca el código PDF417. La pantalla de la cámara es siempre oscura (como la de
 * cualquier escáner), en los dos modos de color: el texto va en blanco sobre el video.
 */
function EscanerDni({ onCerrar, onLeido }: { onCerrar: () => void; onLeido: (codigo: string, datos: DniLeido) => void }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [linterna, setLinterna] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // La cámara manda el mismo código muchas veces por segundo: se procesa uno por vez.
  const ocupado = useRef(false);

  const alLeer = async ({ data }: BarcodeScanningResult) => {
    if (ocupado.current || !data) return;
    ocupado.current = true;
    setLeyendo(true);
    setError(null);
    try {
      onLeido(data, await leerDni(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos leer tu DNI. Probá de nuevo.");
      // Se vuelve a intentar después de un momento, para que se alcance a leer el aviso.
      setTimeout(() => {
        ocupado.current = false;
      }, 2000);
    } finally {
      setLeyendo(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <View style={styles.pantalla}>
        {permiso?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={linterna}
            barcodeScannerSettings={{ barcodeTypes: ["pdf417"] }}
            onBarcodeScanned={alLeer}
          />
        ) : null}

        {/* Velo oscuro alrededor del recuadro donde va el código. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.velo} />
          <View style={styles.filaRecuadro}>
            <View style={styles.velo} />
            <View style={[styles.recuadro, { borderColor: error ? theme.colors.danger : "#FFFFFF" }]} />
            <View style={styles.velo} />
          </View>
          <View style={styles.velo} />
        </View>

        <View style={[styles.barraSuperior, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar la cámara" style={styles.botonCamara}>
            <X size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.tituloCamara}>Escaneá tu DNI</Text>
          {permiso?.granted && Platform.OS !== "web" ? (
            <Pressable
              onPress={() => setLinterna((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={linterna ? "Apagar la linterna" : "Prender la linterna"}
              accessibilityState={{ selected: linterna }}
              style={styles.botonCamara}
            >
              {linterna ? <ZapOff size={22} color="#FFFFFF" /> : <Zap size={22} color="#FFFFFF" />}
            </Pressable>
          ) : (
            <View style={styles.botonCamara} />
          )}
        </View>

        <View style={[styles.barraInferior, { paddingBottom: insets.bottom + 24 }]}>
          {!permiso ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : !permiso.granted ? (
            <View style={styles.permiso}>
              <Text style={styles.instruccion}>Necesitamos la cámara para leer el código de tu DNI. No sacamos fotos.</Text>
              {permiso.canAskAgain ? (
                <PrimaryButton label="Permitir la cámara" onPress={pedirPermiso} />
              ) : (
                <PrimaryButton label="Abrir ajustes" onPress={() => Linking.openSettings()} />
              )}
            </View>
          ) : leyendo ? (
            <View style={styles.permiso}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.instruccion}>Verificando tu DNI...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.instruccion}>
                Poné el código de barras del frente de tu DNI dentro del recuadro, con buena luz y sin reflejos.
              </Text>
              {error ? (
                <Text style={[styles.error, { backgroundColor: theme.colors.danger, color: theme.colors.dangerForeground }]} accessibilityLiveRegion="assertive">
                  {error}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const VELO = "rgba(0,0,0,0.6)";

const styles = StyleSheet.create({
  card: { marginBottom: 16, gap: 12 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
  etiqueta: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  nombre: { fontSize: 16, fontWeight: "700" },
  texto: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  privacidad: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  privacidadTexto: { flex: 1, fontSize: 12, lineHeight: 17 },
  enlace: { minHeight: 44, justifyContent: "center" },
  enlaceTexto: { fontSize: 13, fontWeight: "600" },

  pantalla: { flex: 1, backgroundColor: "#000000" },
  velo: { flex: 1, backgroundColor: VELO },
  filaRecuadro: { flexDirection: "row", height: 140 },
  recuadro: { width: "86%", borderWidth: 2, borderRadius: 14 },
  barraSuperior: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  tituloCamara: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  botonCamara: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  barraInferior: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, gap: 12, alignItems: "stretch" },
  instruccion: { color: "#FFFFFF", fontSize: 14, lineHeight: 20, textAlign: "center" },
  permiso: { gap: 14, alignItems: "stretch" },
  error: { fontSize: 13, lineHeight: 18, textAlign: "center", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, overflow: "hidden" },
});
