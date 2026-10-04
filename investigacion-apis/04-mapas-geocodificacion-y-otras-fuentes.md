# 4. Mapas, geocodificación y otras fuentes

[← Volver al índice](README.md)

## Resumen

| Necesidad | Solución recomendada | Costo |
|---|---|---|
| Mostrar el mapa en el celular | `react-native-maps` con el SDK nativo de Google Maps (ya está en la app) | **Gratis e ilimitado** |
| Ordenar por distancia / "más cercano" | Calcular con nuestras coordenadas: `frontend/src/utils/geo.ts` ya tiene Haversine. Con backend, consultas geográficas en la base (p. ej. PostGIS) | Gratis |
| Coordenadas que le faltan al REFES (~7.700) | **API Georef** del Estado | **Gratis, sin clave** |
| Respaldo de geocodificación | Google Geocoding API | 10.000 gratis/mes |
| "Cómo llegar" | Abrir Google Maps con la URL de destino (la app ya lo hace) | Gratis |
| Ruta dibujada dentro de la app (opcional) | Google Routes API | 10.000 gratis/mes |
| Buscar lugares cercanos | ❌ No usar Google Places como fuente principal | Caro y sin datos de cobertura |

---

## API Georef

Servicio del Estado nacional para normalizar direcciones y convertirlas en coordenadas.

| Dato | Valor |
|---|---|
| Sitio | [argentina.gob.ar/georef](https://www.argentina.gob.ar/georef) |
| Endpoint usado | `https://apis.datos.gob.ar/georef/api/direcciones` |
| Parámetros | `direccion` (obligatorio). Opcionales y recomendados: `provincia`, `departamento`, `localidad_censal`, `localidad`, `max` |
| Autenticación | Ninguna |
| Costo | Gratis |
| Extra | Soporta consultas por lotes, útil para geocodificar miles de direcciones en la importación |

**Pruebas en vivo:**

| Dirección consultada | Resultado de Georef | ¿Correcto? |
|---|---|---|
| "Avenida Pueyrredón 1640", CABA | AV PUEYRREDON 1640 → -34.5921, -58.4013 | ✅ Coincide con el Hospital Alemán en el REFES |
| "Calle 1 1790", La Plata | CALLE 1 1790, La Plata → -34.8807, -57.9836 | ✅ |
| "Perón 4190", CABA | **AV EVA PERON 4190** → -34.6516, -58.4719 | ❌ Otra calle. El Hospital Italiano está en Tte. Gral. Juan Domingo Perón 4190 |

**Conclusión:** sirve y es gratis, pero **necesita el nombre oficial de la calle**. En la
importación conviene:

1. Pasar siempre `provincia` y `localidad` del REFES para acotar la búsqueda.
2. Validar que el punto caiga en la localidad esperada.
3. Si no cae o no hay resultado, usar Google Geocoding como respaldo, o marcar el
   establecimiento para revisión manual.

---

## Google Maps Platform

Precios oficiales ([developers.google.com/maps/billing-and-pricing/pricing](https://developers.google.com/maps/billing-and-pricing/pricing)).
Los topes gratuitos son **por mes y por SKU**.

| SKU | Gratis por mes | Precio primer tramo (por 1.000) |
|---|---|---|
| **Maps SDK nativo (Android/iOS)** | **Ilimitado** | Gratis |
| Dynamic Maps (web) | 10.000 | USD 7 |
| Places API Nearby Search Pro | 5.000 | USD 32 |
| Places API Text Search Pro | 5.000 | USD 32 |
| Places API Place Details Essentials | 10.000 | USD 5 |
| Places API Place Details Pro | 5.000 | USD 17 |
| Geocoding | 10.000 | USD 5 |
| Routes: Compute Routes Essentials | 10.000 | USD 5 |

**Por qué no usar Google Places como fuente de establecimientos:**

- **No sabe qué obra social acepta cada lugar**, que es lo central de la app.
- No trae el código REFES, así que no se puede cruzar con el registro oficial.
- Cada búsqueda cercana cuesta (USD 32 cada 1.000 después de las 5.000 gratis).
- Los términos de Google limitan guardar sus resultados en una base propia.

**Lo que sí usamos de Google:** el SDK nativo del mapa (gratis) y, opcionalmente, Geocoding como
respaldo de Georef. La clave va en `.env`, nunca en el repo (CLAUDE.md §11).

---

## OpenStreetMap

Base de datos colaborativa de mapas. Se consulta con la **Overpass API**.

| Dato | Valor |
|---|---|
| Endpoint | `https://overpass-api.de/api/interpreter` |
| Autenticación | Ninguna |
| Licencia | **ODbL**: exige atribución y compartir los datos derivados con la misma licencia |
| Límites | La instancia pública tiene límites de uso. Sirve para importar de vez en cuando, no para consultar desde cada celular |

**Prueba en CABA** (`amenity=hospital`, `amenity=clinic`, `healthcare=laboratory`):

- **421** elementos: 276 clínicas, 120 hospitales, 24 laboratorios, 1 consultorio.
- Etiquetas más frecuentes: `healthcare`, `name`, `amenity`, `addr:*`, `phone`,
  `operator:type`, **`ref:sisa_codigo`**, **`ref:sisa_tipologia`**, `operator`, `website`,
  `healthcare:speciality`, `opening_hours`, `wheelchair`.
- **Muchos tienen `ref:sisa_codigo`**, o sea, **se pueden cruzar con el REFES por código**.
- Solo **1** tiene etiqueta de seguros/cobertura.

**Uso propuesto:** complemento opcional del REFES para sumar teléfono, web, horarios y
especialidades, cruzando por `ref:sisa_codigo`. No sirve para coberturas.

---

## SISA (servicios web del Ministerio de Salud)

- El SISA tiene un **buscador web público** de establecimientos (REFES) y profesionales
  (REFEPS). Es el buscador de argentina.gob.ar que se usó para el ejemplo de matrícula del
  registro de profesionales.
- También ofrece **servicios web**, pero **requieren usuario y contraseña** otorgados por el
  Ministerio, y están pensados para sistemas que se integran (por ejemplo, para cargar
  planteles de personal se pide por mail a `soporte@sisa.msal.gov.ar`). No hay API abierta.
- **No encontré documentación técnica pública** de los endpoints.

**Uso propuesto:**

- **Establecimientos:** no hace falta, alcanza con el dataset descargable del REFES.
- **Profesionales (futuro):** hoy el registro de profesionales verifica contra un padrón
  simulado (`frontend/src/mocks/padronProfesionales.ts`). Verificar matrículas contra el
  **REFEPS real** requeriría pedir credenciales del SISA. Queda anotado para cuando exista el
  backend.

---

## Datasets provinciales

Algunas jurisdicciones publican sus propios datasets con coordenadas, por ejemplo la
[Provincia de Buenos Aires](https://catalogo.datos.gba.gob.ar/dataset/establecimientos-salud):
establecimientos **públicos**, datos de 2022, en CSV/GeoJSON/Shapefile, con el código REFES
(`cnr`).

Son subconjuntos del REFES nacional. No hacen falta si se usa el nacional, salvo que alguno
tenga un dato extra útil.
