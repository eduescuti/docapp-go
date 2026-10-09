# 1. Dominio y datos del REFES

[← Volver al índice](README.md)

Fases 1 y 2 del [plan](../plan-integracion-apis/02-fases.md): preparar los tipos para datos
reales y traer los establecimientos de CABA del REFES.

---

## 1. Cambios en el dominio (fase 1)

| Tipo | Cambio | Por qué |
|---|---|---|
| `OrigenFinanciamiento` (nuevo) | `"publico" \| "privado" \| "seguridad_social"` | Decide quién ve cada lugar (regla 15) |
| `Institucion` | `origen` (obligatorio) y `sitioWeb?` | El REFES trae el origen y, a veces, la web |
| `Sede` | `telefono?` pasa a opcional y se suma `refesId?` | El REFES **no trae teléfono**. `refesId` es el `establecimiento_id` de 14 dígitos |
| `PlanMedico` | `registro?` (`RNAS` · `RNEMP` · `otro`) y `codigoOficial?` | Para identificar la cobertura en los registros oficiales (fase 3) |
| `FuenteCobertura` (nuevo, `coberturaRelacion.ts`) | plan, institución, URL de la cartilla y fecha | Guardar de dónde sale que un privado acepta un plan (fase 3) |

Efectos en pantallas:

- **Instituciones favoritas:** el botón "Llamar" aparece solo si la sede tiene teléfono.
- **Alta de instituciones (admin):** las altas son `origen: "privado"` hasta que el formulario
  tenga el selector Público / Privado (fase 6). Así se comportan igual que antes: solo para las
  obras sociales elegidas.

## 2. El script de importación (fase 2)

`DocApp Go/frontend/scripts/importar-refes.mjs` — Node puro, sin dependencias, se corre en la
compu:

```bash
node scripts/importar-refes.mjs scripts/.cache/refes-20251215.csv
```

