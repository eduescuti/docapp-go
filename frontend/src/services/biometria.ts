import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_BIOMETRIA_HABILITADA = "@docapp:biometria_habilitada";
const KEY_ULTIMO_DNI = "@docapp:ultimo_dni";
const KEY_ULTIMA_CLAVE = "@docapp:ultima_clave";
const KEY_ULTIMO_ROL = "@docapp:ultimo_rol";

export async function estaBiometriaHabilitada(): Promise<boolean> {
  try {
    const valor = await AsyncStorage.getItem(KEY_BIOMETRIA_HABILITADA);
    return valor === "true";
  } catch {
    return false;
  }
}

export async function setBiometriaHabilitada(habilitada: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_BIOMETRIA_HABILITADA, habilitada ? "true" : "false");
  } catch (e) {
    console.error("Error guardando preferencia de biometría", e);
  }
}

export async function guardarSesionBiometrica(dni: string, clave?: string, rol?: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_ULTIMO_DNI, dni);
    if (clave) {
      await AsyncStorage.setItem(KEY_ULTIMA_CLAVE, clave);
    }
    if (rol) {
      await AsyncStorage.setItem(KEY_ULTIMO_ROL, rol);
    }
  } catch (e) {
    console.error("Error guardando credenciales locales", e);
  }
}

export async function obtenerDatosSesionBiometrica(): Promise<{
  dni: string | null;
  clave: string | null;
  rol: string | null;
}> {
  try {
    const dni = await AsyncStorage.getItem(KEY_ULTIMO_DNI);
    const clave = await AsyncStorage.getItem(KEY_ULTIMA_CLAVE);
    const rol = await AsyncStorage.getItem(KEY_ULTIMO_ROL);
    return { dni, clave, rol };
  } catch {
    return { dni: null, clave: null, rol: null };
  }
}

export async function limpiarSesionBiometrica(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_BIOMETRIA_HABILITADA);
    await AsyncStorage.removeItem(KEY_ULTIMO_DNI);
    await AsyncStorage.removeItem(KEY_ULTIMA_CLAVE);
    await AsyncStorage.removeItem(KEY_ULTIMO_ROL);
  } catch (e) {
    console.error("Error limpiando credenciales biométricas", e);
  }
}