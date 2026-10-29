// src/services/notificacionService.ts (Frontend)
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Notificacion } from "@/domain";
import { api } from "./apiClient";

// Cómo mostrar la notificación si la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Pide permiso al usuario, obtiene el token FCM del dispositivo 
 * y se lo envía al backend para asociarlo al usuario logueado.
 */
export async function registrarPushToken(): Promise<string | null> {
  // 👈 AGREGAR ESTA LÍNEA: Si corre en navegador web, saltea el registro nativo de FCM
  if (Platform.OS === "web") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0284c7",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Permiso de notificaciones denegado.");
    return null;
  }

  try {
    // Al correr en Development Build, devuelve el token FCM real de Google
    const token = (await Notifications.getDevicePushTokenAsync()).data;

    // Se registra en el backend bajo las rutas de notificaciones
    await api<void>("/api/notificaciones/fcm-token", {
      metodo: "POST",
      cuerpo: { token },
    });

    return token;
  } catch (error) {
    console.error("Error al registrar token FCM:", error);
    return null;
  }
}

/** Las del paciente de la sesión, de la más nueva a la más vieja. */
export async function listNotificacionesPaciente(_pacienteId: string): Promise<Notificacion[]> {
  return api<Notificacion[]>("/api/notificaciones");
}

export async function marcarNotificacionLeida(notificacionId: string): Promise<void> {
  await api<void>(`/api/notificaciones/${encodeURIComponent(notificacionId)}`, {
    metodo: "PATCH",
    cuerpo: { leida: true },
  });
}

export async function marcarTodasLeidas(_pacienteId: string): Promise<void> {
  await api<void>("/api/notificaciones", {
    metodo: "PATCH",
    cuerpo: { leida: true },
  });
}