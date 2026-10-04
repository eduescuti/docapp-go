import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Rol, Sesion } from "@/domain";
import { cerrarSesion, iniciarSesion } from "@/services";

export type { Rol };

interface AuthState {
  isAuthenticated: boolean;
  sesion: Sesion | null;
  rol: Rol | null;
  /** Valida DNI + contraseña contra el backend (hoy, el mock de `authService`). Lanza error si no coinciden. */
  login: (dni: string, password: string) => Promise<Sesion>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Sesión de la app. El rol ya no se elige a mano: lo determina la cuenta con la
 * que se inicia sesión. Sin persistencia todavía (CLAUDE.md §11 pendiente).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  const login = useCallback(async (dni: string, password: string) => {
    const nueva = await iniciarSesion(dni, password);
    setSesion(nueva);
    return nueva;
  }, []);

  const logout = useCallback(() => {
    cerrarSesion();
    setSesion(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ isAuthenticated: sesion !== null, sesion, rol: sesion?.rol ?? null, login, logout }),
    [sesion, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