- **Entrada:** el CSV del REFES del 15/12/2025 (~9 MB). Va en `scripts/.cache/`, que está en
  `.gitignore`. Cómo bajarlo: [06-como-reproducir.md](../06-como-reproducir.md#refes).
- **Salida:** `src/mocks/data/refes-caba.json`. Una cabecera (fuente, URL, licencia CC BY 4.0,
  versión, fecha de generación, campos) y **una fila por línea**, así los cambios entre versiones
  se leen fácil en un diff.
- **Reporte:** al terminar imprime cuántos quedaron por tipo y origen, y cuántos se descartaron y
  por qué.

### Pasos

| Paso | Regla |
|---|---|
| Leer el CSV | Parser propio (comillas, comillas escapadas, `\n` y `\r\n`) |
| Provincia | `provincia_id === "02"` (CABA) |
| Coordenadas | Dentro de la caja de CABA: latitud −34,71 a −34,52 y longitud −58,54 a −58,33 |
| Origen | Provincial, Municipal, Nacional, Universitario público → `publico` · Seguridad Social y **FFAA/Seguridad** → `seguridad_social` · resto → `privado` · penitenciarios → se descartan |
| Tipo | Ver la tabla de abajo |
| Textos | De MAYÚSCULAS a "Título", con tildes en palabras comunes (Clínica, Médico, Pediatría…), siglas (CESAC, CEMIC, S.A.) y "HTAL" → "Hospital" |
| Web | Se le agrega `https://` si falta |
| IDs | `institucion.id = "refes-" + establecimiento_id` · `sede.id = "sede-" + establecimiento_id` |
| Orden | Por `establecimiento_id`, para que el archivo sea estable |

### Tipo de cada establecimiento

| Tipología del REFES | Tipo en la app |
|---|---|
| Con internación (`ESCI*`), pública **o** con nombre que empieza con "Hospital" | `hospital` |
| Con internación, privada (sanatorios y clínicas) | `clinica` (decisión D3) |
| `ESSIDT` con atención médica (centros de salud, consultorios) | `centro_medico` |
| `ESSID` de laboratorio o diagnóstico por imágenes | `laboratorio` |
| `ESCIRES` (residencias) y **`ESCIETE` (geriátricos)** | Se descartan |
| Ópticas, vacunatorios, internación domiciliaria, medicina laboral, etc. | Se descartan |

### Resultado (CSV del 15/12/2025)

De **1.916** establecimientos de CABA quedan **1.077** (163 KB):

| Tipo | Público | Privado | Seguridad social |
|---|---|---|---|
| Hospital | 38 | 6 | 4 |
| Clínica / sanatorio | 0 | 113 | 15 |
| Centro médico | 122 | 570 | 46 |
| Laboratorio | 2 | 161 | 0 |

| Descartados | Cantidad |
|---|---|
| Tipología `ESCL` (ópticas, internación domiciliaria, vacunatorios…) | 334 |
| `ESCIETE` (geriátricos) | 323 |
| `ESSIT` (salud mental ambulatoria, centros de día, diálisis…) | 84 |
| `ESCIRES` (residencias) | 76 |
| `ESSID` que no es laboratorio ni imágenes | 21 |
| `ESNOASIST` | 1 |

## 3. Lo que mostraron los datos (y cambió respecto del plan)

| Hallazgo | Qué se hizo |
|---|---|
| El criterio de la investigación ("todo `ESCI*` menos `ESCIRES`") contaba **323 geriátricos** (`ESCIETE`) como clínicas. Por eso se hablaba de ~1.400 lugares | Se excluyen. Quedó anotado en [doc 1 de la investigación](../01-establecimientos-refes.md) |
| "FFAA/Seguridad" en CABA incluye la **Fragata Libertad**, el **rompehielos Irizar**, cuarteles y el Comando Antártico. Los hospitales militares atienden sobre todo a su propia obra social | Se tratan como `seguridad_social`: no se muestran a todos |
| Hospitales privados (Alemán, Británico, Italiano, Sirio Libanés, Israelita) quedaban como "clínica" | Con internación: `hospital` si es público **o** si el nombre empieza con "Hospital" |
| Los nombres vienen en mayúsculas y sin tildes | Normalización de textos en el script |

## 4. Cómo se cargan en la app

`src/mocks/instituciones.ts` importa el JSON y convierte cada fila en una `Institucion` con una
sola `Sede`, **validando cada campo** (el JSON no trae tipos de TypeScript). Si una fila no tiene
la forma esperada, la app falla al arrancar con un mensaje claro, sin usar `any`.

- Cada establecimiento es **una institución con una sede**, es decir, una dirección (decisión D5).
- `planesAceptadosIds` arranca **vacío**: no se inventan coberturas de lugares reales. Se cargan
  en la fase 3, desde las cartillas.
- `fuenteInstitucionesMock` expone fuente, licencia y versión para la atribución en Ayuda.

## 5. Reemplazo de las instituciones inventadas (D4)

Médicos, turnos, estudios, órdenes y favoritos de prueba apuntaban a 4 instituciones inventadas.
Se reemplazaron con un criterio explicable: **mismo nombre** si existe un lugar real con ese
nombre; si no, **el más cercano** a la dirección inventada.

| Antes (inventada) | Ahora (REFES) | Criterio |
|---|---|---|
| Hospital Italiano (`inst-hospital-italiano`) | Hospital Italiano de Buenos Aires (`refes-10020012315256`) | Mismo nombre |
| Clínica Los Arcos (`inst-los-arcos`) | Sanatorio de los Arcos (`refes-10020012315240`) | Mismo nombre |
| Centro Médico Norte (`inst-centro-norte`) | CESAC Nº 33 (`refes-50020012115367`) | Centro público más cercano: se ve en el mapa para cualquier obra social |
| Laboratorio Bioanálisis Sur (`inst-labo-sur`) | Diagnóstico Mediter (`refes-51020062319036`) | Laboratorio más cercano |

Cada archivo de mocks tiene un comentario arriba que dice a qué lugar corresponde cada id. El
texto de una notificación que nombraba al centro inventado también se actualizó.

> Los médicos siguen siendo ficticios. Que figuren en lugares reales es solo para la demo.

## 6. Cómo regenerar los datos

1. Bajar la versión nueva del REFES a `scripts/.cache/` (las URLs salen de la API CKAN, ver
   [06-como-reproducir.md](../06-como-reproducir.md)). Si solo hay XLSX, exportarlo a CSV.
2. `node scripts/importar-refes.mjs scripts/.cache/<archivo>.csv`
3. Revisar el reporte y el diff del JSON. Si cambian ids de los lugares usados por los mocks
   (tabla de arriba), actualizarlos.
4. Commitear el JSON (no el CSV).

También está explicado en `DocApp Go/frontend/README.md`, sección "Establecimientos reales (REFES)".
