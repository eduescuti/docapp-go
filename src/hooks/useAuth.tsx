import React, { createContext, useContext, useMemo, useState } from "react";

export type Rol = "paciente" | "doctor" | "admin";

interface AuthState {
  isAuthenticated: boolean;
  rol: Rol | null;
  login: (rol: Rol) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Autenticación mock (CLAUDE.md §11 pendiente de backend real): solo
 * distingue el rol activo para poder navegar por los tres modos de la app.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [rol, setRol] = useState<Rol | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: rol !== null,
      rol,
      login: (nuevoRol: Rol) => setRol(nuevoRol),
      logout: () => setRol(null),
    }),
    [rol],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
