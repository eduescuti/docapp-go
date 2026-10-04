import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Stethoscope, User } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { BackHeader, Card, FormLayout, IconBadge, Text } from "@/components";
import { useTheme } from "@/theme";

interface Opcion {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  ruta: "/(auth)/registro-paciente" | "/(auth)/registro-medico";
}

const OPCIONES: Opcion[] = [
  {
    icon: User,
    titulo: "Soy paciente",
    descripcion: "Buscá profesionales según tu obra social y gestioná tus turnos.",
    ruta: "/(auth)/registro-paciente",
  },
  {
    icon: Stethoscope,
    titulo: "Soy profesional de la salud",
    descripcion: "Verificamos tu matrícula en el padrón nacional antes de crear la cuenta.",
    ruta: "/(auth)/registro-medico",
  },
];

export default function RegistroScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <FormLayout header={<BackHeader titulo="Crear cuenta" subtitulo="¿Cómo vas a usar DocApp Go?" />}>
      <View style={{ gap: 16 }}>
        {OPCIONES.map((op) => (
          <Card key={op.ruta} onPress={() => router.push(op.ruta)} accessibilityLabel={op.titulo}>
            <View style={styles.row}>
              <IconBadge icon={op.icon} size={48} />
              <View style={{ flex: 1 }}>
                <Text variant="heading" style={[styles.titulo, { color: theme.colors.foreground }]}>
                  {op.titulo}
                </Text>
                <Text style={[styles.desc, { color: theme.colors.mutedForeground }]}>{op.descripcion}</Text>
              </View>
              <ChevronRight size={18} color={theme.colors.mutedForeground} />
            </View>
          </Card>
        ))}
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  titulo: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  desc: { fontSize: 13 },
});
