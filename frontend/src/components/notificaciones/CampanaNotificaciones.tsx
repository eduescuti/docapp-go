import { useCallback, useState } from "react";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";

import type { Notificacion } from "@/domain";
import { listNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from "@/services";
import { useTheme } from "@/theme";
import { conservarSiIgual } from "@/utils/ui";
import { BotonIcono } from "../base/BotonIcono";
import { NotificacionesSheet } from "./NotificacionesSheet";

interface CampanaNotificacionesProps {
  destinoDe?: (n: Notificacion) => Href | undefined;
  verTodas?: Href;
}

/** Campana del Inicio con las notificaciones sin leer, y el panel que abre. Las recarga cada vez que la pantalla vuelve a la vista. */
export function CampanaNotificaciones({ destinoDe, verTodas }: CampanaNotificacionesProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);

  const recargar = useCallback(async () => {
    const lista = await listNotificaciones();
    setNotificaciones((anterior) => conservarSiIgual(anterior, lista));
  }, []);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  const ir = (destino: Href) => {
    setAbierto(false);
    router.push(destino);
  };

  const abrir = async (n: Notificacion) => {
    if (!n.leida) {
      await marcarNotificacionLeida(n.id);
      recargar();
    }
    const destino = destinoDe?.(n);
    if (destino) ir(destino);
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <>
      <BotonIcono
        icono={Bell}
        colorIcono={theme.colors.foreground}
        contador={noLeidas}
        accessibilityLabel={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
        onPress={() => setAbierto(true)}
      />
      <NotificacionesSheet
        visible={abierto}
        notificaciones={notificaciones}
        onClose={() => setAbierto(false)}
        onPressNotificacion={abrir}
        onMarcarTodas={async () => {
          await marcarTodasLeidas();
          recargar();
        }}
        onVerTodas={verTodas ? () => ir(verTodas) : undefined}
      />
    </>
  );
}
