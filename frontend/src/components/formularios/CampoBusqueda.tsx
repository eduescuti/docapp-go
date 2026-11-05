import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";

import { useTheme } from "@/theme";

interface CampoBusquedaProps {
  valor: string;
  onChange: (texto: string) => void;
  placeholder: string;
  accessibilityLabel: string;
}

/** Campo de búsqueda con lupa y botón para borrar lo escrito. */
export function CampoBusqueda({ valor, onChange, placeholder, accessibilityLabel }: CampoBusquedaProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.contenedor, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
      <Search size={18} color={theme.colors.mutedForeground} />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        accessibilityLabel={accessibilityLabel}
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.campo, { color: theme.colors.foreground }]}
      />
      {valor.length > 0 ? (
        <Pressable onPress={() => onChange("")} accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={10}>
          <X size={18} color={theme.colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingHorizontal: 14 },
  campo: { flex: 1, minHeight: 46, fontSize: 14 },
});
