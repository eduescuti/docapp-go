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

/** Arma los headers del pedido: tipo de respuesta, tipo de cuerpo y token. */
function armarHeaders(acepta: string, hayCuerpo: boolean, token: string | null): Record<string, string> {
  const headers: Record<string, string> = { Accept: acepta };
  if (hayCuerpo) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Hace el fetch y lo corta si tarda más de ESPERA_MAXIMA_MS. */
async function fetchConTiempoLimite(url: string, init: RequestInit): Promise<Response> {

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ESPERA_MAXIMA_MS);

  try {
    return await fetch(url, { ...init, signal: control.signal });
  } catch {
    // Sin red, servidor caído o timeout: al usuario le damos el mismo mensaje.
    throw new ErrorApi(0, "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.");
  } finally {
    clearTimeout(temporizador); // siempre se limpia, haya salido bien o mal
  }
}

/** Saca el mensaje de error que mandó el backend ({ error: "..." }). */
async function leerMensajeDeError(respuesta: Response): Promise<string> {
  const MENSAJE_POR_DEFECTO = "Ocurrió un error. Probá de nuevo en un rato.";
  const datos: unknown = await respuesta.json().catch(() => null); // si no es JSON, null
  if (typeof datos === "object" && datos !== null && "error" in datos && typeof datos.error === "string") {
    return datos.error;
  }
  return MENSAJE_POR_DEFECTO;
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
  }

  const token = conSesion ? tokenActual() : null;

  const respuesta = await fetchConTiempoLimite(`${API_URL}${ruta}`, {
    method: metodo,
    headers: armarHeaders(acepta, cuerpo !== undefined, token),
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

  if (respuesta.ok) return respuesta;

  // 401 con token = la sesión venció o fue rechazada: se limpia y se avisa a la app.
  if (respuesta.status === 401 && token) {
    await borrarToken();
    avisarSesionRechazada?.();
  }
  throw new ErrorApi(respuesta.status, await leerMensajeDeError(respuesta));
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