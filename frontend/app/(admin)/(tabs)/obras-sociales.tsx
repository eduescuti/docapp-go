import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { CreditCard } from "lucide-react-native";

import { Card, IconBadge, PrimaryButton, ScreenContainer, SectionHeader, Text, TextField } from "@/components";
import { ObraSocialConPlanes, PLAN_GENERAL } from "@/domain";
import { crearPlanMedico, listObrasSociales } from "@/services";
import { nombrePlan } from "@/utils/cobertura";
import { useTheme } from "@/theme";

/**
 * ABM (alta y listado) de obras sociales / prepagas y sus planes. Una obra social sin planes conocidos arranca
 * con el plan "General".
 */
export default function AdminObrasSocialesScreen() {
  const { theme } = useTheme();
  const [obrasSociales, setObrasSociales] = useState<ObraSocialConPlanes[]>([]);
  const [obraSocial, setObraSocial] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    listObrasSociales().then(setObrasSociales);
  }, []);

  useFocusEffect(cargar);

  const handleAgregar = async () => {
    setError(null);
    setExito(null);
    setGuardando(true);
    try {
      const plan = await crearPlanMedico({ obraSocial, plan: nombre });
      setObraSocial("");
      setNombre("");
      setExito(`Se agregó "${nombrePlan(plan)}".`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar.");
    } finally {
      setGuardando(false);
    }
  };

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
            value={obraSocial}
            onChangeText={setObraSocial}
            placeholder="Ej. IOMA"
            hint="Si ya existe, el plan se agrega a esa obra social."
          />
          <TextField
            label="Plan (opcional)"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Plan Integral"
            hint={`Si lo dejás vacío, la obra social nueva queda con un único plan "${PLAN_GENERAL}".`}
          />
          {error ? <Text style={[styles.msg, { color: theme.colors.danger }]}>{error}</Text> : null}
          {exito ? <Text style={[styles.msg, { color: theme.colors.success }]}>{exito}</Text> : null}
          <PrimaryButton
            label="Agregar"
            onPress={handleAgregar}
            disabled={!obraSocial.trim()}
            loading={guardando}
          />
        </Card>

        <SectionHeader title={`Cargadas (${obrasSociales.length})`} />
        {obrasSociales.map((os) => (
          <Card key={os.id} style={styles.item}>
            <View style={styles.row}>
              <IconBadge icon={CreditCard} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{os.nombre}</Text>
                {os.descripcion ? (
                  <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{os.descripcion}</Text>
                ) : null}
                <Text style={[styles.meta, { color: theme.colors.foreground }]}>
                  {os.planes.length === 1 && os.planes[0].nombre === PLAN_GENERAL
                    ? "Plan único"
                    : `${os.planes.length} planes: ${os.planes.map((p) => p.nombre).join(" · ")}`}
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
