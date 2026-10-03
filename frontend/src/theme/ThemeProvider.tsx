import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

import { Theme, ThemeId, themes } from "./tokens";

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Minimalista (A) es el modo claro y Premium (C) el modo oscuro (CLAUDE.md §7):
 * el tema activo sigue siempre el modo del sistema, sin selector manual. Cálido
 * (B) queda definido en tokens.ts pero fuera de uso hasta que se decida reactivarlo.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const themeId: ThemeId = systemScheme === "dark" ? "C" : "A";

  const value = useMemo<ThemeContextValue>(() => ({ theme: themes[themeId], themeId }), [themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
