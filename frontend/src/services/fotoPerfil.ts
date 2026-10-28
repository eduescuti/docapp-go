import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { api } from "./apiClient";
import { actualizarFotoPacienteActual } from "./pacienteService";

/**
 * Foto de perfil del paciente y del profesional (decidido el 27/10/2026). La del profesional la ven todos los
 * pacientes; la del paciente, él y los profesionales que lo tienen asignado por un turno. Sin foto se ven las
 * iniciales.
 */
export type OrigenFoto = "camara" | "galeria";

/** Lado de la foto que se sube: alcanza para el avatar más grande de la app y pesa ~50-150 KB. */
const LADO_FOTO = 512;

/**
 * Abre la cámara o la galería y deja la foto lista para subir: cuadrada, de 512×512 como máximo, en JPEG. Al
 * volver a codificarla pierde los metadatos (EXIF), como la ubicación GPS donde se sacó. Devuelve la imagen en
 * base64, o `null` si la persona canceló.
 */
export async function elegirFotoPerfil(origen: OrigenFoto): Promise<string | null> {
  if (origen === "camara") {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      throw new Error("Para sacar una foto, permití el acceso a la cámara en la configuración del teléfono.");
    }
  }
  // La galería no pide permiso: Android e iOS abren su propio selector y la app recibe solo la foto elegida.
  const opciones: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    shape: "oval",
    quality: 1,
    exif: false,
  };
  const resultado =
    origen === "camara" ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
  const foto = resultado.canceled ? undefined : resultado.assets[0];
  if (!foto) return null;

  // En web el selector no recorta: se recorta acá, centrada, en todas las plataformas.
  const lado = Math.min(foto.width, foto.height);
  const final = Math.min(lado, LADO_FOTO);
  let contexto = ImageManipulator.manipulate(foto.uri);
  if (foto.width !== foto.height) {
    contexto = contexto.crop({
      originX: Math.floor((foto.width - lado) / 2),
      originY: Math.floor((foto.height - lado) / 2),
      width: lado,
      height: lado,
    });
  }
  const imagen = await contexto.resize({ width: final, height: final }).renderAsync();
  const { base64 } = await imagen.saveAsync({ base64: true, compress: 0.8, format: SaveFormat.JPEG });
  if (!base64) throw new Error("No pudimos preparar la foto. Probá con otra.");
  return base64;
}

/** Sube la foto (reemplaza la anterior) y devuelve su URL. `PUT /api/usuarios/yo/foto`. */
export async function guardarFotoPerfil(imagenBase64: string): Promise<string> {
  const { avatarUrl } = await api<{ avatarUrl: string }>("/api/usuarios/yo/foto", {
    metodo: "PUT",
    cuerpo: { imagen: imagenBase64 },
  });
  actualizarFotoPacienteActual(avatarUrl);
  return avatarUrl;
}

/** Quita la foto: vuelven a verse las iniciales. `DELETE /api/usuarios/yo/foto`. */
export async function quitarFotoPerfil(): Promise<void> {
  await api<void>("/api/usuarios/yo/foto", { metodo: "DELETE" });
  actualizarFotoPacienteActual(undefined);
}
