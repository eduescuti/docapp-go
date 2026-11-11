import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";

interface ColapsableProps {
  abierto: boolean;
  children: React.ReactNode;
  conservarMontado?: boolean;
}

const DURACION_MS = 280;

/**
 * Panel que se despliega y se pliega con una animación (alto, opacidad y un leve deslizamiento).
 * Mientras está cerrado no renderiza su contenido, así no queda nada tocable ni leíble oculto.
 */
export function Colapsable({ abierto, children, conservarMontado = false }: ColapsableProps) {
  const progreso = useRef(new Animated.Value(abierto ? 1 : 0)).current;
  const alto = useRef(new Animated.Value(0)).current;
  const [montado, setMontado] = useState(abierto);

  useEffect(() => {
    if (abierto) setMontado(true);
    const animacion = Animated.timing(progreso, {
      toValue: abierto ? 1 : 0,
      duration: DURACION_MS,
      easing: abierto ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
      useNativeDriver: false,
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
      pointerEvents={abierto ? "auto" : "none"}
      aria-hidden={!abierto}
      importantForAccessibility={abierto ? "auto" : "no-hide-descendants"}
    >
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
