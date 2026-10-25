import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  parseISO,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

interface CalendarioProps {
  /** Fecha elegida ("yyyy-MM-dd"). */
  valor: string | null;
  onChange: (fechaIso: string) => void;
  /**
   * Primer y último día que se pueden elegir ("yyyy-MM-dd"). Todos los del medio se pueden elegir,
   * sábados y domingos incluidos: qué días atienden lo decide el backend, no el calendario.
   */
  desde: string;
  hasta: string;
  /** Días ("yyyy-MM-dd") que llevan un punto debajo del número (p. ej. los que tienen turnos en la agenda). */
  diasMarcados?: string[];
}

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const ISO = "yyyy-MM-dd";

/** Calendario mensual (semana desde el lunes). */
export function Calendario({ valor, onChange, desde, hasta, diasMarcados }: CalendarioProps) {
  const { theme } = useTheme();
  const marcados = useMemo(() => new Set(diasMarcados), [diasMarcados]);
  const primerDia = useMemo(() => parseISO(desde), [desde]);
  const ultimoDia = useMemo(() => parseISO(hasta), [hasta]);
  const [mes, setMes] = useState(() => startOfMonth(valor ? parseISO(valor) : primerDia));

  // Si la fecha se cambia desde afuera (p. ej. con la tira de días), el mes sigue a la fecha.
  useEffect(() => {
    if (valor) setMes(startOfMonth(parseISO(valor)));
  }, [valor]);

  const hayAnterior = !isSameMonth(mes, primerDia) && mes > primerDia;
  const haySiguiente = endOfMonth(mes) < ultimoDia;

  // Casillas vacías hasta el primer día (la semana empieza el lunes) + los días del mes, con su etiqueta de
  // accesibilidad ya armada: se calcula una vez por mes y no cada vez que se elige un día.
  const celdas = useMemo(() => {
    const vacias = (getDay(mes) + 6) % 7;
    const cantidad = endOfMonth(mes).getDate();
    return [
      ...Array.from({ length: vacias }, () => null),
      ...Array.from({ length: cantidad }, (_, i) => {
        const dia = new Date(mes.getFullYear(), mes.getMonth(), i + 1);
        return { iso: format(dia, ISO), numero: i + 1, etiqueta: format(dia, "EEEE d 'de' MMMM", { locale: es }) };
      }),
    ];
  }, [mes]);

  const titulo = format(mes, "MMMM yyyy", { locale: es });
  const hoy = format(new Date(), ISO);

  return (
    <View
      style={[styles.contenedor, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}
    >
      <View style={styles.encabezado}>
        <Pressable
          onPress={() => setMes((m) => addMonths(m, -1))}
          disabled={!hayAnterior}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          accessibilityState={{ disabled: !hayAnterior }}
          style={[styles.flecha, { backgroundColor: theme.colors.muted, opacity: hayAnterior ? 1 : 0.35 }]}
        >
          <ChevronLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]} accessibilityLiveRegion="polite">
          {titulo}
        </Text>
        <Pressable
          onPress={() => setMes((m) => addMonths(m, 1))}
          disabled={!haySiguiente}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          accessibilityState={{ disabled: !haySiguiente }}
          style={[styles.flecha, { backgroundColor: theme.colors.muted, opacity: haySiguiente ? 1 : 0.35 }]}
        >
          <ChevronRight size={20} color={theme.colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.fila}>
        {DIAS_SEMANA.map((d) => (
          <View key={d} style={styles.celda}>
            <Text style={[styles.diaSemana, { color: theme.colors.mutedForeground }]}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grilla}>
        {celdas.map((celda, i) =>
          celda ? (
            <CeldaDia
              key={celda.iso}
              iso={celda.iso}
              numero={celda.numero}
              etiqueta={celda.etiqueta}
              habilitado={celda.iso >= desde && celda.iso <= hasta}
              elegido={celda.iso === valor}
              esHoy={celda.iso === hoy}
              marcado={marcados.has(celda.iso)}
              onChange={onChange}
            />
          ) : (
            <View key={`vacia-${i}`} style={styles.celda} />
          ),
        )}
      </View>
    </View>
  );
}

interface CeldaDiaProps {
  iso: string;
  numero: number;
  etiqueta: string;
  habilitado: boolean;
  elegido: boolean;
  esHoy: boolean;
  marcado: boolean;
  onChange: (fechaIso: string) => void;
}

/** Un día del calendario. Solo se vuelve a dibujar si cambia algo de ese día (no los 30 de golpe al elegir uno). */
const CeldaDia = React.memo(function CeldaDia({ iso, numero, etiqueta, habilitado, elegido, esHoy, marcado, onChange }: CeldaDiaProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.celda}>
      <Pressable
        onPress={() => onChange(iso)}
        disabled={!habilitado}
        accessibilityRole="button"
        accessibilityLabel={marcado ? `${etiqueta}, con turnos` : etiqueta}
        accessibilityState={{ selected: elegido, disabled: !habilitado }}
        style={[
          styles.dia,
          {
            backgroundColor: elegido ? theme.colors.primary : habilitado ? theme.colors.muted : "transparent",
            borderColor: esHoy && !elegido ? theme.colors.primary : "transparent",
          },
        ]}
      >
        <Text
          style={[
            styles.numero,
            {
              color: elegido ? theme.colors.primaryForeground : habilitado ? theme.colors.foreground : theme.colors.mutedForeground,
              opacity: habilitado || elegido ? 1 : 0.45,
              fontWeight: habilitado ? "600" : "400",
            },
          ]}
        >
          {numero}
        </Text>
        {marcado ? (
          <View style={[styles.marca, { backgroundColor: elegido ? theme.colors.primaryForeground : theme.colors.primary }]} />
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  contenedor: { borderWidth: 1, padding: 12 },
  encabezado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  flecha: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  titulo: { fontSize: 16, fontWeight: "600", textTransform: "capitalize" },
  fila: { flexDirection: "row" },
  grilla: { flexDirection: "row", flexWrap: "wrap" },
  // 7 columnas iguales: el ancho de la celda es 1/7 del calendario.
  celda: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 2 },
  diaSemana: { fontSize: 12, fontWeight: "600", paddingVertical: 6 },
  dia: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  numero: { fontSize: 14 },
  marca: { position: "absolute", bottom: 4, width: 5, height: 5, borderRadius: 3 },
});
