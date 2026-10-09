import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";

export interface Coordenada {
  latitud: number;
  longitud: number;
}

export type EstadoUbicacion = "cargando" | "concedida" | "denegada" | "error";

/** Si no hay permiso, el mapa arranca en el Obelisco (centro de CABA). */
export const CENTRO_CABA: Coordenada = { latitud: -34.6037, longitud: -58.3816 };

interface OpcionesUbicacion {
  /**
   * true: pide el permiso si todavía no se dio (pantalla del mapa).
   * false: usa la ubicación solo si el permiso ya estaba dado (Inicio), sin mostrar el aviso del sistema.
   */
  pedirPermiso: boolean;
}

/**
 * GPS del dispositivo con `expo-location` (componente nativo, consigna 1.4). Devuelve la ubicación
 * real si hay permiso; si no, `coordenada` es null y quien lo usa decide el centro por defecto.
 */
export function useUbicacion({ pedirPermiso }: OpcionesUbicacion) {
  const [estado, setEstado] = useState<EstadoUbicacion>("cargando");
  const [coordenada, setCoordenada] = useState<Coordenada | null>(null);

  const actualizar = useCallback(async () => {
    setEstado("cargando");
    let tieneUbicacion = false;
    try {
      const permiso = pedirPermiso
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (permiso.status !== "granted") {
        setEstado("denegada");
        return;
      }
      // La última posición conocida es instantánea; después se pide la actual, más precisa.
      const ultima = await Location.getLastKnownPositionAsync();
      if (ultima) {
        tieneUbicacion = true;
        setCoordenada({ latitud: ultima.coords.latitude, longitud: ultima.coords.longitude });
        setEstado("concedida");
      }
      const actual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordenada({ latitud: actual.coords.latitude, longitud: actual.coords.longitude });
      setEstado("concedida");
    } catch {
      // GPS apagado o sin señal: si ya había una posición conocida, se sigue usando.
      if (!tieneUbicacion) setEstado("error");
    }
  }, [pedirPermiso]);

  useEffect(() => {
    actualizar();
  }, [actualizar]);

  return { estado, coordenada, actualizar };
}
