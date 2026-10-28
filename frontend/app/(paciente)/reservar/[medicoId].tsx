import { useLocalSearchParams, useRouter } from "expo-router";

import { BackHeader, ReservaTurno, ScreenContainer } from "@/components";

/**
 * Reservar con un profesional ya elegido (desde su perfil): el mismo flujo de Turnos → Reservar. Con
 * `reprogramar=<turnoId>` es el botón "Reprogramar" del detalle de un turno: mismo profesional, otra fecha.
 */
export default function ReservarScreen() {
  const { medicoId, reprogramar } = useLocalSearchParams<{ medicoId: string; reprogramar?: string }>();
  const router = useRouter();

  return (
    <ScreenContainer>
      <BackHeader
        titulo={reprogramar ? "Reprogramar turno" : "Reservar turno"}
        subtitulo={reprogramar ? "Elegí otra fecha y horario con el mismo profesional" : undefined}
      />
      <ReservaTurno
        medicoIdInicial={medicoId}
        turnoAReprogramarId={reprogramar}
        onReservado={() =>
          // "ver" cambia en cada reserva para que Turnos abra la pestaña Próximos aunque ya estuviera montada.
          router.dismissTo({ pathname: "/turnos", params: { ver: `${reprogramar ? "reprogramado" : "proximos"}-${Date.now()}` } })
        }
      />
    </ScreenContainer>
  );
}
