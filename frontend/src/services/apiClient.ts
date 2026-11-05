import { borrarToken, tokenActual } from "./sesion/tokenSesion";

/**
 * Dirección del backend, de `.env` (EXPO_PUBLIC_API_URL). En el celular con Expo Go no sirve `localhost`: va la
 * IP de la computadora en la red (`http://192.168.x.x:3000`).
 */
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const ESPERA_MAXIMA_MS = 15000;

/** Error de la API con su status HTTP. El mensaje es el `{ error }` del backend, listo para mostrar. */
export class ErrorApi extends Error {
  constructor(
    public readonly status: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

interface OpcionesPedido {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  conSesion?: boolean;
}

let avisarSesionRechazada: (() => void) | null = null;

/** Lo que pasa cuando el backend dice que la sesión ya no vale (401): lo registra `AuthProvider`. */
export function alVencerSesion(accion: (() => void) | null): void {
  avisarSesionRechazada = accion;
}

/**
 * Se usa en "api()" y "apiArchivo()"
 * 
 * Hace el pedido HTTP (fetch) y espera la respuesta del BACKEND.
 * Si la sesión venció, borra el token y llama a `avisarSesionRechazada()`.
 * @param ruta La ruta de la API, p. ej. `/api/auth/login`.
 * @param opciones Método, cuerpo y si manda el token.
 * @param acepta Qué tipo de respuesta espera: `application/json` o `/` (para archivos).
*/
async function pedir(ruta: string, { metodo = "GET", cuerpo, conSesion = true }: OpcionesPedido, acepta: string): Promise<Response> {

  if (!API_URL) {
    throw new ErrorApi(0, "Falta configurar EXPO_PUBLIC_API_URL en el archivo .env de la app.");
  };

  const token = conSesion ? tokenActual() : null;
  const headers: Record<string, string> = { Accept: acepta };
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const control = new AbortController();
  const espera = setTimeout(() => control.abort(), ESPERA_MAXIMA_MS);
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: control.signal,
    });
  } catch {
    throw new ErrorApi(0, "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.");
  } finally {
    clearTimeout(espera);
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      await borrarToken();
      avisarSesionRechazada?.();
    }
    const datos: unknown = await respuesta.json().catch(() => null);
    const mensaje =
      typeof datos === "object" && datos !== null && "error" in datos && typeof datos.error === "string"
        ? datos.error
        : "Ocurrió un error. Probá de nuevo en un rato.";
    throw new ErrorApi(respuesta.status, mensaje);
  }
  return respuesta;
}

/** MAIN: es el "fetch" de nuestros REQUEST (devuelve el JSON con la consulta). */
export async function api<T>(ruta: string, opciones: OpcionesPedido = {}): Promise<T> {

  const respuesta = await pedir(ruta, opciones, "application/json");

  if (respuesta.status === 204) return undefined as T;

  // Intentamos leer el JSON de la respuesta.
  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  // Le decimos a TypeScript que `datos` tiene la forma T.
  return datos as T;
}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** base64 → string binario (un carácter por byte), sin depender de `atob`. */
function binarioDeBase64(base64: string): string {
  const limpio = base64.replace(/[^A-Za-z0-9+/]/g, "");
  let salida = "";
  for (let i = 0; i < limpio.length; i += 4) {
    const n = [0, 1, 2, 3].map((k) => BASE64.indexOf(limpio[i + k] ?? "A"));
    const bits = (n[0] << 18) | (n[1] << 12) | (n[2] << 6) | n[3];
    salida += String.fromCharCode((bits >> 16) & 255);
    if (limpio[i + 2] !== undefined) salida += String.fromCharCode((bits >> 8) & 255);
    if (limpio[i + 3] !== undefined) salida += String.fromCharCode(bits & 255);
  }
  return salida;
}

/** Bytes → string binario, de a pedazos para no pasar el límite de argumentos de `fromCharCode`. */
function binarioDeBytes(bytes: Uint8Array): string {
  let salida = "";
  for (let i = 0; i < bytes.length; i += 8192) salida += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return salida;
}

/**
 * Un archivo (p. ej. el PDF de un resultado) como string binario, un carácter por byte: lo que espera el visor de
 * PDF. Usa `arrayBuffer()` y, si el entorno no lo tiene, lee el archivo como base64.
 */
export async function apiArchivo(ruta: string): Promise<string> {
  const respuesta = await pedir(ruta, {}, "*/*");
  if (typeof respuesta.arrayBuffer === "function") {
    try {
      return binarioDeBytes(new Uint8Array(await respuesta.arrayBuffer()));
    } catch {
      // Sigue con la lectura como base64.
    }
  }
  const archivo = await respuesta.blob();
  const dataUrl = await new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(new ErrorApi(0, "No se pudo leer el archivo."));
    lector.readAsDataURL(archivo);
  });
  return binarioDeBase64(dataUrl.slice(dataUrl.indexOf(",") + 1));
}

/**
 * Completa la url solo para lo de las fotos (porque tenían una forma aleatoria de crearse)
 */
export function urlDeLaApi(ruta: string | undefined): string | undefined {
  return ruta && `${API_URL}${ruta}`;
}