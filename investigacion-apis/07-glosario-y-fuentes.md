# 7. Glosario y fuentes

[← Volver al índice](README.md)

## Glosario

| Sigla / término | Significado |
|---|---|
| **SISA** | Sistema Integrado de Información Sanitaria Argentino. Plataforma del Ministerio de Salud que reúne los registros federales |
| **REFES** | Registro Federal de Establecimientos de Salud (Res. 1070/2009). Todos los establecimientos del país |
| **REFEPS** | Red Federal de Registros de Profesionales de la Salud. Matrículas de los profesionales |
| **SSSalud** | Superintendencia de Servicios de Salud. Regula obras sociales nacionales y prepagas |
| **RNAS** | Registro Nacional de Agentes del Seguro (antes **RNOS**, Registro Nacional de Obras Sociales). Obras sociales nacionales |
| **RNEMP** | Registro Nacional de Entidades de Medicina Prepaga. Prepagas |
| **PAMI / INSSJP** | Instituto Nacional de Servicios Sociales para Jubilados y Pensionados |
| **HPGD** | Hospitales Públicos de Gestión Descentralizada (Decreto 939/2000). Pueden facturar a obras sociales |
| **Cartilla** | Listado de prestadores y prestaciones de una obra social o prepaga (Res. 2165/2021) |
| **PMO** | Programa Médico Obligatorio. Prestaciones mínimas que toda obra social tiene que cubrir |
| **TAD** | Trámites a Distancia, la plataforma de trámites del Estado |
| **UGL** | Unidad de Gestión Local de PAMI (división regional) |
| **BAHRA** | Base de Asentamientos Humanos de la República Argentina (códigos de localidad) |
| **CKAN** | Software de los portales de datos abiertos. Tiene una API para listar y buscar datasets |
| **Georef** | Servicio del Estado para normalizar direcciones y obtener coordenadas |
| **Overpass** | API de consulta de OpenStreetMap |
| **ODbL** | Licencia de OpenStreetMap: atribución + compartir derivados con la misma licencia |
| **CC BY 4.0** | Licencia del REFES: uso libre con atribución |

**Siglas de tipología del REFES** (detalle en Res. 298/2011 y 900E/2017). Según la
documentación oficial, la sigla indica si el establecimiento es con o sin internación:

| Prefijo | Significado | Ejemplos en los datos |
|---|---|---|
| `ESCI…` | Establecimiento de salud **con internación** | `ESCIG` (general), `ESCIE`, `ESCIEP`, `ESCIEM`, `ESCIESM`, `ESCIETE`, `ESCIRES` (residencias) |
| `ESSI…` | Establecimiento de salud **sin internación** | `ESSIDT` (diagnóstico y tratamiento), `ESSID` (diagnóstico: laboratorios, imágenes), `ESSIT` (tratamiento: rehabilitación, diálisis) |
| `ESCL` | Otros establecimientos | Ópticas, vacunatorios, internación domiciliaria, traslados |

> El desglose de cada sufijo (G, E, EP, EM, ESM, ETE) lo deduje de los nombres de tipología que
> aparecen en los datos. El significado oficial exacto está en la Res. 298/2011, que no revisé.

## Fuentes consultadas

### Establecimientos
- [Datos abiertos de Salud — Listado de establecimientos REFES](https://datos.salud.gob.ar/dataset/listado-establecimientos-de-salud-asentados-en-el-registro-federal-refes)
- [Registros Federales de Referencia de Establecimientos y Profesionales de la Salud](https://www.argentina.gob.ar/salud/garantia-de-calidad-de-la-atencion-medica/registros-federales-de-referencia-de)
- [Catálogo de datos abiertos PBA — Establecimientos de salud](https://catalogo.datos.gba.gob.ar/dataset/establecimientos-salud)

### Obras sociales y prepagas
- [SSSalud — Agentes del Seguro (RNAS)](https://www.argentina.gob.ar/sssalud/agentes-del-seguro-rnas)
- [SSSalud — Listado de entidades inscriptas en el RNAS](https://www.sssalud.gob.ar/?page=listRnosc&tipo=100)
- [SSSalud — Consulta de Empresas de Medicina Prepaga](https://www.sssalud.gob.ar/index.php?cat=consultas&page=bus_emp_padron)
- [Datos abiertos de Salud — Padrón de beneficiarios de Obras Sociales Nacionales](https://datos.salud.gob.ar/dataset/padron-de-beneficiarios-de-obras-sociales-nacionales)

### Prestadores y cartillas
- [SSSalud — Prestadores (registro de establecimientos y profesionales)](https://www.argentina.gob.ar/sssalud/prestadores)
- [Trámite: Presentar cartilla médico asistencial](https://www.argentina.gob.ar/servicio/presentar-cartilla-medico-asistencial)
- [Resolución 2165/2021 SSSalud](https://www.argentina.gob.ar/normativa/nacional/norma-358669/texto)
- [Resolución 487/2002 — Hospitales Públicos de Gestión Descentralizada](https://www.argentina.gob.ar/normativa/nacional/resolución-487-2002-77280/texto)
- [Datos abiertos PAMI — Listado de prestadores](https://datos.pami.org.ar/dataset/listado-de-prestadores)

### Mapas y geocodificación
- [API Georef](https://www.argentina.gob.ar/georef)
- [Overpass API (OpenStreetMap)](https://overpass-api.de/)
- [Google Maps Platform — precios](https://developers.google.com/maps/billing-and-pricing/pricing)

## Lo que no se pudo verificar

- **Documentación técnica de los servicios web del SISA:** no es pública. Se pide al Ministerio.
- **Formato interno de cada cartilla de prepaga:** no revisé uno por uno los buscadores de
  OSDE, Swiss Medical, Galeno, etc. Lo único confirmado es que no ofrecen API pública.
- **Significado oficial de cada sufijo de tipología:** ver la nota del glosario.
- **Consulta de cobertura por persona** (padrón de beneficiarios de la SSSalud): el acceso que
  encontré requiere usuario. No sé si existe una consulta pública ni la probé.
