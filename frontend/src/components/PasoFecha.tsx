import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react-native";

import { useTheme } from "@/theme";
import { Calendario } from "./Calendario";
import { Colapsable } from "./Colapsable";
import { ANCHO_MINI_CARD, estilosMiniCard, SEPARACION_MINI_CARDS } from "./miniCards";
import { PasoReserva } from "./PasoReserva";
import { Text } from "./Text";

/** Un día de la tira, con todo lo que se muestra ya calculado (se arma una vez, no en cada dibujo). */
export interface DiaTira {
  iso: string;
  diaSemana: string;
  diaMes: string;
  etiqueta: string;
}

interface PasoFechaProps {
  fecha: string | null;
  hoy: string;
  limite: string;
  dias: DiaTira[];
  onElegirFecha: (fechaIso: string) => void;
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Paso 1 de la reserva: tira de días y mini calendario que se despliega. Es un componente aparte, con el
 * estado de "calendario abierto" adentro, para que abrirlo no obligue a volver a dibujar toda la reserva
 * (con sus 91 días, horarios, hospitales y profesionales) justo cuando empieza la animación.
 */
export const PasoFecha = React.memo(function PasoFecha({ fecha, hoy, limite, dias, onElegirFecha }: PasoFechaProps) {
  const { theme } = useTheme();
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  // El calendario se arma de antemano, cuando la pantalla ya está quieta: abrirlo es solo la animación.
  const [calendarioListo, setCalendarioListo] = useState(false);

  useEffect(() => {
    let inactivo: number | undefined;
    const t = setTimeout(() => {
      // Cuando el hilo de JS está libre (con tope de 1 s por si nunca lo está). Safari no tiene `requestIdleCallback`.
      if (typeof requestIdleCallback === "function") inactivo = requestIdleCallback(() => setCalendarioListo(true), { timeout: 1000 });
      else setCalendarioListo(true);
    }, 500);
    return () => {
      clearTimeout(t);
      if (inactivo !== undefined && typeof cancelIdleCallback === "function") cancelIdleCallback(inactivo);
    };
  }, []);

  // La tira acompaña a la fecha elegida (sea desde la tira o desde el calendario).
  const tira = useRef<ScrollView>(null);
  const [anchoTira, setAnchoTira] = useState(0);
  useEffect(() => {
    const indice = dias.findIndex((d) => d.iso === fecha);
    if (indice < 0 || !anchoTira) return;
    const x = indice * (ANCHO_MINI_CARD + SEPARACION_MINI_CARDS) - (anchoTira - ANCHO_MINI_CARD) / 2;
    tira.current?.scrollTo({ x: Math.max(0, x), animated: true });
  }, [fecha, dias, anchoTira]);

  const alElegirEnCalendario = useCallback(
    (iso: string) => {
      onElegirFecha(iso);
      setCalendarioAbierto(false);
    },
    [onElegirFecha],
  );

  const mesVisible = capitalizar(format(parseISO(fecha ?? hoy), "MMMM yyyy", { locale: es }));

  return (
    <PasoReserva
      numero={1}
      titulo="Fecha"
      completo={!!fecha}
      accion={
        <Pressable
          onPress={() => setCalendarioAbierto((abierto) => !abierto)}
          accessibilityRole="button"
          accessibilityLabel={calendarioAbierto ? "Cerrar el calendario" : "Abrir el calendario para elegir una fecha"}
          accessibilityState={{ expanded: calendarioAbierto }}
          style={[
            styles.botonCalendario,
            {
              backgroundColor: calendarioAbierto ? theme.colors.highlight : theme.colors.card,
              borderColor: calendarioAbierto ? theme.colors.primary : theme.colors.border,
            },
          ]}
        >
          <CalendarDays size={16} color={theme.colors.primary} />
          <Text style={[styles.botonCalendarioTexto, { color: theme.colors.foreground }]}>{mesVisible}</Text>
          <ChevronDown size={14} color={theme.colors.mutedForeground} style={{ transform: [{ rotate: calendarioAbierto ? "180deg" : "0deg" }] }} />
        </Pressable>
      }
    >
      <Colapsable abierto={calendarioAbierto} conservarMontado={calendarioListo}>
        <View style={styles.calendario}>
          <Calendario valor={fecha} onChange={alElegirEnCalendario} desde={hoy} hasta={limite} />
        </View>
      </Colapsable>

      <ScrollView
        ref={tira}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setAnchoTira(e.nativeEvent.layout.width)}
        style={estilosMiniCard.tira}
        contentContainerStyle={{ gap: SEPARACION_MINI_CARDS }}
      >
        {dias.map((dia) => (
          <CeldaTira key={dia.iso} dia={dia} seleccionado={dia.iso === fecha} onElegir={onElegirFecha} />
        ))}
      </ScrollView>
    </PasoReserva>
  );
});

interface CeldaTiraProps {
  dia: DiaTira;
  seleccionado: boolean;
  onElegir: (fechaIso: string) => void;
}

/** Una mini card de la tira. Al elegir un día solo se vuelven a dibujar el que se elige y el que se suelta. */
const CeldaTira = React.memo(function CeldaTira({ dia, seleccionado, onElegir }: CeldaTiraProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => onElegir(dia.iso)}
      accessibilityRole="button"
      accessibilityLabel={dia.etiqueta}
      accessibilityState={{ selected: seleccionado }}
      style={[
        estilosMiniCard.miniCard,
        {
          backgroundColor: seleccionado ? theme.colors.primary : theme.colors.card,
          borderColor: seleccionado ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text style={{ fontSize: 12, color: seleccionado ? theme.colors.primaryForeground : theme.colors.mutedForeground }}>{dia.diaSemana}</Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: seleccionado ? theme.colors.primaryForeground : theme.colors.foreground }}>
        {dia.diaMes}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  botonCalendario: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  botonCalendarioTexto: { fontSize: 13, fontWeight: "600" },
  calendario: { paddingBottom: 12 },
});
