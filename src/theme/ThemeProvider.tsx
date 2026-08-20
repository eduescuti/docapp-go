import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { Theme, ThemeId, themes } from "./tokens";

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Tema C es el modo oscuro de la app (CLAUDE.md §7): si el sistema pide modo
 * oscuro y el usuario no eligió tema manualmente, arrancamos en C.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeId] = useState<ThemeId>(systemScheme === "dark" ? "C" : "A");

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[themeId], themeId, setThemeId }),
    [themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
