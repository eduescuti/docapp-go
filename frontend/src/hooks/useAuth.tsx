import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DatosCuentaMedico, DatosRegistroPaciente, Rol, Sesion } from "@/domain";
import {
  alVencerSesion,
  cerrarSesion,
  hayTokenGuardado,
  iniciarSesion,
  olvidarSesion,
  registrarMedico,
  registrarPaciente,
  restaurarSesion,
} from "@/services";
import { borrarContrasenaGuardada, estaBiometriaHabilitada } from "@/services/biometria";
import { reiniciarPistaCarrusel } from "@/utils/pistaCarrusel";

export type { Rol };

interface AuthState {
  /** false mientras la app revisa si quedó una sesión guardada (al abrirse). */
  listo: boolean;
  isAuthenticated: boolean;
  sesion: Sesion | null;
  rol: Rol | null;
  login: (dni: string, password: string) => Promise<Sesion>;
  /** Después de la huella: retoma la sesión guardada en el teléfono. */
  loginBiometrico: () => Promise<Sesion>;
  registrarPaciente: (datos: DatosRegistroPaciente) => Promise<Sesion>;
  registrarMedico: (datos: DatosCuentaMedico) => Promise<Sesion>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [listo, setListo] = useState(false);

  // Al abrir la app: si quedó un token guardado y no hay huella activada, la sesión sigue iniciada (como en
  // cualquier app). Con huella, la pide la pantalla de login antes de usar el token.
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        await borrarContrasenaGuardada();
        if ((await hayTokenGuardado()) && !(await estaBiometriaHabilitada())) {
          const restaurada = await restaurarSesion();
          if (activo) setSesion(restaurada);
        }
      } catch {
        // Venció o no hay conexión: se entra con la contraseña.
      } finally {
        if (activo) setListo(true);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  // Si el backend dice que la sesión ya no vale (venció, se cambió la contraseña en otro teléfono), vuelve al login.
  useEffect(() => {
    alVencerSesion(() => {
      olvidarSesion();
      setSesion(null);
    });
    return () => alVencerSesion(null);
  }, []);

  const login = useCallback(async (dni: string, password: string) => {
    const nueva = await iniciarSesion(dni, password);
    setSesion(nueva);
    return nueva;
  }, []);

  const loginBiometrico = useCallback(async () => {
    const nueva = await restaurarSesion();
    setSesion(nueva);
    return nueva;
  }, []);

  const registrarPacienteYEntrar = useCallback(async (datos: DatosRegistroPaciente) => {
    const nueva = await registrarPaciente(datos);
    setSesion(nueva);
    return nueva;
  }, []);

  const registrarMedicoYEntrar = useCallback(async (datos: DatosCuentaMedico) => {
    const nueva = await registrarMedico(datos);
    setSesion(nueva);
    return nueva;
  }, []);

  const logout = useCallback(() => {
    // El pedido al backend sale con el token antes de que se borre; la pantalla no lo espera.
    void cerrarSesion();
    reiniciarPistaCarrusel();
    setSesion(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      listo,
      isAuthenticated: sesion !== null,
      sesion,
      rol: sesion?.rol ?? null,
      login,
      loginBiometrico,
      registrarPaciente: registrarPacienteYEntrar,
      registrarMedico: registrarMedicoYEntrar,
      logout,
    }),
    [listo, sesion, login, loginBiometrico, registrarPacienteYEntrar, registrarMedicoYEntrar, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
