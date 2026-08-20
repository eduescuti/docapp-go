export type ThemeId = "A" | "B" | "C";

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  accentForeground: string;
  success: string;
  successForeground: string;
  danger: string;
}

export interface ThemeRadii {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
  radii: ThemeRadii;
  fonts: ThemeFonts;
  shadow: ThemeShadow;
}

/** Tema A — Minimalista clínico (claro, sobrio, institucional). CLAUDE.md §7. */
const themeA: Theme = {
  id: "A",
  name: "Minimalista clínico",
  isDark: false,
  colors: {
    background: "#FFFFFF",
    foreground: "#0F172A",
    card: "#FFFFFF",
    cardForeground: "#0F172A",
    primary: "#0284C7",
    primaryForeground: "#FFFFFF",
    muted: "#F1F5F9",
    mutedForeground: "#64748B",
    border: "#E2E8F0",
    accent: "#E0F2FE",
    accentForeground: "#0284C7",
    success: "#22C55E",
    successForeground: "#FFFFFF",
    danger: "#EF4444",
  },
  radii: { sm: 2, md: 4, lg: 8, full: 9999 },
  fonts: { heading: "Inter_600SemiBold", body: "Inter_400Regular" },
  shadow: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
};

/** Tema B — Cálido y humano (claro, cercano, redondeado). CLAUDE.md §7. */
const themeB: Theme = {
  id: "B",
  name: "Cálido y humano",
  isDark: false,
  colors: {
    background: "#FFFDFA",
    foreground: "#43302B",
    card: "#FFFFFF",
    cardForeground: "#43302B",
    primary: "#F97316",
    primaryForeground: "#FFFFFF",
    muted: "#FFEDD5",
    mutedForeground: "#9A3412",
    border: "#FED7AA",
    accent: "#FFEDD5",
    accentForeground: "#EA580C",
    success: "#10B981",
    successForeground: "#FFFFFF",
    danger: "#DC2626",
  },
  radii: { sm: 8, md: 16, lg: 24, full: 9999 },
  fonts: { heading: "Nunito_700Bold", body: "Nunito_400Regular" },
  shadow: {
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
};

/** Tema C — Moderno premium (oscuro — es el modo oscuro de la app). CLAUDE.md §7. */
const themeC: Theme = {
  id: "C",
  name: "Moderno premium",
  isDark: true,
  colors: {
    background: "#020617",
    foreground: "#F8FAFC",
    card: "#0F172A",
    cardForeground: "#F8FAFC",
    primary: "#10B981",
    primaryForeground: "#020617",
    muted: "#1E293B",
    mutedForeground: "#94A3B8",
    border: "#334155",
    accent: "#10B981",
    accentForeground: "#020617",
    success: "#10B981",
    successForeground: "#020617",
    danger: "#F87171",
  },
  radii: { sm: 8, md: 12, lg: 16, full: 9999 },
  fonts: { heading: "PlayfairDisplay_600SemiBold", body: "PlusJakartaSans_400Regular" },
  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 8,
  },
};

export const themes: Record<ThemeId, Theme> = {
  A: themeA,
  B: themeB,
  C: themeC,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
