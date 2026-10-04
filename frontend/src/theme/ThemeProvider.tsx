import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { Theme, ThemeId, themes } from "./tokens";

/** Preferencia de apariencia elegida en Configuración. "sistema" sigue el modo del teléfono. */
export type PreferenciaTema = "sistema" | "claro" | "oscuro";

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  preferencia: PreferenciaTema;
  setPreferencia: (preferencia: PreferenciaTema) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Minimalista (A) es el modo claro y Premium (C) el modo oscuro (CLAUDE.md §7).
 * Por defecto sigue el modo del sistema; desde Configuración se puede forzar claro u
 * oscuro (en memoria: se pierde al cerrar la app). Cálido (B) queda definido en
 * tokens.ts pero fuera de uso.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preferencia, setPreferencia] = useState<PreferenciaTema>("sistema");

  const oscuro = preferencia === "sistema" ? systemScheme === "dark" : preferencia === "oscuro";
  const themeId: ThemeId = oscuro ? "C" : "A";

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
