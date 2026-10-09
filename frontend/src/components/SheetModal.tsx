import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

const DURACION_ENTRADA = 280;
const DURACION_SALIDA = 220;
// En web el driver nativo no existe: la animación corre en JS.
const DRIVER_NATIVO = Platform.OS !== "web";

interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  /** Lectores de pantalla: qué hace tocar el fondo. */
  etiquetaFondo?: string;
  /** Estilo del panel (fondo, bordes, padding). */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Base de todos los paneles que suben desde abajo (detalle de turnos y estudios, notificaciones,
 * selectores). El fondo oscuro aparece de a poco en su lugar y el panel sube por separado: con
 * `animationType="slide"` el fondo subía pegado al panel.
 */
export function SheetModal({ visible, onClose, etiquetaFondo = "Cerrar", style, children }: SheetModalProps) {
  const [montado, setMontado] = useState(visible);
  const montadoRef = useRef(visible);
  const opacidadFondo = useRef(new Animated.Value(0)).current;
  const desplazamiento = useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const altoPanel = useRef(0);
  const esperandoMedida = useRef(false);

  // Mientras se cierra se sigue mostrando el último contenido: las pantallas limpian el detalle
  // (p. ej. `abierto = null`) en el mismo momento en que piden cerrar, y sin esto el panel se
  // vaciaba y se achicaba de golpe antes de bajar.
  const ultimoContenido = useRef(children);
  if (visible) ultimoContenido.current = children;
  const contenido = visible ? children : ultimoContenido.current;

  const entrar = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacidadFondo, {
        toValue: 1,
        duration: DURACION_ENTRADA,
        easing: Easing.out(Easing.quad),
        useNativeDriver: DRIVER_NATIVO,
      }),
      Animated.timing(desplazamiento, {
        toValue: 0,
        duration: DURACION_ENTRADA,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: DRIVER_NATIVO,
      }),
    ]).start();
  }, [opacidadFondo, desplazamiento]);

  const salir = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacidadFondo, {
        toValue: 0,
        duration: DURACION_SALIDA,
        easing: Easing.in(Easing.quad),
        useNativeDriver: DRIVER_NATIVO,
      }),
      Animated.timing(desplazamiento, {
        toValue: altoPanel.current || Dimensions.get("window").height,
        duration: DURACION_SALIDA,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: DRIVER_NATIVO,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        montadoRef.current = false;
        setMontado(false);
      }
    });
  }, [opacidadFondo, desplazamiento]);

  useEffect(() => {
    if (visible) {
      if (montadoRef.current) {
        // Se volvió a abrir mientras se cerraba: vuelve desde donde está.
        entrar();
      } else {
        // La entrada arranca cuando se conoce el alto del panel (onLayout).
        esperandoMedida.current = true;
        opacidadFondo.setValue(0);
        desplazamiento.setValue(Dimensions.get("window").height);
        montadoRef.current = true;
        setMontado(true);
        // Respaldo: si el alto no llega a medirse, entra igual desde el borde de la pantalla.
        setTimeout(() => {
          if (esperandoMedida.current) {
            esperandoMedida.current = false;
            entrar();
          }
        }, 150);
      }
    } else if (montadoRef.current) {
      salir();
    }
  }, [visible, entrar, salir, opacidadFondo, desplazamiento]);

  const alMedir = (evento: LayoutChangeEvent) => {
    altoPanel.current = evento.nativeEvent.layout.height;
    if (esperandoMedida.current) {
      esperandoMedida.current = false;
      desplazamiento.setValue(altoPanel.current);
      entrar();
    }
  };

  return (
    <Modal visible={montado} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.contenedor}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.fondo, { opacity: opacidadFondo }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={etiquetaFondo} />
        </Animated.View>
        {/* Mientras baja no responde a toques: sus botones son del detalle que se está cerrando. */}
        <Animated.View
          onLayout={alMedir}
          style={[style, { transform: [{ translateY: desplazamiento }], pointerEvents: visible ? "auto" : "none" }]}
        >
          {contenido}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: "flex-end" },
  fondo: { backgroundColor: "rgba(0,0,0,0.45)" },
});
