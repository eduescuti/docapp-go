import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * El token de sesión que devuelve el backend. En el celular queda cifrado por el sistema operativo
 * (`expo-secure-store`: Keychain en iOS, Keystore en Android) para que la sesión siga iniciada al volver a abrir
 * la app. En web no existe: ahí vive solo en memoria y al recargar se pide login (decidido el 27/10/2026).
 * Nunca se guarda la contraseña.
 */
const CLAVE = "docapp.token";
const GUARDA_EN_TELEFONO = Platform.OS !== "web";

let token: string | null = null;

/** El token en memoria, para cada pedido (sincrónico). */
export function tokenActual(): string | null {
  return token;
}

/** Al abrir la app: trae a memoria el token guardado en el teléfono, si hay. */
export async function cargarTokenGuardado(): Promise<string | null> {
  if (!token && GUARDA_EN_TELEFONO) {
    try {
      token = await SecureStore.getItemAsync(CLAVE);
    } catch {
      token = null;
    }
  }
  return token;
}

export async function guardarToken(nuevo: string): Promise<void> {
  token = nuevo;
  if (GUARDA_EN_TELEFONO) await SecureStore.setItemAsync(CLAVE, nuevo);
}

export async function borrarToken(): Promise<void> {
  token = null;
  if (GUARDA_EN_TELEFONO) {
    try {
      await SecureStore.deleteItemAsync(CLAVE);
    } catch {
      // Si no estaba guardado no hay nada que borrar.
    }
  }
}
