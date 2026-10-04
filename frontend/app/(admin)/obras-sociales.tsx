import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { CreditCard } from "lucide-react-native";

import { Card, IconBadge, PrimaryButton, ScreenContainer, SectionHeader, Text, TextField } from "@/components";
import { PlanMedico } from "@/domain";
import { crearPlanMedico, listPlanesMedicos } from "@/services";
import { useTheme } from "@/theme";

/** ABM (alta y listado) de obras sociales / prepagas y sus planes. */
export default function AdminObrasSocialesScreen() {
  const { theme } = useTheme();
  const [planes, setPlanes] = useState<PlanMedico[]>([]);
  const [aseguradora, setAseguradora] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    listPlanesMedicos().then(setPlanes);
  }, []);

  useFocusEffect(cargar);

  const handleAgregar = async () => {
    setError(null);
    setExito(null);
    setGuardando(true);
    try {
      const plan = await crearPlanMedico({ aseguradora, nombre });
      setAseguradora("");
      setNombre("");
      setExito(`Se agregó "${plan.nombre}".`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar.");
    } finally {
      setGuardando(false);
    }
  };

  const porAseguradora = planes.reduce<Record<string, PlanMedico[]>>((acc, p) => {
    (acc[p.aseguradora] ??= []).push(p);
    return acc;
  }, {});

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenContainer>
        <Text variant="heading" style={[styles.title, { color: theme.colors.foreground }]}>Obras sociales</Text>

        <Card style={{ marginBottom: 28 }}>
          <Text variant="heading" style={[styles.cardTitle, { color: theme.colors.foreground }]}>
            Nueva obra social o plan
          </Text>
          <TextField
            label="Obra social / prepaga"
            value={aseguradora}
            onChangeText={setAseguradora}
            placeholder="Ej. IOMA"
            hint="Si ya existe, el plan se agrega a esa obra social."
          />
          <TextField label="Nombre del plan" value={nombre} onChangeText={setNombre} placeholder="Ej. IOMA Plan Integral" />
          {error ? <Text style={[styles.msg, { color: theme.colors.danger }]}>{error}</Text> : null}
          {exito ? <Text style={[styles.msg, { color: theme.colors.success }]}>{exito}</Text> : null}
          <PrimaryButton
            label="Agregar"
            onPress={handleAgregar}
            disabled={!aseguradora.trim() || !nombre.trim()}
            loading={guardando}
          />
        </Card>

        <SectionHeader title={`Cargadas (${Object.keys(porAseguradora).length})`} />
        {Object.entries(porAseguradora).map(([nombreAseguradora, lista]) => (
          <Card key={nombreAseguradora} style={styles.item}>
            <View style={styles.row}>
              <IconBadge icon={CreditCard} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{nombreAseguradora}</Text>
                <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                  {lista.map((p) => p.nombre).join(" · ")}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  msg: { fontSize: 13, marginBottom: 12 },
  item: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
});
