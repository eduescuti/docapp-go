import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Token de sesión del backend, guardado cifrado en el celular (`expo-secure-store`) para seguir logueado al reabrir la app.
 * En web vive solo en memoria y al recargar se pide login. Nunca se guarda la contraseña.
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
