import React, { createContext, useContext, useMemo, useState } from "react";

import { Theme, ThemeId, themes } from "./tokens";

/** Apariencia elegida en Configuración. No sigue el modo del teléfono: por defecto es "claro". */
export type PreferenciaTema = "claro" | "oscuro";

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  preferencia: PreferenciaTema;
  setPreferencia: (preferencia: PreferenciaTema) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Minimalista (A) es el modo claro y Premium (C) el modo oscuro (CLAUDE.md §7).
 * La app arranca siempre en modo claro, aunque el teléfono esté en modo oscuro; el modo oscuro
 * se elige en Configuración (en memoria: se pierde al cerrar la app). Cálido (B) queda definido
 * en tokens.ts pero fuera de uso.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>("claro");
  const themeId: ThemeId = preferencia === "oscuro" ? "C" : "A";

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[themeId], themeId, preferencia, setPreferencia }),
    [themeId, preferencia],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
