import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_BIOMETRIA_HABILITADA = "@docapp:biometria_habilitada";
const KEY_ULTIMO_DNI = "@docapp:ultimo_dni";
const KEY_ULTIMO_ROL = "@docapp:ultimo_rol";

/** Versiones anteriores de la app guardaban la contraseña para la huella: se borra al abrir la app. */
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
export async function guardarSesionBiometrica(dni: string, rol?: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_ULTIMO_DNI, dni);
    if (rol) {
      await AsyncStorage.setItem(KEY_ULTIMO_ROL, rol);
    }
  } catch (e) {
    console.error("Error guardando credenciales locales", e);
  }
}

export async function obtenerDatosSesionBiometrica(): Promise<{ dni: string | null; rol: string | null }> {
  try {
    const dni = await AsyncStorage.getItem(KEY_ULTIMO_DNI);
    const rol = await AsyncStorage.getItem(KEY_ULTIMO_ROL);
    return { dni, rol };
  } catch {
    return { dni: null, rol: null };
  }
}

export async function limpiarSesionBiometrica(): Promise<void> {
  try {
    // La preferencia queda en "false" (no se borra) para que se sepa que se apagó a propósito.
    await AsyncStorage.setItem(KEY_BIOMETRIA_HABILITADA, "false");
    await AsyncStorage.removeItem(KEY_ULTIMO_DNI);
    // Versiones anteriores guardaban acá la contraseña: se borra si quedó.
    await AsyncStorage.removeItem("@docapp:ultima_clave");
    await AsyncStorage.removeItem(KEY_ULTIMO_ROL);
  } catch (e) {
    console.error("Error limpiando credenciales biométricas", e);
  }
}