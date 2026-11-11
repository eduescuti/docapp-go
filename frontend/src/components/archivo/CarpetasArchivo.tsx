import { ReactElement } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ChevronRight, Folder } from "lucide-react-native";

import type { NavegacionArchivo } from "@/hooks/useCarpetasArchivo";
import { useTheme } from "@/theme";
import { Card } from "../base/Card";
import { Text } from "../base/Text";

/** Cómo se cuenta lo que hay en una carpeta: `["receta", "recetas"]`. */
type Unidad = [singular: string, plural: string];

interface TarjetaCarpetaProps {
  titulo: string;
  cantidad: number;
  unidad: Unidad;
  onPress: () => void;
}

export function TarjetaCarpeta({ titulo, cantidad, unidad: [singular, plural], onPress }: TarjetaCarpetaProps) {
  const { theme } = useTheme();
  const contenido = `${cantidad} ${cantidad === 1 ? singular : plural}`;
  return (
    <Card style={styles.tarjeta} onPress={onPress} accessibilityLabel={`Carpeta ${titulo}, ${contenido}`}>
      <View style={styles.fila}>
        <View style={[styles.icono, { backgroundColor: theme.colors.accent }]}>
          <Folder size={18} color={theme.colors.accentForeground} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.titulo, { color: theme.colors.foreground }]}>{titulo}</Text>
          <Text style={[styles.contenido, { color: theme.colors.mutedForeground }]}>{contenido}</Text>
        </View>
        <ChevronRight size={18} color={theme.colors.mutedForeground} />
      </View>
    </Card>
  );
}

interface CarpetasArchivoProps<T> {
  navegacion: NavegacionArchivo<T>;
  unidad: Unidad;
  vacio: ReactElement;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement | null;
}

/** Lo archivado en carpetas: la lista de años, los meses del año abierto o lo que hay en el mes abierto. */
export function CarpetasArchivo<T>({ navegacion, unidad, vacio, keyExtractor, renderItem }: CarpetasArchivoProps<T>) {
  const { archivo, carpetaAnio, carpetaMes, abrirAnio, abrirMes } = navegacion;

  if (archivo.length === 0) return vacio;
  if (!carpetaAnio) {
    return (
      <FlatList
        data={archivo}
        keyExtractor={(a) => a.anio}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => <TarjetaCarpeta titulo={item.anio} cantidad={item.cantidad} unidad={unidad} onPress={() => abrirAnio(item.anio)} />}
      />
    );
  }
  if (!carpetaMes) {
    return (
      <FlatList
        data={carpetaAnio.meses}
        keyExtractor={(m) => m.clave}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <TarjetaCarpeta titulo={item.nombre} cantidad={item.items.length} unidad={unidad} onPress={() => abrirMes(item.clave)} />
        )}
      />
    );
  }
  return (
    <FlatList
      data={carpetaMes.items}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.lista}
      renderItem={({ item }) => renderItem(item)}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  lista: { paddingBottom: 32 },
  tarjeta: { marginBottom: 12 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  icono: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  titulo: { fontSize: 15, fontWeight: "600" },
  contenido: { fontSize: 12, marginTop: 2 },
});
