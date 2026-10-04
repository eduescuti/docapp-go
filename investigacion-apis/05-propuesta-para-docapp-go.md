# 5. Propuesta para DocApp Go

[← Volver al índice](README.md)

Cómo armar los datos de la app con lo encontrado en los documentos 1 a 4. **Es una propuesta:**
nada de esto está implementado todavía, y la sección 5 lista lo que hay que decidir antes.

## 1. Arquitectura de datos

```
REFES (CSV/XLSX semestral)
   │
   ▼
Script de importación (backend)
   ├─ filtra tipologías útiles (doc 1)
   ├─ geocodifica las que no tienen coordenadas (Georef → Google como respaldo)
   ├─ (opcional) enriquece con OpenStreetMap por ref:sisa_codigo
   └─ agrupa sedes en instituciones (cuando corresponde)
   │
   ▼
Tabla instituciones / sedes  (cada sede guarda su refes_id)

RNAS (Excel) + prepagas + PAMI + provinciales (manual)
   │
   ▼
Tabla aseguradoras / planes  (con código RNAS o RNEMP)

Relación cobertura ↔ institución
   ├─ públicos: automática (atienden a todos)
   └─ privados: carga del admin o de la institución
```

**Principios:**

- **El celular nunca descarga el REFES completo** (36.000 registros, 9 MB). El backend lo
  importa y la app pide solo lo que necesita, por ejemplo "instituciones a menos de 5 km que
  aceptan mi plan".
- **Guardar el `refes_id`** en cada sede. Con cada versión semestral del REFES se actualiza sin
  duplicar, y se detectan altas y bajas.
- **Guardar el código RNAS** en cada obra social nacional, por la misma razón.
- **Citar la fuente** en la app (pantalla "Acerca de" o en el mapa): "Fuente: Registro Federal
  de Establecimientos de Salud — Ministerio de Salud de la Nación", como pide la licencia CC BY
  4.0. Si se usa OpenStreetMap: "© colaboradores de OpenStreetMap".

## 2. Encaje con el modelo actual

| Hoy en la app (`frontend/src/domain/`) | Con datos reales |
|---|---|
| `Institucion { id, nombre, tipo, planesAceptadosIds, sedes }` | `tipo` sale de la tipología + financiamiento del REFES (doc 1). Habría que sumar algo como `esPublica` o `origenFinanciamiento` |
| `Sede { id, nombre, direccion, ciudad, latitud, longitud, telefono }` | Sumar `refesId`. El teléfono no viene en el REFES: sale de OSM o de carga manual (puede quedar vacío) |
| `PlanMedico { id, nombre, aseguradora }` | Conviene separar **Aseguradora** (con código RNAS/RNEMP) de **Plan** |
| `planesAceptadosIds` en cada institución | Para públicos: no hace falta (atienden a todos). Para privados: carga manual |

> Son cambios al dominio: se discuten antes de tocar código (CLAUDE.md §3).

## 3. Relación cobertura ↔ institución

Como no existe fuente pública ([doc 3](03-relacion-cobertura-establecimiento.md)):

1. **Públicos → visibles para todos los pacientes.** Sale automáticamente de
   `origen_financiamiento`. *Requiere confirmar la regla de negocio.*
2. **Privados → la relación se carga como dato propio:**
   - el **admin** desde el panel (el formulario "Obras sociales aceptadas" ya existe en
     `app/(admin)/instituciones.tsx`);
   - y/o la **propia institución** con su usuario. Es la regla #9 del CLAUDE.md: cada institución
     administra sus recursos. Haría falta un rol o permiso de "institución".
3. **Para la demo:** sembrar a mano unas pocas instituciones privadas reales (por ejemplo de
   CABA) con las coberturas que figuran en las cartillas públicas de 3 o 4 prepagas u obras
   sociales.
4. **A futuro:** integración con obras sociales, que ya figura en la "segunda etapa" del
   CLAUDE.md.

## 4. Próximo paso concreto (sin backend)

Mientras no haya backend, se puede generar con un script un **subconjunto real del REFES** y
guardarlo en `frontend/src/mocks/`. Por ejemplo: hospitales y clínicas de CABA con
coordenadas, unos 500 registros.

- El mapa de la app pasa a mostrar **establecimientos reales**.
- Las pantallas no cambian, porque siguen pasando por `services/`.
- Cuando exista el backend, ese mismo script se convierte en la importación a la base.
- Ojo con el tamaño del bundle: 500 registros están bien, el REFES completo no.

## 5. Decisiones pendientes

| # | Decisión | Opciones / comentario |
|---|---|---|
| 1 | **¿Los hospitales públicos se muestran a todos los pacientes**, sin importar la cobertura? | Recomendado: sí. Es una regla de negocio nueva para el CLAUDE.md §10 |
| 2 | **Alcance geográfico de la demo** | CABA (~1.400 establecimientos útiles con coordenadas) · AMBA · todo el país (~19.000) |
| 3 | **¿Qué coberturas se cargan con relaciones reales?** | Por ejemplo OSDE, Swiss Medical, Galeno y PAMI |
| 4 | **¿Subconjunto del REFES en mocks ya** o esperar al backend? | Recomendado: ya, para la demo del mapa |
| 5 | **Stack del backend** | Pendiente. Una base con soporte geográfico (p. ej. PostgreSQL + PostGIS) resuelve "más cercano" directo en la base |
| 6 | **Tipos de institución** | ¿Alcanza con hospital/clínica/centro médico/laboratorio, o se agrega `sanatorio`? (doc 1) |
| 7 | **Verificación real de matrículas (REFEPS)** | Requiere pedir credenciales del SISA. Para más adelante |
