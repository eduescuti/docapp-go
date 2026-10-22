import { useLocalSearchParams, useRouter } from "expo-router";

import { BackHeader, ReservaTurno, ScreenContainer } from "@/components";

/** Reservar con un profesional ya elegido (desde su perfil): el mismo flujo de Turnos → Reservar. */
export default function ReservarScreen() {
  const { medicoId } = useLocalSearchParams<{ medicoId: string }>();
  const router = useRouter();

  return (
    <ScreenContainer>
      <BackHeader titulo="Reservar turno" />
      <ReservaTurno medicoIdInicial={medicoId} onReservado={() =>
          // "ver" cambia en cada reserva para que Turnos abra la pestaña Próximos aunque ya estuviera montada.
          router.dismissTo({ pathname: "/turnos", params: { ver: `proximos-${Date.now()}` } })
        } />
    </ScreenContainer>
  );
}
