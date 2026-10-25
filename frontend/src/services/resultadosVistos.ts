import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Aviso de "resultado nuevo" en Estudios › Resultados. No es un estado del resultado (en la base los resultados
 * no tienen estado): es un aviso solo del frontend, que se va cuando el paciente abre ese resultado. Se guarda
 * en el teléfono, por paciente, para que no vuelva a aparecer al cerrar la app.
 */
const clave = (pacienteId: string) => `@docapp:resultados_vistos:${pacienteId}`;

// Copia en memoria: las pantallas lo consultan cada vez que vuelven a la vista.
const cache = new Map<string, string[]>();

export async function listResultadosVistos(pacienteId: string): Promise<string[]> {
  const enMemoria = cache.get(pacienteId);
  if (enMemoria) return enMemoria;
  try {
    const guardado = await AsyncStorage.getItem(clave(pacienteId));
    const ids: unknown = guardado ? JSON.parse(guardado) : [];
    const vistos = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
    cache.set(pacienteId, vistos);
    return vistos;
  } catch {
    return [];
  }
}

export async function marcarResultadoVisto(pacienteId: string, estudioId: string): Promise<void> {
  const vistos = await listResultadosVistos(pacienteId);
  if (vistos.includes(estudioId)) return;
  const nuevos = [...vistos, estudioId];
  cache.set(pacienteId, nuevos);
  try {
    await AsyncStorage.setItem(clave(pacienteId), JSON.stringify(nuevos));
  } catch {
    // Si no se puede guardar, el aviso se va igual durante esta sesión (queda en memoria).
  }
}
