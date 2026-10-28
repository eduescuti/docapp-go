import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Square, SquareCheck } from "lucide-react-native";

import type { CoberturaAceptada, ObraSocialConPlanes } from "@/domain";
import { useTheme } from "@/theme";
import { CampoBusqueda } from "./CampoBusqueda";
import { Chip } from "./Chip";
import { Text } from "./Text";

interface SelectorCoberturasProps {
  obrasSociales: ObraSocialConPlanes[];
  value: CoberturaAceptada[];
  onChange: (coberturas: CoberturaAceptada[]) => void;
}

/** Sin tildes ni mayúsculas, para que "medife" encuentre "Medifé". */
const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Qué coberturas acepta una institución (admin) o atiende un profesional (su Perfil). Se tilda la obra social
 * y, si tiene varios planes, queda en "Todos los planes" salvo que se elijan algunos (decidido el 27/10/2026).
 */
export function SelectorCoberturas({ obrasSociales, value, onChange }: SelectorCoberturasProps) {
  const { theme } = useTheme();
  const [busqueda, setBusqueda] = useState("");

  const buscada = normalizar(busqueda.trim());
  const visibles = buscada
    ? obrasSociales.filter((o) => normalizar(`${o.nombre} ${o.descripcion ?? ""}`).includes(buscada))
    : obrasSociales;

  const coberturaDe = (obraSocialId: string) => value.find((c) => c.obraSocialId === obraSocialId);

  const alternarObraSocial = (obraSocialId: string) => {
    onChange(coberturaDe(obraSocialId) ? value.filter((c) => c.obraSocialId !== obraSocialId) : [...value, { obraSocialId }]);
  };

  const cambiarPlanes = (obraSocialId: string, planesIds: string[] | undefined) => {
    onChange(value.map((c) => (c.obraSocialId === obraSocialId ? { obraSocialId, planesIds: planesIds?.length ? planesIds : undefined } : c)));
  };

  const alternarPlan = (obraSocialId: string, planId: string) => {
    const actuales = coberturaDe(obraSocialId)?.planesIds ?? [];
    cambiarPlanes(obraSocialId, actuales.includes(planId) ? actuales.filter((id) => id !== planId) : [...actuales, planId]);
  };

  return (
    <View>
      <CampoBusqueda
        valor={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar obra social"
        accessibilityLabel="Buscar obra social"
      />
      <Text style={[styles.cantidad, { color: theme.colors.mutedForeground }]}>
        {value.length === 0
          ? "Ninguna obra social elegida."
          : `${value.length} ${value.length === 1 ? "obra social elegida" : "obras sociales elegidas"}.`}
      </Text>

      {visibles.length === 0 ? (
        <Text style={[styles.cantidad, { color: theme.colors.mutedForeground }]}>No hay obras sociales con ese nombre.</Text>
      ) : null}

      {visibles.map((obraSocial) => {
        const cobertura = coberturaDe(obraSocial.id);
        const todos = !cobertura?.planesIds || cobertura.planesIds.length === 0;
        const Icono = cobertura ? SquareCheck : Square;
        return (
          <View key={obraSocial.id} style={[styles.fila, { borderBottomColor: theme.colors.border }]}>
            <Pressable
              onPress={() => alternarObraSocial(obraSocial.id)}
              accessibilityRole="checkbox"
              accessibilityLabel={obraSocial.nombre}
              accessibilityState={{ checked: !!cobertura }}
              // En web, RN Web no traduce accessibilityState: el estado va también como aria.
              aria-checked={!!cobertura}
              style={styles.obraSocial}
            >
              <Icono size={22} color={cobertura ? theme.colors.primary : theme.colors.mutedForeground} />
              <View style={styles.textos}>
                <Text style={[styles.nombre, { color: theme.colors.foreground }]}>{obraSocial.nombre}</Text>
                {obraSocial.descripcion ? (
                  <Text style={[styles.descripcion, { color: theme.colors.mutedForeground }]} numberOfLines={1}>
                    {obraSocial.descripcion}
                  </Text>
                ) : null}
              </View>
            </Pressable>

            {cobertura && obraSocial.planes.length > 1 ? (
              <View style={styles.planes}>
                <Chip label="Todos los planes" selected={todos} onPress={() => cambiarPlanes(obraSocial.id, undefined)} />
                {obraSocial.planes.map((plan) => (
                  <Chip
                    key={plan.id}
                    label={plan.nombre}
                    selected={!todos && !!cobertura.planesIds?.includes(plan.id)}
                    onPress={() => alternarPlan(obraSocial.id, plan.id)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cantidad: { fontSize: 12, marginTop: 10, marginBottom: 4 },
  fila: { borderBottomWidth: 1, paddingVertical: 4 },
  obraSocial: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 },
  textos: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: "600" },
  descripcion: { fontSize: 12, marginTop: 2 },
  planes: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 34, paddingBottom: 12 },
});
