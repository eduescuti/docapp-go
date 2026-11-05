export type ThemeId = "A" | "C";

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  accentForeground: string;
  /**
   * Fondo suave de lo elegido o destacado, con texto común encima (`foreground`, `mutedForeground`, `primary`).
   * No es `accent`: en el modo oscuro `accent` es verde lleno y encima solo va `accentForeground`.
   */
  highlight: string;
  success: string;
  danger: string;
  /** Texto sobre `danger` (botones de confirmación destructiva). */
  dangerForeground: string;
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

/**
 * Colores del mapa (MapLibre): el fondo se repinta con estos tonos para que combine con el tema,
 * y cada tipo de institución tiene su color de marcador.
 */
export interface ThemeMapa {
  /** Estilo base de OpenFreeMap que se repinta encima. */
  estiloBase: "positron" | "dark";
  tierra: string;
  manzana: string;
  edificio: string;
  agua: string;
  parque: string;
  calle: string;
  avenida: string;
  borde: string;
  texto: string;
  textoHalo: string;
  ubicacion: string;
  marcadorBorde: string;
  hospital: string;
  clinica: string;
  centroMedico: string;
  laboratorio: string;
}

/** Un color por gráfico (Métricas del admin), para distinguir un gráfico de otro. */
export type ThemeGraficos = [string, string, string];

export interface Theme {
  id: ThemeId;
  isDark: boolean;
  colors: ThemeColors;
  mapa: ThemeMapa;
  graficos: ThemeGraficos;
  radii: ThemeRadii;
  fonts: ThemeFonts;
  shadow: ThemeShadow;
}

/** Tema A — Minimalista clínico (claro, sobrio, institucional). CLAUDE.md §7. */
const themeA: Theme = {
  id: "A",
  isDark: false,
  colors: {
    background: "#FFFFFF",
    foreground: "#0F172A",
    card: "#FFFFFF",
    primary: "#0284C7",
    primaryForeground: "#FFFFFF",
    muted: "#F1F5F9",
    mutedForeground: "#64748B",
    border: "#E2E8F0",
    accent: "#E0F2FE",
    accentForeground: "#0284C7",
    highlight: "#E0F2FE",
    success: "#22C55E",
    danger: "#EF4444",
    dangerForeground: "#FFFFFF",
  },
  mapa: {
    estiloBase: "positron",
    tierra: "#F8FAFC",
    manzana: "#F1F5F9",
    edificio: "#E9EEF4",
    agua: "#CFE6F5",
    parque: "#DDF0E3",
    calle: "#FFFFFF",
    avenida: "#FFFFFF",
    borde: "#DCE3EC",
    texto: "#64748B",
    textoHalo: "#FFFFFF",
    ubicacion: "#0284C7",
    marcadorBorde: "#FFFFFF",
    hospital: "#DC2626",
    clinica: "#0284C7",
    centroMedico: "#0D9488",
    laboratorio: "#9333EA",
  },
  graficos: ["#0284C7", "#0D9488", "#D97706"],
  radii: { sm: 8, md: 12, lg: 16, full: 9999 },
  fonts: { heading: "Inter_600SemiBold", body: "Inter_400Regular" },
  shadow: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
};

/** Tema C — Moderno premium (oscuro — es el modo oscuro de la app). CLAUDE.md §7. */
const themeC: Theme = {
  id: "C",
  isDark: true,
  colors: {
    background: "#020617",
    foreground: "#F8FAFC",
    card: "#0F172A",
    primary: "#10B981",
    primaryForeground: "#020617",
    muted: "#1E293B",
    mutedForeground: "#94A3B8",
    border: "#334155",
    accent: "#10B981",
    accentForeground: "#020617",
    highlight: "#022C22",
    success: "#10B981",
    danger: "#F87171",
    dangerForeground: "#020617",
  },
  mapa: {
    estiloBase: "dark",
    tierra: "#020617",
    manzana: "#0B1222",
    edificio: "#111A2E",
    agua: "#0C2236",
    parque: "#0B2A22",
    calle: "#1E293B",
    avenida: "#334155",
    borde: "#0F172A",
    texto: "#94A3B8",
    textoHalo: "#020617",
    ubicacion: "#38BDF8",
    marcadorBorde: "#020617",
    hospital: "#F87171",
    clinica: "#38BDF8",
    centroMedico: "#10B981",
    laboratorio: "#C084FC",
  },
  graficos: ["#38BDF8", "#10B981", "#FBBF24"],
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
  C: themeC,
};
