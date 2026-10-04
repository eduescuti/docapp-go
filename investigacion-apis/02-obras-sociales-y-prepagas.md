# 2. Obras sociales y prepagas

[← Volver al índice](README.md)

## Las cuatro familias de cobertura

En Argentina la cobertura de salud se reparte en cuatro "familias", y **cada una tiene un
registro distinto**:

| Familia | Ejemplos | Quién las registra | ¿Listado descargable? |
|---|---|---|---|
| Obras sociales nacionales | OSDE, OSECAC, Unión Personal, OSPRERA | **RNAS**, en la Superintendencia de Servicios de Salud (SSSalud) | ✅ Sí, exporta a Excel |
| Prepagas | Swiss Medical, Galeno, Medifé, Omint | **RNEMP**, en la SSSalud | ⚠️ Solo búsqueda por nombre |
| PAMI | PAMI (INSSJP) | Propio | No aplica (es una sola entidad) |
| Obras sociales provinciales | IOMA (Bs. As.), APROSS (Córdoba), OSEP (Mendoza)… | Cada provincia | ❌ No hay listado nacional |

> OSDE figura en el RNAS como obra social nacional (código `400800`), aunque mucha gente la
> piensa como prepaga. Hay entidades que operan en las dos modalidades.

---

## RNAS: obras sociales nacionales ⭐

El **RNAS** (Registro Nacional de Agentes del Seguro, antes RNOS) es el registro oficial de
las obras sociales nacionales (Leyes 23.660 y 23.661).

**Cómo se obtiene:**

1. Página: [Agentes del Seguro (RNAS)](https://www.argentina.gob.ar/sssalud/agentes-del-seguro-rnas)
2. Link "Entidades inscriptas en el Registro Nacional de Agentes del Seguro (RNAS)", que lleva a
   `https://www.sssalud.gob.ar/?page=listRnosc&tipo=100`
3. Botón **"Exportar listado a Excel"**. En realidad es un formulario `POST` a
   `https://www.sssalud.gob.ar/descargas/dump.php` con `obj=listRnosc&tipo=100`, que devuelve
   un archivo de texto separado por tabulaciones, en codificación Latin-1, con 3 líneas de
   encabezado antes de los datos. Comando en [doc 6](06-como-reproducir.md#rnas).

**Resultado verificado (descarga del 03/10/2026):**

| Dato | Valor |
|---|---|
| Obras sociales | **366** |
| Columnas | `RNAS` (código oficial), `nombre`, `sigla`, `domicilio`, `localidad`, `cp`, `provincia`, `telefono`, `otros_telefonos`, `e_mail`, `web`, `habilita_opcion` |
| Con sigla | 249 |
| Con web | 186 |
| Sede central por provincia | CABA 237 · Buenos Aires 41 · Córdoba 25 · Santa Fe 23 · Mendoza 9 |

**Ejemplos:**

| Código RNAS | Nombre | Sigla |
|---|---|---|
| 400800 | OSDE - Organización de Servicios Directos Empresarios | OSDE |
| 126205 | Obra Social de los Empleados de Comercio y Actividades Civiles | OSECAC |
| 125707 | Obra Social Unión Personal de la Unión del Personal Civil de la Nación | OSPCN |
| 119302 | Obra Social del Personal Rural y Estibadores de la República Argentina | OSPRERA |
| 401704 | Obra Social de Empresarios, Profesionales y Monotributistas | OSDEPYM |
| 400909 | Acción Social de Empresarios | ASE |

**Sublistados útiles** (misma página, cambiando `tipo`): obras sociales que aceptan
monotributistas (`tipo=3`), personal de servicio doméstico (`tipo=1`), jubilados y pensionados
(`tipo=5`), sindicales (`tipo=7`), de personal de dirección (`tipo=10`), etc. Sirven si la app
quiere filtrar o explicar quién puede afiliarse a qué.

**Uso propuesto:** el **código RNAS** es el identificador estable de cada obra social en la base
de la app. El nombre oficial es largo, así que conviene guardar también un nombre corto para
mostrar (la sigla, o uno cargado a mano).

---

## RNEMP: prepagas

El **RNEMP** (Registro Nacional de Entidades de Medicina Prepaga) registra las prepagas
(Ley 26.682).

- Buscador: [Consulta de Empresas de Medicina Prepaga](https://www.sssalud.gob.ar/index.php?cat=consultas&page=bus_emp_padron)
- Solo permite **buscar por parte del nombre**. Probado: "SWISS" devuelve "SWISS MEDICAL S.A.".
- **No tiene exportación completa.** La página carga reCAPTCHA, aunque la búsqueda simple
  respondió sin pedirlo. No conviene automatizar consultas masivas.
- Las altas y bajas se publican como noticias en el sitio de la SSSalud (por ejemplo,
  "La Superintendencia dio de baja tres entidades del RNEMP").

**Uso propuesto:** cargar a mano las prepagas relevantes para la app (son pocas las grandes),
verificando cada una en el buscador.

---

## PAMI

PAMI (Instituto Nacional de Servicios Sociales para Jubilados y Pensionados) es una sola
entidad: se carga a mano como una cobertura más. Tiene su propio portal de datos
([datos.pami.org.ar](https://datos.pami.org.ar/dataset/listado-de-prestadores)), pero publica
solo **cantidades** de prestadores por región (UGL) y tipo de prestación, no el listado
nominal (ver [doc 3](03-relacion-cobertura-establecimiento.md)).

## Obras sociales provinciales

Cada provincia tiene la suya (IOMA, APROSS, OSEP, etc.) y no están en el RNAS. No encontré un
listado nacional. Se cargan a mano según el alcance geográfico de la app.

---

## Planes

**Ningún registro público lista los planes** de cada cobertura (OSDE 210, SMG20, Galeno Oro…).
En la app, `PlanMedico` (`frontend/src/domain/planMedico.ts`) tiene `nombre` + `aseguradora`, y
los planes se cargan a mano desde el panel de admin (ya existe esa pantalla).

---

## Datasets que parecen útiles pero no sirven

| Dataset | Por qué no sirve |
|---|---|
| [Padrón de beneficiarios de Obras Sociales Nacionales](https://datos.salud.gob.ar/dataset/padron-de-beneficiarios-de-obras-sociales-nacionales) | Solo totales de beneficiarios **por provincia** (25 filas). Última versión: 2019 |
| Cantidad de usuarios de empresas de medicina prepaga | Solo totales **por provincia**. Última versión: 2018 |
| Financiamiento de Obras Sociales Nacionales | Datos financieros, no catálogo |

## Validar la cobertura de una persona (para el futuro)

Sería útil verificar que la obra social que declara un paciente al registrarse es real. En el
sitio de la SSSalud aparece un acceso al **padrón de beneficiarios**, pero **requiere usuario**
(es para las propias obras sociales). No encontré una consulta pública por persona, y además
involucraría datos personales. Queda anotado como posibilidad futura, sin verificar.
