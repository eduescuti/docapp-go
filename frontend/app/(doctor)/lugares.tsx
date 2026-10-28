import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { MapPin, Plus, X } from "lucide-react-native";

import { BackHeader, CampoBusqueda, Card, PrimaryButton, ScreenContainer, SectionHeader, Text } from "@/components";
import { buscarLugares, getMedicoActual, guardarMisLugares, LugarDeAtencion, listLugaresDeAtencion } from "@/services";
import { useTheme } from "@/theme";
import { dejarAviso } from "@/utils/avisoAlVolver";

/**
 * Lugares de atención: en qué hospitales o centros atiende el profesional (los elige él, decidido el 27/10/2026).
 * Sin lugares no puede cargar horarios. Se abre desde su Perfil.
 */
export default function DoctorLugaresScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [lugares, setLugares] = useState<LugarDeAtencion[]>([]);
  const [sinCoberturas, setSinCoberturas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<LugarDeAtencion[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre arranca con lo guardado.
  useFocusEffect(
    useCallback(() => {
      setError(null);
      setBusqueda("");
      getMedicoActual()
        .then((m) => {
          setSinCoberturas(m.coberturas.length === 0);
          return listLugaresDeAtencion(m.sedesIds);
        })
        .then(setLugares)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "No se pudieron cargar tus lugares."));
    }, []),
  );

  // Busca mientras escribe (desde 2 letras), sin pedir de nuevo por cada tecla.
  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultados([]);
      return;
    }
    let activo = true;
    const espera = setTimeout(() => {
      buscarLugares(busqueda)
        .then((r) => activo && setResultados(r))
        .catch(() => activo && setResultados([]));
    }, 300);
    return () => {
      activo = false;
      clearTimeout(espera);
    };
  }, [busqueda]);

  const elegidos = new Set(lugares.map((l) => l.sede.id));
  const agregar = (lugar: LugarDeAtencion) => {
    setLugares((prev) => (prev.some((l) => l.sede.id === lugar.sede.id) ? prev : [...prev, lugar]));
    setBusqueda("");
  };
  const quitar = (sedeId: string) => setLugares((prev) => prev.filter((l) => l.sede.id !== sedeId));

  const guardar = async () => {
    setError(null);
    setGuardando(true);
    try {
      await guardarMisLugares(lugares.map((l) => l.sede.id));
      dejarAviso("Guardaste tus lugares de atención.");
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar tus lugares.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScreenContainer>
      <BackHeader titulo="Lugares de atención" subtitulo="Dónde atendés: ahí podés cargar tus horarios" />

      <SectionHeader title={`Tus lugares (${lugares.length})`} />
      {lugares.length === 0 ? (
        <Text style={[styles.vacio, { color: theme.colors.mutedForeground }]}>Todavía no elegiste ningún lugar. Buscalo abajo.</Text>
      ) : (
        lugares.map(({ sede, institucion }) => (
          <Card key={sede.id} style={styles.item}>
            <View style={styles.fila}>
              <MapPin size={16} color={theme.colors.primary} />
              <View style={styles.flex}>
                <Text style={[styles.titulo, { color: theme.colors.foreground }]}>{institucion.nombre}</Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  {sede.direccion}, {sede.ciudad}
                </Text>
              </View>
              <Pressable
                onPress={() => quitar(sede.id)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${institucion.nombre}`}
                style={styles.boton}
              >
                <X size={18} color={theme.colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <View style={{ height: 16 }} />
      <SectionHeader title="Agregar un lugar" />
      {/* El backend filtra igual: solo devuelve los públicos y los que aceptan alguna de sus coberturas. */}
      <Text style={[styles.ayuda, { color: theme.colors.mutedForeground }]}>
        {sinCoberturas
          ? "Todavía no elegiste coberturas: solo podés agregar hospitales y centros públicos. Cargá tus coberturas en tu Perfil para ver los privados."
          : "Aparecen los públicos y los privados que aceptan alguna de tus coberturas."}
      </Text>
      <CampoBusqueda
        valor={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar hospital, clínica o dirección"
        accessibilityLabel="Buscar un lugar de atención"
      />
      {busqueda.trim().length >= 2 && resultados.length === 0 ? (
        <Text style={[styles.vacio, { color: theme.colors.mutedForeground }]}>
          No encontramos lugares con ese nombre que acepten tus coberturas.
        </Text>
      ) : null}
      {resultados.map((lugar) => {
        const yaEsta = elegidos.has(lugar.sede.id);
        return (
          <Pressable
            key={lugar.sede.id}
            onPress={() => agregar(lugar)}
            disabled={yaEsta}
            accessibilityRole="button"
            accessibilityLabel={yaEsta ? `${lugar.institucion.nombre}, ya elegido` : `Agregar ${lugar.institucion.nombre}`}
            style={[styles.resultado, { borderBottomColor: theme.colors.border }]}
          >
            <View style={styles.flex}>
              <Text style={[styles.titulo, { color: theme.colors.foreground }]}>{lugar.institucion.nombre}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                {lugar.sede.direccion}, {lugar.sede.ciudad}
              </Text>
            </View>
            {yaEsta ? (
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>Elegido</Text>
            ) : (
              <Plus size={18} color={theme.colors.primary} />
            )}
          </Pressable>
        );
      })}

      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <View style={styles.pie}>
        <PrimaryButton label="Guardar lugares" onPress={guardar} loading={guardando} />
        <Text style={[styles.nota, { color: theme.colors.mutedForeground }]}>
          Si sacás un lugar, se borran tus horarios de ahí. Los turnos ya pedidos no cambian.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  vacio: { fontSize: 13, marginTop: 8, marginBottom: 8 },
  ayuda: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  item: { marginBottom: 10 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
  titulo: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  boton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -10 },
  resultado: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, borderBottomWidth: 1 },
  error: { fontSize: 13, marginTop: 16 },
  pie: { marginTop: 24, marginBottom: 32, gap: 10 },
  nota: { fontSize: 12, textAlign: "center" },
});
