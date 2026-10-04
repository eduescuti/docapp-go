import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { Text } from "./Text";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectFieldProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
}

/** Selector de una opción: campo que abre un bottom sheet con la lista (equivalente RN de un `<select>`). */
export function SelectField({ label, placeholder = "Seleccionar", options, value, onChange, error }: SelectFieldProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  const seleccionada = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>{label}</Text>
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
        <Text
          style={[styles.fieldText, { color: seleccionada ? theme.colors.foreground : theme.colors.mutedForeground }]}
          numberOfLines={1}
        >
          {seleccionada?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={theme.colors.mutedForeground} />
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setAbierto(false)}
          accessibilityRole="button"
          accessibilityLabel="Cerrar selector"
        />
        <View
          style={[
            styles.sheet,
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
              onPress={() => setAbierto(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={8}
              style={styles.closeBtn}
            >
              <X size={20} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => {
              const activa = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setAbierto(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: activa }}
                  style={[styles.option, { borderBottomColor: theme.colors.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, { color: theme.colors.foreground }]}>{item.label}</Text>
                    {item.description ? (
                      <Text style={[styles.optionDesc, { color: theme.colors.mutedForeground }]}>{item.description}</Text>
                    ) : null}
                  </View>
                  {activa && <Check size={18} color={theme.colors.primary} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "500", marginBottom: 6 },
  field: {
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { maxHeight: "70%", borderWidth: 1, paddingHorizontal: 24, paddingTop: 16 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sheetTitle: { fontSize: 17, fontWeight: "600" },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  option: { flexDirection: "row", alignItems: "center", minHeight: 52, paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  optionLabel: { fontSize: 15 },
  optionDesc: { fontSize: 12, marginTop: 2 },
});
