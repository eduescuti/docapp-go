# 2. Fases de integración

[← Volver al plan](README.md)

Cada fase deja la app **funcionando** (CLAUDE.md §3: incremental). Al final de cada una:
`npx tsc --noEmit` sin errores y prueba en el celular con Expo Go. Los commits los hace el
alumno.

Rutas relativas a `DocApp Go/frontend/`.

---

## Fase 0 — Decisiones y preparación

**Objetivo:** cerrar las decisiones D1 a D6 de [01](01-alcance-y-decisiones.md#4-decisiones-a-confirmar-antes-de-programar)
y juntar la materia prima.

| Tarea | Detalle |
|---|---|
| 0.1 Confirmar D1–D6 | Anotar la respuesta en este documento y, si aplica, en CLAUDE.md §10 (regla de hospitales públicos) |
| 0.2 Descargar REFES | XLSX ene-2026 o CSV dic-2025, con `curl -k` (ver [doc 6](../06-como-reproducir.md)). **No se commitea** el archivo crudo: va a `scripts/.cache/` (en `.gitignore`) |
| 0.3 Relevar cartillas | Para cada cobertura, abrir su buscador público, filtrar CABA → "Sanatorios / Internación" y "Laboratorios", y anotar 10–15 prestadores con la URL y la fecha |
| 0.4 Cruzar con el REFES | Buscar cada prestador anotado en el REFES de CABA y quedarse con su `establecimiento_id`. Si no aparece, descartarlo (no se inventan coordenadas) |

**Terminado cuando:** hay una planilla `planId → [establecimiento_id, fuente, fecha]` y las
decisiones están escritas.

---

## Fase 1 — Dominio preparado para datos reales

> ✅ **Hecha el 09/10/2026.** `origen` y `sitioWeb` en `Institucion`; `telefono` opcional y
> `refesId` en `Sede`; `registro` y `codigoOficial` en `PlanMedico`; `FuenteCobertura` nuevo.
> "Llamar" en Instituciones favoritas solo aparece si la sede tiene teléfono.

**Objetivo:** que los tipos soporten el origen REFES sin romper nada de lo que ya existe.

Cambios en `src/domain/`:

```ts
// institucion.ts
export type OrigenFinanciamiento = "publico" | "privado" | "seguridad_social";

export interface Sede {
  id: string;
  institucionId: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  telefono?: string;      // el REFES no trae teléfono → pasa a opcional
  refesId?: string;       // establecimiento_id (14 dígitos). Opcional: las altas del admin no lo tienen
}

export interface Institucion {
  id: string;
  nombre: string;
  tipo: TipoInstitucion;
  origen: OrigenFinanciamiento;   // NUEVO: decide la regla D1
  logoUrl?: string;
  sitioWeb?: string;              // NUEVO: lo trae el REFES en algunos casos
  planesAceptadosIds: string[];   // solo relevante para privados
  sedes: Sede[];
}

// planMedico.ts
export interface PlanMedico {
  id: string;
  nombre: string;
  aseguradora: string;
  registro?: "RNAS" | "RNEMP" | "otro"; // NUEVO
  codigoOficial?: string;               // NUEVO: p. ej. "400800" para OSDE
}

// coberturaRelacion.ts (NUEVO)
export interface FuenteCobertura {
  planMedicoId: string;
  institucionId: string;
  fuenteUrl: string;     // cartilla consultada
  verificadoEl: string;  // yyyy-MM-dd
}
```

| Tarea | Detalle |
|---|---|
| 1.1 Tipos | Aplicar los cambios de arriba y exportar desde `src/domain/index.ts` |
| 1.2 Ajustar usos de `telefono` | `instituciones-favoritas.tsx` llama a `tel:` → ocultar el botón si no hay teléfono |
| 1.3 Mocks actuales | Agregar `origen` a cada institución mock para que compile |

**Terminado cuando:** compila y la app se ve igual que antes.

---

## Fase 2 — Foto del REFES de CABA (script)

> ✅ **Hecha el 09/10/2026** con el CSV del 15/12/2025: de 1.916 establecimientos de CABA quedan
> **1.077** (163 KB). En qué se apartó de lo planeado, por lo que mostraron los datos:
>
> - **Geriátricos fuera:** `ESCIETE` (internación de tercera edad) son 323 residencias en CABA.
>   El "453 clínicas" de la investigación las incluía por error.
> - **FFAA/Seguridad como `seguridad_social`, no `publico`:** en CABA incluye la Fragata
>   Libertad, el rompehielos Irizar y cuarteles; los hospitales militares atienden sobre todo a
>   su obra social. Así no se muestran a todos los pacientes.
> - **Hospitales privados por nombre:** con internación es `hospital` si es público **o** si el
>   nombre empieza con "Hospital" (Alemán, Británico, Italiano). El resto, `clinica` (D3).
> - **Regla 15 adelantada:** `aceptaCobertura` ya está en `institucionService` (era de la Fase 4).
>   Sin ella el mapa quedaba vacío hasta la Fase 3.
> - **Instituciones inventadas reemplazadas (D4):** Hospital Italiano → Hospital Italiano de
>   Buenos Aires; Clínica Los Arcos → Sanatorio de los Arcos (mismo nombre); Centro Médico Norte →
>   CESAC Nº 33 (centro público más cercano); Bioanálisis Sur → Diagnóstico Mediter (laboratorio
>   más cercano). Los privados quedan sin coberturas: no se inventan coberturas de lugares reales.
> - **Listas largas:** el admin muestra las primeras 30 instituciones y "Mi plan" las primeras 20.
> - **Inicio:** la tarjeta del próximo turno toma la institución de la sede del turno (antes
>   usaba la primera institución del médico y fallaba si el turno era en otra).
>
> Resultado por tipo y origen:
>
> | Tipo | Público | Privado | Seguridad social |
> |---|---|---|---|
> | Hospital | 38 | 6 | 4 |
> | Clínica / sanatorio | 0 | 113 | 15 |
> | Centro médico | 122 | 570 | 46 |
> | Laboratorio | 2 | 161 | 0 |

**Objetivo:** generar `src/mocks/data/refes-caba.json` con datos reales, reproducible con un
comando.

Archivo nuevo `scripts/importar-refes.mjs` (Node puro, sin dependencias nuevas; se corre en la
compu, nunca en el celular):

```
node scripts/importar-refes.mjs scripts/.cache/refes-2026-01.csv
```

| Paso del script | Regla |
|---|---|
| 1. Leer CSV | Separador y encoding según doc 6. Si se usa el XLSX, exportarlo a CSV antes (evita sumar una librería) |
| 2. Filtrar provincia | `provincia_id === "02"` (CABA) |
| 3. Filtrar coordenadas | Lat entre -34.71 y -34.52, lon entre -58.54 y -58.33 (caja de CABA). Fuera → descartar |
| 4. Mapear tipo | `ESCI*` sin `ESCIRES` + público → `hospital`; `ESCI*` + privado → `clinica`; `ESSIDT` con atención médica → `centro_medico` (consultorios y centros sin internación); `ESSID` laboratorio / imágenes → `laboratorio`; el resto → descartar (doc 1) |
| 5. Mapear origen | Provincial, Municipal, Nacional, Universitario público, FFAA/Seguridad → `publico`; Seguridad Social → `seguridad_social`; resto → `privado`. Penitenciarios → descartar |
| 6. Normalizar texto | Nombre en "Título" (`HOSPITAL GRAL. DE AGUDOS` → `Hospital Gral. de Agudos`), domicilio limpio, ciudad = `"CABA"` |
| 7. Sin agrupar | D5: cada establecimiento es una institución con una sede (una dirección). No se juntan sedes de una misma red |
| 8. IDs estables | `institucion.id = "refes-" + establecimiento_id`; `sede.id = "sede-" + establecimiento_id` |
| 9. Escribir JSON | Ordenado por id (diffs chicos entre versiones), con cabecera `{ fuente, version, generadoEl, licencia }` |
| 10. Reporte | Imprimir conteos por tipo/origen y descartes, para pegar en el README |

Y `src/mocks/instituciones.ts` pasa a:

```ts
import refes from "./data/refes-caba.json";
export const institucionesMock: Institucion[] = refes.instituciones as Institucion[];
// el cast se valida con una función `esInstitucion()` en dev para no usar `any` (CLAUDE.md §2)
```

| Tarea | Detalle |
|---|---|
| 2.1 Script | Implementar y documentar en `frontend/README.md` cómo correrlo |
| 2.2 `.gitignore` | Agregar `scripts/.cache/` |
| 2.3 JSON | Generado y commiteado (objetivo < 350 KB con ~1.400 sedes). `resolveJsonModule` ya viene en el tsconfig de Expo; verificar |
| 2.4 Médicos mock | Reasignar sus `sedeIds` a sedes reales de las instituciones de la Fase 3 (si no, los turnos apuntan a sedes que no existen) |
| 2.5 Turnos / favoritos mock | Mismo ajuste de ids |

**Terminado cuando:** el mapa muestra establecimientos reales de CABA (todavía sin filtro de
cobertura correcto) y todas las pantallas que muestran una sede siguen funcionando.

---

## Fase 3 — Coberturas y relación cobertura ↔ sede

**Objetivo:** que cambiar de obra social cambie el mapa.

| Tarea | Detalle |
|---|---|
| 3.1 `planesMedicos.ts` | Mantener los ids actuales y sumar `registro` y `codigoOficial` (OSDE → `RNAS 400800`) |
| 3.2 `coberturas-caba.ts` (nuevo) | Lista de `FuenteCobertura` armada en la Fase 0 (10–15 por cobertura) |
| 3.3 Derivar `planesAceptadosIds` | Al cargar, cada institución privada toma sus planes de `coberturas-caba.ts`. Las públicas quedan con `[]` (la regla D1 se aplica en el service, no en el dato) |
| 3.4 Pacientes de prueba | Asegurar que haya al menos un paciente de prueba por cobertura y uno con Medifé (sin relaciones). Documentarlos en `frontend/README.md` |

**Terminado cuando:** con cada usuario de prueba se ve un conjunto distinto de clínicas, y los
hospitales públicos aparecen en todos.

---

## Fase 4 — Services: regla de cobertura y cercanía

**Objetivo:** que ninguna pantalla tenga lógica de filtrado (CLAUDE.md §4).

`src/services/institucionService.ts`:

```ts
export interface FiltrosInstitucion {
  planMedicoId?: string;
  tipos?: TipoInstitucion[];
  cerca?: { latitud: number; longitud: number; radioKm: number };
  limite?: number;
}

export interface InstitucionConDistancia extends Institucion {
  distanciaKm?: number;        // a la sede más cercana
  sedeMasCercana?: Sede;
  motivoVisible: "publica" | "cobertura"; // para mostrarlo en la tarjeta
}

/** Regla #1 + regla D1: público ⇒ visible para todos; privado ⇒ solo si acepta el plan. */
export function aceptaCobertura(inst: Institucion, planMedicoId?: string): boolean;

export async function listInstituciones(f?: FiltrosInstitucion): Promise<InstitucionConDistancia[]>;
export async function getFuenteCobertura(institucionId: string, planMedicoId: string): Promise<FuenteCobertura | undefined>;
```

| Tarea | Detalle |
|---|---|
| 4.1 Filtro | Cobertura → tipos → radio (con `distanciaKm` de `src/utils/geo.ts`) → orden por distancia → límite |
| 4.2 Firma estable | La firma es la que después va a exponer el backend (`GET /instituciones?plan=&tipos=&lat=&lng=&radio=`). Dejarlo comentado |
| 4.3 Médicos | `searchMedicos` y la reserva deben respetar la misma regla al elegir sede (regla #1 de CLAUDE.md §10) |
| 4.4 Admin | `crearInstitucion` acepta `origen`; si es público no exige obras sociales |
| 4.5 Estadísticas | El gráfico por obra social del admin no cambia |

**Terminado cuando:** `listInstituciones({ planMedicoId, cerca })` devuelve resultados
ordenados por distancia y respeta la regla en todos los usos.

---

## Fase 5 — Mapa real (paciente)

> ✅ **Hecha el 09/10/2026, con otro motor:** Google Maps no anda en Expo Go (la clave que trae
> Expo Go está vencida), así que el mapa es **MapLibre GL JS + OpenFreeMap** en un WebView, y en
> un iframe en web ([doc 8](../08-motor-del-mapa.md)). Hecho: GPS (`useUbicacion`), filtros por
> tipo + "Más cercano", tarjeta (tipo, motivo, dirección, distancia, profesionales, "Cómo llegar",
> "Llamar" si hay teléfono), lista ↔ mapa, colores del tema (`theme.mapa`), atribuciones en Ayuda
> (D6) y, en el Inicio, una vista previa del mapa sin lista de nombres (cambio de diseño pedido el
> 09/10/2026, en lugar de la tarea 5.9). Los ~160 marcadores son una capa de MapLibre, sin tope.
> Se adelantó de la fase 4 `buscarCentros` (cobertura → tipos → radio → distancia → límite).
> **Falta probar en el celular** y decidir con el docente lo del SDK de Google.

**Objetivo:** el mapa como pieza central de la demo y uno de los **componentes nativos** de la
entrega (GPS).

| Tarea | Detalle |
|---|---|
| 5.1 Ubicación | `expo-location` (ya instalado): `requestForegroundPermissionsAsync` → `getCurrentPositionAsync({ accuracy: Balanced })`. Hook nuevo `src/hooks/useUbicacion.ts` con estados `cargando · concedida · denegada`. Si se deniega: centro en el Obelisco y aviso no bloqueante |
| 5.2 Permisos | Texto de permiso en `app.config` (`NSLocationWhenInUseUsageDescription` y equivalente Android): "Usamos tu ubicación para mostrarte los centros de salud más cercanos que aceptan tu cobertura" |
| 5.3 Marcadores | Color por tipo (hospital / clínica / laboratorio) tomado del tema, nunca color suelto. `tracksViewChanges={false}`. Solo los de la región visible (`onRegionChangeComplete`), tope 150 |
| 5.4 Chips de filtro | `Todos · Hospitales · Clínicas · Centros médicos · Laboratorios` y `Más cercano`. Mismo componente `Chip` existente |
| 5.5 Tarjeta del marcador | Nombre → tipo y "Público" / "Acepta OSDE 210" → dirección → distancia → botones **Ver turnos** y **Cómo llegar** (CLAUDE.md §9). Si hay fuente: "Según cartilla al dd/mm/aaaa" |
| 5.6 Cómo llegar | `Linking.openURL("https://www.google.com/maps/dir/?api=1&destination=lat,lng")` (abre la app de Google Maps con la ruta, gratis) |
| 5.7 Lista ↔ mapa | Botón para alternar a una `FlatList` con los mismos resultados ordenados por distancia (CLAUDE.md §9: todo resultado como lista **y** como mapa) |
| 5.8 Atribución | D6: solo en Menú → Ayuda, no en el mapa: "Establecimientos: REFES — Ministerio de Salud de la Nación (CC BY 4.0)" |
| 5.9 Home | La card "Instituciones cercanas" usa `listInstituciones({ cerca, limite: 3 })` y muestra los 3 más cercanos con su distancia |
| 5.10 Accesibilidad | `accessibilityLabel` en marcadores, chips y botones; áreas táctiles ≥ 44 px; probar en 375 px de ancho |

**Terminado cuando:** en un celular real en CABA, al abrir el mapa se ve la ubicación propia,
los centros cercanos que acepta la cobertura del paciente, y "Cómo llegar" abre Google Maps con
la ruta.

---

## Fase 6 — Georef en vivo (admin)

**Objetivo:** la única API HTTP que la app consume en vivo en este sprint, y que resuelve un
problema real: el admin no tiene por qué saber latitud y longitud.

`src/services/geocodificacionService.ts` (nuevo):

```ts
const GEOREF_URL = "https://apis.datos.gob.ar/georef/api/direcciones";

export interface ResultadoGeocodificacion {
  direccionNormalizada: string;
  latitud: number;
  longitud: number;
}

/** Georef: gratis y sin clave. Limitado a CABA (provincia 02) en este sprint. */
export async function geocodificarDireccion(direccion: string): Promise<ResultadoGeocodificacion[]>;
// fetch(`${GEOREF_URL}?direccion=${encodeURIComponent(d)}&provincia=02&max=5`), timeout 6 s con AbortController
```

| Tarea | Detalle |
|---|---|
| 6.1 Service | Implementar con `fetch` (API nativa de RN, no web), tipar la respuesta y validar los campos antes de usarlos |
| 6.2 Formulario | En `app/(admin)/instituciones.tsx`, botón "Buscar coordenadas" junto a la dirección; muestra hasta 5 resultados para elegir y completa lat/lng |
| 6.3 Respaldo | Si Georef falla, los campos manuales de lat/lng siguen disponibles |
| 6.4 Origen | Selector "Público / Privado" en el alta (Fase 4.4) |

**Terminado cuando:** el admin escribe "Av. Córdoba 2351", elige el resultado y la institución
aparece en el mapa del paciente en ese punto.

---

## Fase 7 — Verificación y documentación

| Tarea | Detalle |
|---|---|
| 7.1 Tipos | `npx tsc --noEmit` limpio |
| 7.2 Prueba manual | Con cada usuario de prueba: Home, Mapa (con y sin permiso de ubicación), Buscar → Médico → Reservar, admin → alta con Georef. Probar modo claro y oscuro |
| 7.3 Rendimiento | Mover el mapa por toda CABA en un Android de gama media sin trabas notables |
| 7.4 CLAUDE.md | Actualizar §5 (campos nuevos), §10 (regla de públicos), §13 (marcar "Siguiente" como hecho y dejar pendientes) |
| 7.5 README | Cómo regenerar la foto del REFES, usuarios de prueba por cobertura, atribuciones |
| 7.6 Mockup | Actualizar el mockup interactivo del Sprint 1 si cambió alguna pantalla ([03](03-entrega-sprint1.md)) |

---

## Orden y estimación

| Fase | Depende de | Esfuerzo estimado |
|---|---|---|
| 0 | — | 3–4 h (lo más lento es relevar cartillas) |
| 1 | 0 | 1 h |
| 2 | 1 | 3–4 h |
| 3 | 0, 2 | 1–2 h |
| 4 | 3 | 2 h |
| 5 | 4 | 4–5 h |
| 6 | 4 | 2 h |
| 7 | todas | 1–2 h |

Las fases 5 y 6 son independientes entre sí y se pueden repartir entre integrantes.

## Cómo se migra al backend después

| Hoy (frontend) | Mañana (backend) |
|---|---|
| `scripts/importar-refes.mjs` → JSON | El mismo script carga la tabla `sedes` (con `refes_id`) |
| `coberturas-caba.ts` | Tabla `cobertura_institucion` cargada por admin / institución |
| Filtro y Haversine en `institucionService` | Consulta geográfica en la base (p. ej. PostGIS) |
| Georef desde el celular | Georef desde el backend al dar de alta |
| Firma de `listInstituciones` | **No cambia** → las pantallas no se tocan |
