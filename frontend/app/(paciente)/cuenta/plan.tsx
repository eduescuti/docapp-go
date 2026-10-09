import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Building2, FlaskConical, Hospital, Stethoscope } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import {
  BackHeader,
  Card,
  CredencialPlan,
  IconBadge,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  StatCard,
  Text,
} from "@/components";
import { Institucion, Paciente, PlanMedico, TipoInstitucion } from "@/domain";
import { getPacienteActual, getPlanMedico, listInstituciones, searchMedicos } from "@/services";
import { useTheme } from "@/theme";

const ICONO_TIPO: Record<TipoInstitucion, LucideIcon> = {
  hospital: Hospital,
  clinica: Building2,
  centro_medico: Stethoscope,
  laboratorio: FlaskConical,
};

/** Cuántas instituciones se listan acá; el resto se ve en el mapa. */
const LIMITE_LISTA = 20;

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

      <CredencialPlan
        plan={plan}
        afiliado={paciente ? `${paciente.nombre} ${paciente.apellido}` : ""}
        dni={paciente?.dni ?? ""}
        style={styles.credencial}
      />

      <View style={styles.stats}>
        <StatCard icon={Hospital} valor={instituciones.length} etiqueta="Instituciones que te cubren" />
        <StatCard icon={Stethoscope} valor={cantidadMedicos} etiqueta="Profesionales disponibles" />
      </View>

      <SectionHeader title="Dónde te atienden" actionLabel="Ver mapa" onActionPress={() => router.push("/mapa")} />
      {instituciones.slice(0, LIMITE_LISTA).map((inst) => (
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
      {instituciones.length > LIMITE_LISTA ? (
        <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
          Y {instituciones.length - LIMITE_LISTA} más: miralas todas en el mapa.
        </Text>
      ) : null}

      <View style={{ marginTop: 16 }}>
        <PrimaryButton label="Cambiar de obra social" variant="outline" onPress={() => router.push("/cuenta/perfil")} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  credencial: { marginBottom: 20 },
  stats: { flexDirection: "row", gap: 10, marginBottom: 28 },
  item: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitulo: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
});
