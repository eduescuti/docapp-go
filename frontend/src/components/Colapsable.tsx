import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";

interface ColapsableProps {
  abierto: boolean;
  children: React.ReactNode;
  /**
   * Deja el contenido armado (y medido) aunque esté cerrado, plegado a alto 0. Abrir es entonces solo la
   * animación: armar el contenido en el mismo momento en que arranca es lo que hace que se entrecorte.
   */
  conservarMontado?: boolean;
}

const DURACION_MS = 280;

/**
 * Panel que se despliega y se pliega con una animación (alto, opacidad y un leve deslizamiento).
 * Mientras está cerrado no renderiza su contenido, así no queda nada tocable ni leíble oculto.
 */
export function Colapsable({ abierto, children, conservarMontado = false }: ColapsableProps) {
  const progreso = useRef(new Animated.Value(abierto ? 1 : 0)).current;
  // Alto natural del contenido, medido: el alto animado es progreso × alto.
  const alto = useRef(new Animated.Value(0)).current;
  const [montado, setMontado] = useState(abierto);

  useEffect(() => {
    if (abierto) setMontado(true);
    const animacion = Animated.timing(progreso, {
      toValue: abierto ? 1 : 0,
      duration: DURACION_MS,
      easing: abierto ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
      useNativeDriver: false, // el alto no se anima con el driver nativo
    });
    animacion.start(({ finished }) => {
      if (finished && !abierto && !conservarMontado) setMontado(false);
    });
    return () => animacion.stop();
  }, [abierto, progreso, conservarMontado]);

  if (!montado && !conservarMontado) return null;

  return (
    <Animated.View
      style={{ height: Animated.multiply(progreso, alto), opacity: progreso, overflow: "hidden" }}
      // Cerrado pero armado: no se toca ni lo leen los lectores de pantalla.
      pointerEvents={abierto ? "auto" : "none"}
      aria-hidden={!abierto}
      importantForAccessibility={abierto ? "auto" : "no-hide-descendants"}
    >
      {/* Absoluto para que el contenido mida su alto real sin importar el alto animado del contenedor. */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: [{ translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        }}
      >
        <View onLayout={(e) => alto.setValue(e.nativeEvent.layout.height)}>{children}</View>
      </Animated.View>
    </Animated.View>
  );
}
