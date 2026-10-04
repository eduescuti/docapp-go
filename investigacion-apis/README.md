# Investigación de APIs y fuentes de datos

Investigación sobre de dónde sacar los datos que necesita DocApp Go para su objetivo central:

> Que cualquier persona encuentre el hospital o centro más cercano **que acepte su obra social**.

- **Fecha:** 03/10/2026
- **Método:** no me quedé con las descripciones de cada fuente. Descargué los archivos, conté
  filas, revisé columnas y calidad de coordenadas, y probé las APIs en vivo. Los números de
  estos documentos salen de esas pruebas.
- **Para repetir las pruebas:** [06-como-reproducir.md](06-como-reproducir.md).

---

## Índice

| # | Documento | Qué responde |
|---|---|---|
| 1 | [Establecimientos de salud (REFES)](01-establecimientos-refes.md) | ¿De dónde saco hospitales, clínicas y laboratorios con coordenadas? |
| 2 | [Obras sociales y prepagas](02-obras-sociales-y-prepagas.md) | ¿De dónde saco el catálogo de coberturas? |
| 3 | [Relación cobertura ↔ establecimiento](03-relacion-cobertura-establecimiento.md) | ¿Hay algún lugar que diga qué hospital acepta qué obra social? |
| 4 | [Mapas, geocodificación y otras fuentes](04-mapas-geocodificacion-y-otras-fuentes.md) | Google Maps/Places, Georef, OpenStreetMap, SISA, datasets provinciales |
| 5 | [Propuesta para DocApp Go](05-propuesta-para-docapp-go.md) | Cómo armar los datos de la app y qué decisiones faltan |
| 6 | [Cómo reproducir](06-como-reproducir.md) | Comandos para descargar y verificar cada fuente |
| 7 | [Glosario y fuentes](07-glosario-y-fuentes.md) | Siglas (REFES, RNAS, SSSalud…) y links consultados |

---

## Resumen

| Lo que necesita la app | ¿Hay fuente pública? | Fuente |
|---|---|---|
| Establecimientos con coordenadas | ✅ Sí, oficial, gratis y nacional | **REFES** — Ministerio de Salud |
| Catálogo de obras sociales nacionales | ✅ Sí | **RNAS** — Superintendencia de Servicios de Salud |
| Catálogo de prepagas | ⚠️ Solo búsqueda de a una por nombre | **RNEMP** — Superintendencia de Servicios de Salud |
| PAMI y obras sociales provinciales | ⚠️ No hay listado unificado | Carga manual |
| **Qué establecimiento acepta qué cobertura** | ❌ **No existe** como dato público | Hay que construirlo (ver doc 3 y 5) |
| Mapa en el celular | ✅ Gratis e ilimitado | SDK nativo de Google Maps (ya en la app) |
| Coordenadas que faltan | ✅ Gratis | API **Georef** del Estado |

## Conclusiones principales

1. **El REFES resuelve el mapa.** Son 36.074 establecimientos de todo el país (versión enero
   2026), con licencia libre CC BY 4.0. El ~78,5 % tiene coordenadas válidas. Filtrando con las 4
   categorías de la app quedan unos 23.500 útiles.
2. **El RNAS resuelve el catálogo de obras sociales nacionales:** 366 entidades con código
   oficial, exportables a Excel. Las prepagas, PAMI y las provinciales se completan a mano.
3. **La relación cobertura ↔ establecimiento no la publica nadie.** Las cartillas se presentan a
   la Superintendencia por un trámite interno y cada prepaga tiene su buscador propio, sin API.
   Es el dato más valioso de la app y hay que construirlo con datos propios.
4. **No hace falta Google Places.** Es caro, no sabe de coberturas y el "más cercano" se calcula
   con nuestras propias coordenadas.

## Decisiones pendientes

Detalle en [05-propuesta-para-docapp-go.md](05-propuesta-para-docapp-go.md#5-decisiones-pendientes).

1. ¿Los hospitales públicos se muestran a todos los pacientes, sin importar la cobertura?
2. ¿Qué alcance geográfico tiene la demo? (CABA / AMBA / país)
3. ¿Qué coberturas se cargan con relaciones reales para la demo?
4. ¿Se arma ya un subconjunto real del REFES en `frontend/src/mocks/` o se espera al backend?
5. ¿Qué stack tiene el backend? (conviene una base con soporte geográfico)
