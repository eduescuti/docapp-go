import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Rol, Sesion } from "@/domain";
import { cerrarSesion, iniciarSesion, iniciarSesionBiometrica } from "@/services";
import { reiniciarPistaCarrusel } from "@/utils/pistaCarrusel";

export type { Rol };

interface AuthState {
  isAuthenticated: boolean;
  sesion: Sesion | null;
  rol: Rol | null;
  login: (dni: string, password: string) => Promise<Sesion>;
  loginBiometrico: (dni: string) => Promise<Sesion>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  const login = useCallback(async (dni: string, password: string) => {
    const nueva = await iniciarSesion(dni, password);
    setSesion(nueva);
    return nueva;
  }, []);

  const loginBiometrico = useCallback(async (dni: string) => {
    const nueva = await iniciarSesionBiometrica(dni);
    setSesion(nueva);
    return nueva;
  }, []);

  const logout = useCallback(() => {
    cerrarSesion();
    reiniciarPistaCarrusel();
    setSesion(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: sesion !== null,
      sesion,
      rol: sesion?.rol ?? null,
      login,
      loginBiometrico,
      logout,
    }),
    [sesion, login, loginBiometrico, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}