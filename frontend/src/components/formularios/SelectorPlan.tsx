import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import type { ObraSocialConPlanes } from "@/domain";
import { SelectField } from "./SelectField";

interface SelectorPlanProps {
  obrasSociales: ObraSocialConPlanes[];
  /** Plan elegido (es lo que se guarda del paciente). */
  planId: string | null;
  onChange: (planId: string | null) => void;
  /** Error del formulario (después de intentar enviar): se muestra en el campo que falta. */
  error?: string;
}

/**
 * Obra social y después plan (con 26 obras sociales, una sola lista de planes sería inmanejable). Si la obra
 * social tiene un solo plan, queda elegido y no se pregunta.
 */
export function SelectorPlan({ obrasSociales, planId, onChange, error }: SelectorPlanProps) {
  const obraSocialDelPlan = useMemo(
    () => obrasSociales.find((o) => o.planes.some((p) => p.id === planId))?.id ?? null,
    [obrasSociales, planId],
  );
  const [obraSocialId, setObraSocialId] = useState<string | null>(obraSocialDelPlan);

  // Al cargar el plan guardado (p. ej. en Mi perfil), se muestra su obra social.
  useEffect(() => {
    if (obraSocialDelPlan) setObraSocialId(obraSocialDelPlan);
  }, [obraSocialDelPlan]);

  const obraSocial = obrasSociales.find((o) => o.id === obraSocialId);

  const elegirObraSocial = (id: string) => {
    if (id === obraSocialId) return;
    setObraSocialId(id);
    const planes = obrasSociales.find((o) => o.id === id)?.planes ?? [];
    onChange(planes.length === 1 ? planes[0].id : null);
  };

  return (
    <View>
      <SelectField
        label="Obra social / prepaga"
        placeholder="Elegí tu cobertura"
        options={obrasSociales.map((o) => ({ value: o.id, label: o.nombre, description: o.descripcion }))}
        value={obraSocialId}
        onChange={elegirObraSocial}
        error={!obraSocialId ? error : undefined}
      />
      {obraSocial && obraSocial.planes.length > 1 ? (
        <SelectField
          label={`Plan de ${obraSocial.nombre}`}
          placeholder="Elegí tu plan"
          options={obraSocial.planes.map((p) => ({ value: p.id, label: p.nombre }))}
          value={planId}
          onChange={onChange}
          error={error && !planId ? "Elegí tu plan." : undefined}
        />
      ) : null}
    </View>
  );
}
