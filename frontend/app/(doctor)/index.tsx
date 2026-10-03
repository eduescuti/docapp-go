import { Stethoscope } from "lucide-react-native";

import { RolePlaceholder } from "@/components";

export default function DoctorHomeScreen() {
  return (
    <RolePlaceholder
      icon={Stethoscope}
      titulo="Modo Médico"
      descripcion="La agenda y el panel del profesional se construyen sobre esta misma base de navegación y diseño."
      funcionalidades={[
        "Agenda y próximos turnos",
        "Gestión de disponibilidad horaria",
        "Generación de órdenes de laboratorio",
        "Emisión de recetas",
        "Registro de indicaciones y perfil profesional",
      ]}
    />
  );
}
