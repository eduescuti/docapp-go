import { borrarToken, tokenActual } from "./tokenSesion";

/**
 * Simula la latencia de una API real. La usan los services que todavía leen mocks; desaparece cuando todos
 * estén conectados al backend (CLAUDE.md §4).
 */
export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Dirección del backend, de `.env` (EXPO_PUBLIC_API_URL). En el celular con Expo Go no sirve `localhost`: va la
 * IP de la computadora en la red (`http://192.168.x.x:3000`).
 */
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
/** Si el servidor no contesta en este tiempo, se avisa en vez de quedarse esperando. */
const ESPERA_MAXIMA_MS = 15000;

/**
 * URL completa de algo que la API devuelve como ruta relativa, como las fotos de perfil (`/api/fotos/...`): el
 * backend no sabe con qué dirección lo ve el teléfono. Las URL que ya son completas quedan igual.
 */
export function urlDeLaApi(ruta: string | undefined): string | undefined {
  if (!ruta) return undefined;
  return ruta.startsWith("/") ? `${API_URL}${ruta}` : ruta;
}

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

let alVencer: (() => void) | null = null;

/** Lo que pasa cuando el backend dice que la sesión ya no vale (401): lo registra `AuthProvider`. */
export function alVencerSesion(accion: (() => void) | null): void {
  alVencer = accion;
}

interface OpcionesPedido {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  /** false en login y registro: no manda el token. */
  conSesion?: boolean;
}

/**
 * El único lugar que habla con el backend: arma la URL, manda el token (`Authorization: Bearer`) y convierte
 * los errores en `ErrorApi` con el mensaje del servidor. Si la sesión venció, borra el token y avisa.
 */
async function pedir(ruta: string, { metodo = "GET", cuerpo, conSesion = true }: OpcionesPedido, acepta: string): Promise<Response> {
  if (!API_URL) throw new ErrorApi(0, "Falta configurar EXPO_PUBLIC_API_URL en el archivo .env de la app.");
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
      alVencer?.();
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

/** Un pedido que devuelve JSON (o nada, con `204`). */
export async function api<T>(ruta: string, opciones: OpcionesPedido = {}): Promise<T> {
  const respuesta = await pedir(ruta, opciones, "application/json");
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json().catch(() => null)) as T;
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
