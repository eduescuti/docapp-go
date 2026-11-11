import { useCallback, useEffect, useState } from "react";

export type TipoAviso = "exito" | "error";

export interface Aviso {
  texto: string;
  tipo: TipoAviso;
}

const DURACION_MS = 3500;

/** Aviso que se va solo a los 3,5 s. Se dibuja con `<AvisoTemporal aviso={aviso} />`. */
export function useAviso() {
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), DURACION_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  const mostrarAviso = useCallback((texto: string, tipo: TipoAviso = "exito") => setAviso({ texto, tipo }), []);

  return { aviso, mostrarAviso };
}
