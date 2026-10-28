import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronDown, Heart, HelpCircle, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { CampoBusqueda } from "./CampoBusqueda";
import { Colapsable } from "./Colapsable";
import { SheetModal } from "./SheetModal";
import { Text } from "./Text";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  /** Título de la sección en que se agrupa la opción en la lista (las de un mismo grupo van juntas). */
  group?: string;
  /** Se marca más que el resto (fondo suave, barra lateral y un corazón): p. ej. los hospitales favoritos. */
  destacada?: boolean;
  /**
   * Explicación del grupo: junto al título del grupo aparece un "?" que despliega este texto
   * (se toma de la primera opción del grupo).
   */
  ayudaGrupo?: { titulo: string; lineas: string[] };
}

interface SelectFieldProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  /** Botón a la derecha del campo (p. ej. elegir en el mapa). Debería medir 48 px de alto, como el campo. */
  accion?: React.ReactNode;
  /** Listas largas: arriba de las opciones aparece un buscador con este texto de ayuda (p. ej. especialidades). */
  buscador?: string;
}

/** Sin tildes ni mayúsculas, para que "cardio" encuentre "Cardiología". */
const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Selector de una opción: campo que abre un bottom sheet con la lista (equivalente RN de un `<select>`). */
export function SelectField({ label, placeholder = "Seleccionar", options, value, onChange, error, accion, buscador }: SelectFieldProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  // Grupo cuyo "?" está desplegado.
  const [ayudaAbierta, setAyudaAbierta] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const seleccionada = options.find((o) => o.value === value);
  // Cada palabra escrita tiene que estar en el nombre o la descripción de la opción.
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const visibles =
    buscador && palabras.length > 0
      ? options.filter((o) => palabras.every((p) => normalizar(`${o.label} ${o.description ?? ""}`).includes(p)))
      : options;
  const cerrar = () => {
    setAbierto(false);
    setAyudaAbierta(null);
    setBusqueda("");
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>{label}</Text>
      <View style={styles.filaCampo}>
        <Pressable
          onPress={() => setAbierto(true)}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${seleccionada?.label ?? "sin seleccionar"}`}
          style={[
            styles.field,
            {
              backgroundColor: theme.colors.muted,
              borderColor: error ? theme.colors.danger : theme.colors.border,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          {seleccionada?.destacada ? <Heart size={14} color={theme.colors.danger} fill={theme.colors.danger} /> : null}
          <Text
            style={[styles.fieldText, { color: seleccionada ? theme.colors.foreground : theme.colors.mutedForeground }]}
            numberOfLines={1}
          >
            {seleccionada?.label ?? placeholder}
          </Text>
          <ChevronDown size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        {accion}
      </View>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

      <SheetModal
        visible={abierto}
        onClose={cerrar}
        etiquetaFondo="Cerrar selector"
        style={[
          styles.sheet,
          // Con buscador, alto fijo: la hoja no salta mientras la lista se achica al escribir.
          buscador ? styles.sheetConBuscador : null,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderTopLeftRadius: theme.radii.lg * 2,
            borderTopRightRadius: theme.radii.lg * 2,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <Text variant="heading" style={[styles.sheetTitle, { color: theme.colors.foreground }]}>{label}</Text>
          <Pressable
            onPress={cerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            hitSlop={8}
            style={styles.closeBtn}
          >
            <X size={20} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
        {buscador ? (
          <View style={styles.buscador}>
            <CampoBusqueda valor={busqueda} onChange={setBusqueda} placeholder={buscador} accessibilityLabel={buscador} />
            <Text style={[styles.cantidad, { color: theme.colors.mutedForeground }]}>
              {visibles.length === 0
                ? "No hay opciones con ese nombre."
                : `${visibles.length} ${visibles.length === 1 ? "opción" : "opciones"}`}
            </Text>
          </View>
        ) : null}
        <FlatList
          data={visibles}
          extraData={ayudaAbierta}
          keyExtractor={(o) => o.value}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item, index }) => {
            const activa = item.value === value;
            const abreGrupo = !!item.group && item.group !== visibles[index - 1]?.group;
            return (
              <View>
                {abreGrupo ? (
                  <>
                    <View style={styles.grupoFila}>
                      {item.destacada ? <Heart size={12} color={theme.colors.danger} fill={theme.colors.danger} /> : null}
                      <Text style={[styles.grupo, { color: item.destacada ? theme.colors.primary : theme.colors.mutedForeground }]}>{item.group}</Text>
                      {item.ayudaGrupo ? (
                        <Pressable
                          onPress={() => setAyudaAbierta((actual) => (actual === item.group ? null : (item.group ?? null)))}
                          accessibilityRole="button"
                          accessibilityLabel={`Más información sobre ${item.group?.toLowerCase()}`}
                          accessibilityState={{ expanded: ayudaAbierta === item.group }}
                          hitSlop={10}
                          style={styles.botonAyuda}
                        >
                          <HelpCircle size={16} color={ayudaAbierta === item.group ? theme.colors.primary : theme.colors.mutedForeground} />
                        </Pressable>
                      ) : null}
                    </View>
                    {item.ayudaGrupo ? (
                      <Colapsable abierto={ayudaAbierta === item.group}>
                        <View
                          style={[styles.ayuda, { backgroundColor: `${theme.colors.primary}14`, borderColor: `${theme.colors.primary}33` }]}
                          accessibilityLiveRegion="polite"
                        >
                          <Text style={[styles.ayudaTitulo, { color: theme.colors.foreground }]}>{item.ayudaGrupo.titulo}</Text>
                          {item.ayudaGrupo.lineas.map((linea) => (
                            <View key={linea} style={styles.ayudaLinea}>
                              <View style={[styles.ayudaPunto, { backgroundColor: theme.colors.primary }]} />
                              <Text style={[styles.ayudaTexto, { color: theme.colors.foreground }]}>{linea}</Text>
                            </View>
                          ))}
                        </View>
                      </Colapsable>
                    ) : null}
                  </>
                ) : null}
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    cerrar();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.destacada ? `${item.label}, favorito` : item.label}
                  accessibilityState={{ selected: activa }}
                  style={[
                    styles.option,
                    { borderBottomColor: theme.colors.border },
                    // Las destacadas: fondo suave del color primario y una barra a la izquierda, sin la línea de abajo.
                    item.destacada && [
                      styles.optionDestacada,
                      { backgroundColor: `${theme.colors.primary}14`, borderLeftColor: theme.colors.primary },
                    ],
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, { color: theme.colors.foreground }, item.destacada && styles.optionLabelDestacada]}>
                      {item.label}
                    </Text>
                    {item.description ? (
                      <Text style={[styles.optionDesc, { color: theme.colors.mutedForeground }]}>{item.description}</Text>
                    ) : null}
                  </View>
                  {activa && <Check size={18} color={theme.colors.primary} />}
                </Pressable>
              </View>
            );
          }}
        />
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "500", marginBottom: 6 },
  filaCampo: { flexDirection: "row", alignItems: "center", gap: 8 },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    gap: 8,
  },
  fieldText: { fontSize: 14, flex: 1 },
  error: { fontSize: 12, marginTop: 6 },
  sheet: { maxHeight: "70%", borderWidth: 1, paddingHorizontal: 24, paddingTop: 16 },
  sheetConBuscador: { height: "75%", maxHeight: "75%" },
  buscador: { marginBottom: 4 },
  cantidad: { fontSize: 12, marginTop: 8, marginBottom: 4 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sheetTitle: { fontSize: 17, fontWeight: "600" },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  option: { flexDirection: "row", alignItems: "center", minHeight: 52, paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  grupoFila: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 2 },
  botonAyuda: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  ayuda: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 6, marginBottom: 6, gap: 6 },
  ayudaTitulo: { fontSize: 13, fontWeight: "700" },
  ayudaLinea: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  ayudaPunto: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  ayudaTexto: { flex: 1, fontSize: 13, lineHeight: 19 },
  grupo: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  optionDestacada: { borderRadius: 12, borderLeftWidth: 3, borderBottomWidth: 0, paddingHorizontal: 12, marginVertical: 4 },
  optionLabel: { fontSize: 15 },
  optionLabelDestacada: { fontWeight: "600" },
  optionDesc: { fontSize: 12, marginTop: 2 },
});
