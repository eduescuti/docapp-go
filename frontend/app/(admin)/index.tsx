import { ShieldCheck } from "lucide-react-native";

import { RolePlaceholder } from "@/components";

export default function AdminHomeScreen() {
  return (
    <RolePlaceholder
      icon={ShieldCheck}
      titulo="Modo Administrador"
      descripcion="El panel de administración general se construye sobre esta misma base de navegación y diseño."
      funcionalidades={[
        "ABM de instituciones, sedes y laboratorios",
        "ABM de médicos, especialidades y horarios",
        "Gestión de pacientes y planes médicos",
        "Administración de turnos y disponibilidad",
        "Moderación de feedback y tipos de estudio",
      ]}
    />
  );
}
