import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Building2, FlaskConical, Hospital, ShieldCheck, Stethoscope } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { BackHeader, Card, IconBadge, PrimaryButton, ScreenContainer, SectionHeader, StatCard, Text } from "@/components";
import { Institucion, Paciente, PlanMedico, TipoInstitucion } from "@/domain";
import { getPacienteActual, getPlanMedico, listInstituciones, searchMedicos } from "@/services";
import { useTheme } from "@/theme";

const ICONO_TIPO: Record<TipoInstitucion, LucideIcon> = {
  hospital: Hospital,
  clinica: Building2,
  centro_medico: Stethoscope,
  laboratorio: FlaskConical,
};

/** Mi plan médico: credencial y qué cubre (instituciones y profesionales que aceptan el plan). */
export default function PlanScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [plan, setPlan] = useState<PlanMedico | undefined>();
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [cantidadMedicos, setCantidadMedicos] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await getPacienteActual();
        const [pl, inst, medicos] = await Promise.all([
          getPlanMedico(p.planMedicoId),
          listInstituciones({ planMedicoId: p.planMedicoId }),
          searchMedicos({ planMedicoId: p.planMedicoId }),
        ]);
        setPaciente(p);
        setPlan(pl);
        setInstituciones(inst);
        setCantidadMedicos(medicos.length);
      })();
    }, []),
  );

  return (
    <ScreenContainer>
      <BackHeader titulo="Mi plan médico" />

      <View
        style={[styles.credencial, { backgroundColor: theme.colors.primary, borderRadius: theme.radii.lg * 1.5 }]}
        accessible
        accessibilityLabel={`Credencial: ${plan?.nombre ?? ""}, DNI ${paciente?.dni ?? ""}`}
      >
        <View style={styles.credHeader}>
          <Text style={[styles.credAseguradora, { color: theme.colors.primaryForeground }]}>{plan?.aseguradora ?? "—"}</Text>
          <ShieldCheck size={24} color={theme.colors.primaryForeground} />
        </View>
        <Text variant="heading" style={[styles.credPlan, { color: theme.colors.primaryForeground }]}>{plan?.nombre ?? "Cargando..."}</Text>
        <View style={styles.credFooter}>
          <View>
            <Text style={[styles.credLabel, { color: theme.colors.primaryForeground }]}>Afiliado/a</Text>
            <Text style={[styles.credValor, { color: theme.colors.primaryForeground }]}>
              {paciente ? `${paciente.nombre} ${paciente.apellido}` : ""}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.credLabel, { color: theme.colors.primaryForeground }]}>DNI</Text>
            <Text style={[styles.credValor, { color: theme.colors.primaryForeground }]}>{paciente?.dni}</Text>
          </View>
        </View>
      </View>

      <View style={styles.stats}>
        <StatCard icon={Hospital} valor={instituciones.length} etiqueta="Instituciones que te cubren" />
        <StatCard icon={Stethoscope} valor={cantidadMedicos} etiqueta="Profesionales disponibles" />
      </View>

      <SectionHeader title="Dónde te atienden" actionLabel="Ver mapa" onActionPress={() => router.push("/mapa")} />
      {instituciones.map((inst) => (
        <Card key={inst.id} style={styles.item}>
          <View style={styles.row}>
            <IconBadge icon={ICONO_TIPO[inst.tipo]} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitulo, { color: theme.colors.foreground }]}>{inst.nombre}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                {inst.sedes[0] ? `${inst.sedes[0].direccion}, ${inst.sedes[0].ciudad}` : ""}
              </Text>
            </View>
          </View>
        </Card>
      ))}

      <View style={{ marginTop: 16 }}>
        <PrimaryButton label="Cambiar de obra social" variant="outline" onPress={() => router.push("/cuenta/perfil")} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  credencial: { padding: 20, marginBottom: 20, gap: 8 },
  credHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  credAseguradora: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, opacity: 0.9 },
  credPlan: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  credFooter: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  credLabel: { fontSize: 11, opacity: 0.8 },
  credValor: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  stats: { flexDirection: "row", gap: 10, marginBottom: 28 },
  item: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
});
