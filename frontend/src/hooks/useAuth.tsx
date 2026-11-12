import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DatosCuentaMedico, DatosRegistroPaciente, Rol, Sesion } from "@/domain";
import {
  alVencerSesion,
  cerrarSesion,
  ErrorApi,
  hayTokenGuardado,
  iniciarSesion,
  olvidarSesion,
  registrarMedico,
  registrarPaciente,
  restaurarSesion,
} from "@/services";
import { borrarContrasenaGuardada, estaBiometriaHabilitada } from "@/services/sesion/biometria";
import { registrarPushToken } from "@/services/notificaciones/notificacionService";
import { reiniciarPistaCarrusel } from "@/utils/ui";

export type { Rol };

interface AuthState {
  listo: boolean;
  avisoInicio: string | null;
  isAuthenticated: boolean;
  sesion: Sesion | null;
  rol: Rol | null;
  login: (dni: string, password: string) => Promise<Sesion>;
  loginBiometrico: () => Promise<Sesion>;
  registrarPacienteYEntrar: (datos: DatosRegistroPaciente) => Promise<Sesion>;
  registrarMedicoYEntrar: (datos: DatosCuentaMedico) => Promise<Sesion>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [listo, setListo] = useState(false);
  const [avisoInicio, setAvisoInicio] = useState<string | null>(null);

  // Al abrir la app: si quedó un token guardado y no hay huella activada, la sesión sigue iniciada.
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        await borrarContrasenaGuardada();
        if ((await hayTokenGuardado()) && !(await estaBiometriaHabilitada())) {
          const restaurada = await restaurarSesion();
          if (activo) {
            setSesion(restaurada);
            void registrarPushToken();
          }
        }
      } catch (e) {
        // Con 401 la sesión venció y el login se ve sin aviso; con otro error, el login dice por qué.
        const vencida = e instanceof ErrorApi && e.status === 401;
        if (!vencida && activo) {
          setAvisoInicio(e instanceof Error ? e.message : "No pudimos recuperar tu sesión.");
        };
      } finally {
        if (activo) setListo(true);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    alVencerSesion(() => {
      olvidarSesion();
      setSesion(null);
    });
    return () => alVencerSesion(null);
  }, []);

  useEffect(() => {
    if (sesion) setAvisoInicio(null);
  }, [sesion]);

  const login = useCallback(async (dni: string, password: string) => {
    const nueva = await iniciarSesion(dni, password);
    setSesion(nueva);
    void registrarPushToken();
    return nueva;
  }, []);

  const loginBiometrico = useCallback(async () => {
    const nueva = await restaurarSesion();
    setSesion(nueva);
    void registrarPushToken();
    return nueva;
  }, []);

  const registrarPacienteYEntrar = useCallback(async (datos: DatosRegistroPaciente) => {
    const nueva = await registrarPaciente(datos);
    setSesion(nueva);
    void registrarPushToken();
    return nueva;
  }, []);

  const registrarMedicoYEntrar = useCallback(async (datos: DatosCuentaMedico) => {
    const nueva = await registrarMedico(datos);
    setSesion(nueva);
    void registrarPushToken();
    return nueva;
  }, []);

  const logout = useCallback(() => {
    void cerrarSesion();
    reiniciarPistaCarrusel();
    setSesion(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      listo,
      avisoInicio,
      isAuthenticated: sesion !== null,
      sesion,
      rol: sesion?.rol ?? null,
      login,
      loginBiometrico,
      registrarPacienteYEntrar,
      registrarMedicoYEntrar,
      logout,
    }),
    [listo, avisoInicio, sesion, login, loginBiometrico, registrarPacienteYEntrar, registrarMedicoYEntrar, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}