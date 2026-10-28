import { View } from "react-native";

import type { TipoFuenteCobertura } from "@/domain";
import { ETIQUETA_FUENTE } from "@/utils/cobertura";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

export interface FuenteEditable {
  fuente: TipoFuenteCobertura;
  fuenteUrl: string;
}

const TIPOS: TipoFuenteCobertura[] = ["web_institucion", "cartilla_cobertura", "relevamiento_propio"];
const esTipo = (v: string): v is TipoFuenteCobertura => TIPOS.some((t) => t === v);

const DESCRIPCION: Record<TipoFuenteCobertura, string> = {
  web_institucion: "La página de coberturas del hospital o la clínica",
  cartilla_cobertura: "El buscador de prestadores de la obra social",
  relevamiento_propio: "Lo averiguamos nosotros (sin página oficial)",
};

interface CamposFuenteProps {
  value: FuenteEditable;
  onChange: (fuente: FuenteEditable) => void;
}

/**
 * De dónde salen las coberturas de una institución: una por institución (decidido el 27/10/2026). La fecha de
 * verificación es la del día en que se guarda.
 */
export function CamposFuente({ value, onChange }: CamposFuenteProps) {
  return (
    <View>
      <SelectField
        label="Fuente de las coberturas"
        options={TIPOS.map((t) => ({ value: t, label: ETIQUETA_FUENTE[t], description: DESCRIPCION[t] }))}
        value={value.fuente}
        onChange={(v) => esTipo(v) && onChange({ ...value, fuente: v })}
      />
      {value.fuente !== "relevamiento_propio" ? (
        <TextField
          label="Dirección de la página (URL)"
          value={value.fuenteUrl}
          onChangeText={(fuenteUrl) => onChange({ ...value, fuenteUrl })}
          placeholder="https://..."
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          hint="Se guarda con la fecha de hoy como fecha de verificación."
        />
      ) : null}
    </View>
  );
}
