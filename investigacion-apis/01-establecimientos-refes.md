# 1. Establecimientos de salud: REFES

[← Volver al índice](README.md)

## Qué es

El **REFES** (Registro Federal de Establecimientos de Salud) es el registro oficial del
Ministerio de Salud de la Nación. Forma parte del SISA, el sistema de información sanitaria del
Ministerio. Lo creó la Res. 1070/2009 e incluye **todos** los establecimientos del país, con y
sin internación, públicos y privados, habilitados por la autoridad de cada jurisdicción.

Cada provincia carga y actualiza sus propios establecimientos. Las altas, bajas y
modificaciones dependen de cada jurisdicción.

## Cómo se obtiene

| Dato | Valor |
|---|---|
| Portal | [datos.salud.gob.ar — Listado de establecimientos REFES](https://datos.salud.gob.ar/dataset/listado-establecimientos-de-salud-asentados-en-el-registro-federal-refes) |
| Versiones disponibles | 2018, ago-2019, ago-2020, ene-2021, abr-2022, 2024, **dic-2025 (CSV)**, **ene-2026 (XLSX)** |
| Actualización | Semestral (metadato `accrualPeriodicity = R/P6M`) |
| Licencia | **Creative Commons Attribution 4.0**: se puede usar libremente citando "Ministerio de Salud de la Nación" |
| Acceso | Descarga directa sin clave, o por la API CKAN del portal |
| Tamaño | CSV 2025: ~9 MB · XLSX 2026: ~5 MB |
| Documentación | PDF "Documentación REFES" dentro del mismo dataset |

> El sitio `datos.salud.gob.ar` tiene un certificado SSL incompleto: algunos navegadores o
> herramientas fallan con "unable to verify the first certificate". Con `curl -k` descarga
> bien. Hay que tenerlo en cuenta en el script de importación.

## Columnas (CSV 2025 y XLSX 2026, iguales)

| Columna | Qué tiene |
|---|---|
| `establecimiento_id` | Código único de 14 dígitos (Res. 298/2011). **Identificador estable** para la app |
| `establecimiento_nombre` | Nombre de fantasía |
| `localidad_id`, `localidad_nombre` | Localidad (código BAHRA) |
| `provincia_id`, `provincia_nombre` | Provincia (código INDEC) |
| `departamento_id`, `departamento_nombre` | Departamento/partido (código INDEC) |
| `codloc`, `codent` | Partes del código de localidad |
| `origen_financiamiento` | Dependencia: Privado, Provincial, Municipal, Nacional, Universitario público, etc. |
| `tipologia_id`, `tipologia_sigla`, `tipologia_nombre` | Tipo de establecimiento y complejidad (Res. 298/2011 y 900E/2017). La sigla indica si es **con internación** (`ESCI…`) o **sin internación** (`ESSI…`) |
| `cp` | Código postal |
| `domicilio` | Calle, altura, piso |
| `sitio_web` | Web (solo 2.824 lo tienen) |
| `latitud`, `longitud` | Coordenadas decimales, negativas para Sur/Oeste |

**No tiene:** teléfono, horarios, especialidades ni obras sociales aceptadas.

## Calidad de los datos (medida)

| Medición | CSV dic-2025 | XLSX ene-2026 |
|---|---|---|
| Establecimientos | 36.046 | 36.074 |
| Con coordenadas válidas (dentro de Argentina) | 28.300 (78,5 %) | 28.327 (78,5 %) |
| Sin coordenadas o inválidas | 7.746 | 7.747 |
| IDs repetidos | 0 | — |

**Coordenadas verificadas a mano en CABA (todas correctas):**

| Establecimiento REFES | Domicilio | Coordenadas |
|---|---|---|
| HOSPITAL ITALIANO DE BUENOS AIRES | Gascón 450 | -34.6067, -58.4248 |
| HOSPITAL ALEMAN | Av. Pueyrredón 1650 | -34.5923, -58.4012 |
| SANATORIO GUEMES | Acuña de Figueroa 1240 | -34.5970, -58.4216 |
| HOSPITAL GENERAL DE AGUDOS DR. JUAN A. FERNANDEZ | Cerviño 3356 | -34.5815, -58.4070 |
| HOSPITAL DE CLINICAS JOSE DE SAN MARTIN | Av. Córdoba 2351 | -34.5994, -58.4003 |

**Particularidades a tener en cuenta:**

- **Cada sede es un establecimiento aparte.** El Hospital Italiano aparece como el hospital
  (Gascón 450) y, por separado, sus centros médicos (Belgrano, Caballito, Villa Urquiza, Palpa,
  Villa del Parque…). En la app el modelo es `Institucion` → `Sede`, así que **agrupar sedes en
  instituciones es trabajo nuestro** (por nombre o a mano).
- **Los nombres no son uniformes:** mayúsculas, abreviaturas ("HTAL"), nombres de fantasía.
- **Hay establecimientos que no son de atención** (ópticas, vacunatorios, residencias de
  adultos mayores, transporte sanitario). Hay que filtrarlos.

## Distribución

**Por provincia** (top 8, CSV 2025): Buenos Aires 10.155 · Córdoba 4.042 · Mendoza 2.397 ·
Tucumán 2.024 · CABA 1.917 · Santa Fe 1.689 · Neuquén 1.581 · Chubut 1.295.

**Por origen de financiamiento** (CSV 2025):

| Origen | Cantidad | ¿Público? |
|---|---|---|
| Privado | 23.186 | No |
| Provincial | 6.939 | Sí |
| Municipal | 4.953 | Sí |
| Seguridad Social | 254 | No (propios de obras sociales, p. ej. centros OSDEPYM) |
| FFAA/Seguridad | 168 | Sí |
| Otros | 154 | — |
| Servicio Penitenciario Provincial | 130 | Sí (no relevante para pacientes) |
| Universitario público | 76 | Sí |
| Mutual | 75 | No |
| Nacional | 43 | Sí |
| Mixta | 33 | — |
| Servicio Penitenciario Federal | 30 | Sí (no relevante para pacientes) |
| Universitario privado | 5 | No |

**Tipologías más frecuentes** (CSV 2025):

| Cantidad | Sigla | Nombre |
|---|---|---|
| 11.990 | ESSIDT | Con atención médica diaria y con especialidades y/o otras profesiones |
| 4.050 | ESSID | Laboratorio de Análisis Clínicos |
| 2.803 | ESSIDT | Con atención médica general por lo menos 3 días de la semana |
| 2.590 | ESCIRES | Vivienda para personas mayores |
| 2.037 | ESSIDT | Sin atención médica en forma periódica (menor a 3 veces por semana) |
| 1.250 | ESCL | Óptica |
| 1.243 | ESCL | Sistema de Atención extra hospitalaria |
| 1.168 | ESCIG | Bajo riesgo con internación simple |
| 1.048 | ESSIT | Otros |
| 826 | ESSIT | Centro Rehabilitación motora |
| 779 | ESCIG | Alto riesgo con terapia intensiva |
| 744 | ESSIT | Centro de día |
| 601 | ESCL | Internación Domiciliaria |
| 430 | ESSID | Diagnóstico por Imágenes |
| 415 | ESCIETE | Mediano riesgo con internación con cuidados especiales |
| 396 | ESCIE | Bajo riesgo con internación simple |
| 355 | ESSIDT | Con guardia permanente |
| 284 | ESSIT | Centro de Diálisis |
| 251 | ESCIG | Mediano riesgo con internación con cuidados especiales |
| 237 | ESCL | Vacunatorios |
| … | … | (hay 61 combinaciones en total) |

## Cuántos sirven para la app

Mapeo propuesto a `TipoInstitucion` (`frontend/src/domain/institucion.ts`):

| Tipo en la app | Criterio en el REFES | Total | Con coordenadas | CABA con coordenadas |
|---|---|---|---|---|
| `hospital` | Sigla `ESCI*` (con internación), sin `ESCIRES`, y financiamiento **público** | 1.505 | 1.472 | 46 |
| `clinica` | Sigla `ESCI*` (con internación), sin `ESCIRES`, y financiamiento **privado** | 2.249 | 2.131 | 453 |
| `centro_medico` | Sigla `ESSIDT` con atención médica (sin "Sin atención médica…") | 15.148 | 12.714 | 739 |
| `laboratorio` | Sigla `ESSID` de laboratorio o diagnóstico por imágenes | 4.688 | 2.866 | 163 |
| **Total** | | **23.590** | **19.183** | **1.401** |

Quedan afuera unos 12.500 registros: residencias, ópticas, ortopedias, vacunatorios, centros de
día, traslados, etc.

> Este mapeo es una propuesta. La regla "público = hospital / privado = clínica" simplifica:
> hay sanatorios privados grandes que la gente llama "hospital" (Hospital Italiano, Alemán).
> Si importa, se puede ajustar por nombre o agregar un tipo `sanatorio`.

## Conclusión

El REFES es **la fuente base recomendada** para todos los establecimientos de la app:

- Oficial, nacional, gratis, con licencia libre y actualización semestral.
- Trae coordenadas en casi 4 de cada 5 registros. El resto se puede geocodificar (ver
  [doc 4](04-mapas-geocodificacion-y-otras-fuentes.md#api-georef)).
- Tiene un ID estable para actualizar sin duplicar.
- Distingue público de privado, que es clave para la regla de cobertura (ver
  [doc 3](03-relacion-cobertura-establecimiento.md)).
- **No dice qué obras sociales acepta cada lugar.**
