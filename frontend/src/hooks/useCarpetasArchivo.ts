import { useEffect, useState } from "react";

import type { CarpetaAnio, CarpetaMes } from "@/services";

export interface NavegacionArchivo<T> {
  archivo: CarpetaAnio<T>[];
  carpetaAnio?: CarpetaAnio<T>;
  carpetaMes?: CarpetaMes<T>;
  abrirAnio: (anio: string) => void;
  abrirMes: (clave: string) => void;
  subir: () => boolean;
  ruta: string;
}

/** Dónde está parado el paciente dentro de Archivados (año → mes). Si la carpeta abierta se vacía, sube sola. */
export function useCarpetasArchivo<T>(archivo: CarpetaAnio<T>[]): NavegacionArchivo<T> {
  const [anio, setAnio] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);

  const carpetaAnio = archivo.find((a) => a.anio === anio);
  const carpetaMes = carpetaAnio?.meses.find((m) => m.clave === mes);

  useEffect(() => {
    if (anio && !carpetaAnio) {
      setAnio(null);
      setMes(null);
    } else if (mes && !carpetaMes) {
      setMes(null);
    }
  }, [anio, mes, carpetaAnio, carpetaMes]);

  const subir = () => {
    if (mes) setMes(null);
    else if (anio) setAnio(null);
    else return false;
    return true;
  };

  return {
    archivo,
    carpetaAnio,
    carpetaMes,
    abrirAnio: setAnio,
    abrirMes: setMes,
    subir,
    ruta: [carpetaAnio?.anio, carpetaMes?.nombre].filter(Boolean).join(" › "),
  };
}
