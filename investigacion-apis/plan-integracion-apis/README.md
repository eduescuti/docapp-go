# Plan de integración de APIs — DocApp Go

[← Volver a la investigación](../README.md)

Plan por fases para llevar al frontend los datos reales encontrados en la investigación
(docs 1 a 5): **establecimientos del REFES en el mapa, filtrados por la obra social del
paciente**, sin tocar el backend.

- **Fecha:** 08/10/2026
- **Registro de lo hecho:** [integracion-mapa/](../integracion-mapa/README.md).
- **Estado:** fases 1, 2 y 5 hechas (09/10/2026). Fase 0: decisiones confirmadas; falta relevar
  las cartillas, que hacen falta para la Fase 3.
- **Alcance:** solo **CABA** y solo **3 coberturas** (ver [01](01-alcance-y-decisiones.md)).
- **Restricción:** todo en `DocApp Go/frontend/`. La carpeta `backend/` no se toca.

---

## Índice

| # | Documento | Qué responde |
|---|---|---|
| 1 | [Alcance y decisiones](01-alcance-y-decisiones.md) | Qué entra, qué no, y qué hay que confirmar antes de programar |
| 2 | [Fases de integración](02-fases.md) | El plan paso a paso, con archivos, tareas y criterio de "terminado" |
| 3 | [Entrega del Sprint 1](03-entrega-sprint1.md) | Cómo encaja esto con la consigna y con el mockup interactivo en HTML |

---

## La idea en una imagen

```
                 ┌──────────────── SE HACE UNA VEZ, EN LA COMPU ────────────────┐
REFES (CSV, 9 MB)│  scripts/importar-refes.mjs                                   │
  datos.salud ───┼─► filtra CABA + tipologías útiles + coordenadas válidas ─────┼─► src/mocks/data/refes-caba.json
                 │   mapea tipo (hospital/clínica/centro/lab) y público/privado   │      (1.077 sedes)
                 └───────────────────────────────────────────────────────────────┘
RNAS / RNEMP ───────► (a mano) 3 coberturas con su código oficial ───────────────► src/mocks/planesMedicos.ts
Cartillas públicas ─► (a mano) qué sede privada acepta qué cobertura ────────────► src/mocks/coberturas-caba.ts

                 ┌──────────────── EN EL CELULAR ───────────────────────────────┐
                 │ services/institucionService  ── regla: público ⇒ todos;      │
                 │                                 privado ⇒ solo si acepta plan│
                 │ expo-location (GPS) ──────────► "más cercanos" (Haversine)    │
                 │ react-native-maps + Google ───► marcadores + tarjeta          │
                 │ Georef (HTTP, en vivo) ───────► admin: dirección → lat/lng    │
                 │ Linking → Google Maps ────────► "Cómo llegar"                 │
                 └───────────────────────────────────────────────────────────────┘
```

**Por qué así:** el REFES no tiene API utilizable desde el celular (certificado SSL
incompleto, 9 MB, sin filtros por consulta). Lo correcto es tomar una **foto** filtrada y
versionada, y consumirla por `services/` con la misma firma que después va a tener el backend
real. El día que haya backend, ese mismo script pasa a ser la importación a la base y las
pantallas no cambian.

## Resumen de fases

| Fase | Qué se logra | Toca |
|---|---|---|
| 0 | Decisiones confirmadas y coberturas elegidas | Solo documentación |
| 1 | Dominio preparado para datos reales (`refesId`, `esPublica`, código RNAS) | `src/domain/` |
| 2 | Foto del REFES de CABA generada por script | `scripts/`, `src/mocks/data/` |
| 3 | 3 coberturas reales + relación cobertura ↔ sede cargada a mano | `src/mocks/` |
| 4 | Services con la regla de cobertura y búsqueda por cercanía | `src/services/` |
| 5 | Mapa real: GPS, filtros por tipo, tarjeta, lista ↔ mapa, atribución | `app/(paciente)/mapa.tsx`, Home |
| 6 | Georef en vivo en el alta de instituciones del admin | `app/(admin)/instituciones.tsx` |
| 7 | Verificación, documentación y limpieza | `CLAUDE.md`, `README.md` |

Detalle de cada una en [02-fases.md](02-fases.md).
