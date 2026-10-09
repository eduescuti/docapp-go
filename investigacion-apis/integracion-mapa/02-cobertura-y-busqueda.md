# 2. Cobertura y búsqueda

[← Volver al índice](README.md)

Cómo decide la app qué lugares ve cada paciente, y cómo los ordena por cercanía.

---

## 1. Decisiones (fase 0)

Confirmadas el 09/10/2026. Detalle en
[01-alcance-y-decisiones.md](../plan-integracion-apis/01-alcance-y-decisiones.md#respuestas).

| # | Pregunta | Respuesta |
|---|---|---|
| D1 | ¿Los hospitales públicos se ven para todos, sin importar la obra social? | **Sí.** En Argentina atienden a toda la población. Es la regla 15 de CLAUDE.md §10 |
| D2 | ¿Qué coberturas? | **OSDE 210, Swiss Medical SMG20 y Galeno Oro**, "de momento". Medifé queda sin relaciones |
| D3 | ¿Tipo "sanatorio"? | No: quedan como `clinica`. El nombre ya dice "Sanatorio" |
| D4 | ¿Las instituciones inventadas? | Se reemplazan por reales ([doc 1](01-dominio-y-datos-refes.md#5-reemplazo-de-las-instituciones-inventadas-d4)) |
| D5 | ¿Agrupar sedes de una misma red? | **No.** Cada sede es una dirección distinta, así el paciente sabe a dónde ir |
| D6 | ¿Dónde va la atribución del REFES? | Solo en Menú → Ayuda |

## 2. La regla 15

> Un establecimiento público (según el `origen_financiamiento` del REFES) se muestra a todos los
> pacientes, sin importar su cobertura. Los privados aparecen solo si aceptan el plan del
> paciente (regla 1).

En código, `src/services/institucionService.ts`:

```ts
export function aceptaCobertura(institucion: Institucion, planMedicoId: string): boolean {
  return institucion.origen === "publico" || institucion.planesAceptadosIds.includes(planMedicoId);
}
```

`listInstituciones({ planMedicoId })` y `buscarCentros(...)` usan esta función. Ninguna pantalla
filtra por su cuenta. Se adelantó de la fase 4 porque, sin ella, el mapa quedaba vacío hasta
cargar las cartillas.

## 3. `buscarCentros`: lo que usa el mapa

```ts
buscarCentros({
  planMedicoId,               // obligatorio
  tipos?: TipoInstitucion[],  // filtro por tipo
  cerca?: { latitud, longitud },  // ubicación real del paciente
  radioKm?: number,
  limite?: number,
}): Promise<CentroCercano[]>

interface CentroCercano {
  institucion: Institucion;
  sede: Sede;                 // la más cercana al paciente
  distanciaKm?: number;       // solo si hay ubicación
  motivo: "publica" | "cobertura";  // por qué lo ve (para la tarjeta)
}
```

Orden de los pasos: **cobertura → tipos → radio → orden por distancia → límite**. Sin
ubicación no se inventan distancias: se ordena por nombre. Con backend sería
`GET /instituciones?plan=&tipos=&lat=&lng=&radio=&limite=` y las pantallas no cambiarían.

La distancia se calcula con Haversine (`src/utils/geo.ts`).

## 4. ¿Qué ve cada obra social hoy?

| Cobertura | Lugares en el mapa | Por qué |
|---|---|---|
| OSDE 210 | 162 | Solo los públicos: 38 hospitales, 122 centros de salud y 2 laboratorios |
| Swiss Medical SMG20 | 162 | Ídem |
| Galeno Oro | 162 | Ídem |
| Medifé Plan 3000 | 162 | Ídem (y va a seguir así, por decisión D2) |

Si el paciente cambia de obra social en "Mi perfil", el contador del mapa pasa a decir el plan
nuevo, pero los lugares son los mismos. **Los privados (915) todavía no aparecen** porque no
tienen coberturas cargadas.

Cuando se haga la **fase 3**:

- OSDE, Swiss Medical y Galeno van a sumar sus sanatorios, clínicas y laboratorios.
- La tarjeta del mapa va a decir "Acepta OSDE 210" en lugar de "Público · atiende a todas las
  coberturas".
- Ni la pantalla ni el service cambian: solo se cargan los datos.

## 5. ¿Por qué no hay una API para la relación obra social ↔ hospital?

Resumen de [03-relacion-cobertura-establecimiento.md](../03-relacion-cobertura-establecimiento.md):

| Fuente | Qué trae | Qué no trae |
|---|---|---|
| REFES (lugares) | Nombre, dirección, coordenadas, público o privado | Qué obras sociales acepta |
| RNAS / RNEMP (coberturas) | Nombre, código oficial, contacto | Dónde atiende cada una |

No hay un dato en común para cruzarlos. La relación existe solo en las **cartillas** de cada
obra social (su buscador web o su PDF), que no tienen API pública. Por eso:

- **Hoy:** se anotan a mano, desde la cartilla pública, con la URL y la fecha
  (`FuenteCobertura`). Es la fase 3.
- **A futuro:** la cargan el admin, la propia institución o una integración con las obras
  sociales, en el backend. Las pantallas no se enteran del cambio.
- **Consultorios privados:** son miles por cobertura. Anotarlos a mano no es viable, así que
  quedan para el backend.

## 6. Listas largas

Con 1.077 instituciones hubo que acotar dos listas que antes mostraban todo:

| Pantalla | Antes | Ahora |
|---|---|---|
| Admin → Instituciones | Todas (dibujaba 1.077 tarjetas) | Las primeras 30. Las altas nuevas aparecen arriba. Cada una dice "Público: atiende a todas las coberturas", "Acepta: …" o "Sin obras sociales cargadas" |
| Menú → Mi plan médico | Todas las que cubre el plan | Las primeras 20 y "Y N más: miralas todas en el mapa" |
