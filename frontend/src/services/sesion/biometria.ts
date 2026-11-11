import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_BIOMETRIA_HABILITADA = "@docapp:biometria_habilitada";
const KEY_ULTIMO_DNI = "@docapp:ultimo_dni";

/** Se borra la contraseña al abrir la app (esto es por lo de la huella). */
export async function borrarContrasenaGuardada(): Promise<void> {
  try {
    await AsyncStorage.removeItem("@docapp:ultima_clave");
  } catch {
    // Nada que borrar.
  }
}

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

/**
 * Activa el ingreso con huella sin que el usuario lo pida (la pantalla Seguridad ya no tiene
 * interruptor). Con `forzar` lo activa siempre; si no, solo cuando nunca se eligió, para respetar
 * la preferencia de quien lo apagó a mano (hoy, desde el perfil del profesional).
 */
export async function habilitarBiometriaAutomatica(forzar: boolean): Promise<void> {
  try {
    if (forzar || (await AsyncStorage.getItem(KEY_BIOMETRIA_HABILITADA)) === null) {
      await AsyncStorage.setItem(KEY_BIOMETRIA_HABILITADA, "true");
    }
  } catch (e) {
    console.error("Error activando la huella automática", e);
  }
}

/**
 * Recuerda el DNI de la última cuenta que entró en este teléfono (para el ingreso con huella). La contraseña no
 * se guarda nunca: la huella desbloquea el token de sesión, que vive cifrado en `tokenSesion.ts`.
 */
export async function guardarSesionBiometrica(dni: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_ULTIMO_DNI, dni);
  } catch (e) {
    console.error("Error guardando credenciales locales", e);
  }
}

/** El DNI de la última cuenta que entró en este teléfono, o `null` si no hay. */
export async function obtenerDniBiometrico(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_ULTIMO_DNI);
  } catch {
    return null;
  }
}

export async function limpiarSesionBiometrica(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_BIOMETRIA_HABILITADA, "false");
    await AsyncStorage.removeItem(KEY_ULTIMO_DNI);
    await AsyncStorage.removeItem("@docapp:ultima_clave");
  } catch (e) {
    console.error("Error limpiando credenciales biométricas", e);
  }
}