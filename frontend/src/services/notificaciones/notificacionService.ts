import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Notificacion } from "@/domain";
import { api } from "../apiClient";

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
 * Pide permiso de notificaciones, obtiene el token FCM del dispositivo y hace un POST para asociarlo a la sesión.
 * Devuelve el token, o `null` si no se pudo registrar (en web no se registra).
 */
export async function registrarPushToken(): Promise<string | null> {

  // Lo que investigamos: en web no sirve. Si corre en navegador web, saltea el registro nativo de FCM
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

/** Hace un GET de las notificaciones del usuario de la sesión, de la más nueva a la más vieja. */
export async function listNotificacionesPaciente(): Promise<Notificacion[]> {
  return api<Notificacion[]>("/api/notificaciones");
}

/** Hace un PATCH que marca una notificación como leída. */
export async function marcarNotificacionLeida(notificacionId: string): Promise<void> {
  await api<void>(`/api/notificaciones/${encodeURIComponent(notificacionId)}`, {
    metodo: "PATCH",
    cuerpo: { leida: true },
  });
}

/** Hace un PATCH que marca como leídas todas las notificaciones del usuario de la sesión. */
export async function marcarTodasLeidas(): Promise<void> {
  await api<void>("/api/notificaciones", {
    metodo: "PATCH",
    cuerpo: { leida: true },
  });
}