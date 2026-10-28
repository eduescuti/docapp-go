import { Especialidad } from "@/domain";

import { api } from "./apiClient";

// Catálogo que casi no cambia: se pide una vez por apertura de la app.
let catalogo: Promise<Especialidad[]> | null = null;

export async function listEspecialidades(): Promise<Especialidad[]> {
  catalogo ??= api<Especialidad[]>("/api/especialidades", { conSesion: false }).catch((e: unknown) => {
    catalogo = null;
    throw e;
  });
  return catalogo;
}

export async function getEspecialidad(id: string): Promise<Especialidad | undefined> {
  return (await listEspecialidades()).find((e) => e.id === id);
}
