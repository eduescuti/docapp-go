# Integración del mapa — DocApp Go

[← Volver a la investigación](../README.md)

Registro de lo que se hizo para que el mapa de la app muestre **establecimientos de salud reales
de CABA**, filtrados por la **obra social del paciente**, y funcione en **Expo Go, web y la app
compilada**. Es la puesta en práctica de las fases 1, 2 y 5 del
[plan de integración](../plan-integracion-apis/README.md).

- **Fecha:** 09/10/2026
- **Estado:** fases 1, 2 y 5 hechas. Fase 3 (cartillas), resto de la 4, fase 6 (Georef) y fase 7
  pendientes ([doc 6](06-pendientes-y-riesgos.md)).
- **Todo en el frontend** (`DocApp Go/frontend/`). La carpeta `backend/` no se tocó.

---

## Índice

| # | Documento | Qué cuenta |
|---|---|---|
| 1 | [Dominio y datos del REFES](01-dominio-y-datos-refes.md) | Tipos nuevos, script de importación, filtros, qué se descartó y por qué |
| 2 | [Cobertura y búsqueda](02-cobertura-y-busqueda.md) | Decisiones D1–D6, regla 15, `buscarCentros` y qué ve cada obra social |
| 3 | [Motor del mapa](03-motor-del-mapa.md) | Por qué no Google Maps, cómo funciona MapLibre en WebView/iframe |
| 4 | [Pantallas](04-pantallas.md) | Mapa, vista previa del Inicio, Mi plan, Ayuda, admin |
| 5 | [Cómo probar](05-como-probar.md) | Comandos, recorrido de prueba y qué se verificó |
| 6 | [Pendientes y riesgos](06-pendientes-y-riesgos.md) | Lo que falta y lo que hay que confirmar |
| 7 | [Otros cambios de la app](07-otros-cambios-de-la-app.md) | Web, Turnos, Estudios, Inicio, paneles y animaciones |

---

## Resumen

| Antes | Ahora |
|---|---|
| 4 instituciones inventadas | **1.077 establecimientos reales de CABA** (REFES, Ministerio de Salud) |
| Todas filtradas por plan, sin distinción | **Públicos visibles para todos** (regla 15); privados solo si aceptan el plan |
| Google Maps con `react-native-maps`: en Expo Go se veía **negro** | **MapLibre + OpenFreeMap** en un WebView: anda en Expo Go, web y app compilada, sin clave |
| Marcadores rojos y una tarjeta con nombre y dirección | GPS, colores por tipo, filtros, "Más cercano", tarjeta con distancia, profesionales, "Cómo llegar", vista de lista |
| Web: el mapa no existía | El mismo mapa dentro de un `<iframe>` |
| Inicio con una lista de "instituciones cercanas" | Vista previa del mapa real, sin lista, y el Inicio entra en una pantalla |

## Cómo fluyen los datos

```
REFES (CSV ~9 MB, datos.salud.gob.ar)                     ← se baja a mano, no se versiona
   │  node scripts/importar-refes.mjs                      (corre en la compu, no en el celular)
   ▼
src/mocks/data/refes-caba.json   1.077 sedes · 163 KB      ← se versiona, no se edita a mano
   │  src/mocks/instituciones.ts  valida cada fila → Institucion
   ▼
src/services/institucionService.ts
   ├─ aceptaCobertura()   público ⇒ todos · privado ⇒ solo si acepta el plan (regla 15)
   └─ buscarCentros()     cobertura → tipos → radio → orden por distancia → límite
          ▲
          │  src/hooks/useUbicacion.ts   GPS con expo-location (Obelisco si no hay permiso)
          │
Pantallas: app/(paciente)/mapa.tsx (mapa + lista) · Inicio (vista previa) · Mi plan · Ayuda
   │
   ▼
src/components/mapa/MapaCentros  ──►  WebView (Android/iOS)  ─┐
                                 ──►  <iframe> (web)          ─┴─►  MapLibre GL JS 5.24
                                                                     + teselas OpenFreeMap
                                                                     + colores de theme.mapa
```

## Archivos principales

| Archivo | Qué hace |
|---|---|
| `scripts/importar-refes.mjs` | Filtra el CSV del REFES y genera el JSON de CABA |
| `src/mocks/data/refes-caba.json` | Los 1.077 establecimientos, una fila por línea |
| `src/mocks/instituciones.ts` | Convierte cada fila en `Institucion` validando los tipos |
| `src/domain/institucion.ts` | `OrigenFinanciamiento`, `origen`, `refesId`, `telefono?` |
| `src/domain/coberturaRelacion.ts` | `FuenteCobertura` (para la fase 3) |
| `src/services/institucionService.ts` | `aceptaCobertura`, `buscarCentros`, `getFuenteInstituciones` |
| `src/hooks/useUbicacion.ts` | GPS con `expo-location` |
| `src/components/mapa/` | `MapaCentros` (WebView y web), página HTML de MapLibre, puente de mensajes |
| `src/theme/tokens.ts` | `theme.mapa`: colores del mapa y de los marcadores por tema |
| `src/utils/institucion.ts` | Etiquetas, íconos y color por tipo de institución |
| `app/(paciente)/mapa.tsx` | Pantalla del mapa (celular y web) |
| `app/(paciente)/index.tsx` | Inicio con la vista previa del mapa |

## Decisiones, en orden

| Fecha | Decisión | Dónde |
|---|---|---|
| 09/10/2026 | D1: los hospitales públicos se ven para todos → regla 15 de CLAUDE.md §10 | [doc 2](02-cobertura-y-busqueda.md) |
| 09/10/2026 | D2: OSDE 210 + Swiss Medical SMG20 + Galeno Oro (Medifé sin relaciones) | [doc 2](02-cobertura-y-busqueda.md) |
| 09/10/2026 | D3: los sanatorios quedan como `clinica` | [doc 1](01-dominio-y-datos-refes.md) |
| 09/10/2026 | D4: las instituciones inventadas se reemplazan por reales | [doc 1](01-dominio-y-datos-refes.md) |
| 09/10/2026 | D5: no se agrupan sedes: cada establecimiento es una dirección | [doc 1](01-dominio-y-datos-refes.md) |
| 09/10/2026 | D6: la atribución del REFES va solo en Menú → Ayuda | [doc 4](04-pantallas.md) |
| 09/10/2026 | Entran también centros médicos y consultorios (`centro_medico`) | [doc 1](01-dominio-y-datos-refes.md) |
| 09/10/2026 | El mapa pasa a **MapLibre + OpenFreeMap** | [doc 3](03-motor-del-mapa.md) |
| 09/10/2026 | El mapa también en web, con un `<iframe>` (excepción a "sin HTML") | [doc 3](03-motor-del-mapa.md) |
| 09/10/2026 | El Inicio muestra una vista previa del mapa, sin lista de nombres | [doc 4](04-pantallas.md) |
