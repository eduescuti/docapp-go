# 3. Relación cobertura ↔ establecimiento

[← Volver al índice](README.md)

Es el dato **más importante** de la app: saber qué hospitales, clínicas y laboratorios acepta
cada obra social o prepaga. Y es el único que **no existe como dato público**.

## Lo que busqué y qué encontré

### Cartillas presentadas a la Superintendencia

- La [Resolución 2165/2021 SSSalud](https://www.argentina.gob.ar/normativa/nacional/norma-358669/texto)
  obliga a las obras sociales nacionales a presentar su **cartilla médico-asistencial**.
- La cartilla tiene cuatro anexos:
  - **Anexo I:** Programa Médico Obligatorio (prestaciones básicas que tiene que cubrir).
  - **Anexo II:** requisitos para acceder a las prestaciones.
  - **Anexo III: listado nominal de prestadores**, agrupados geográficamente y separados en
    guardias, profesionales por especialidad, sanatorios de internación, estudios y
    tratamientos, farmacias, ópticas, etc.
  - **Anexo IV:** prestadores de discapacidad (Ley 24.901).
- Se presenta por **Trámite a Distancia (TAD)**, 90 días antes del inicio del ejercicio
  ([trámite "Presentar cartilla médico asistencial"](https://www.argentina.gob.ar/servicio/presentar-cartilla-medico-asistencial)).
  Con la cartilla presentada, la obra social queda habilitada para recibir opciones de cambio.

**Resultado:** el Anexo III es exactamente el dato que necesitamos, pero **la SSSalud lo recibe
como trámite interno y no lo publica** como datos abiertos ni por API.

### Cartillas de cada obra social o prepaga

- Cada entidad publica su cartilla en su web: buscador online o PDF, **cada una con formato
  distinto**.
- **No encontré API pública para desarrolladores** de OSDE, Swiss Medical, Galeno ni otras.
- Leer automáticamente esas webs (scraping):
  - es frágil, porque cada cambio de diseño del sitio lo rompe;
  - puede violar los términos de uso de cada sitio;
  - en una app médica, mostrar una cartilla desactualizada es un riesgo real para el paciente.
  
  **No se recomienda.**

### Registro Nacional de Prestadores (SSSalud)

- Dataset: "Registro Nacional de Prestadores de Establecimientos de Salud Inscriptos" (datos
  abiertos de Salud). Última versión: agosto 2019, ~3.500 registros.
- Columnas: `tipo`, `denominacion`, `disposicion`, `calle`, `localidad`, `jurisdiccion_id`,
  `jurisdiccion_nombre`, `vencimiento`.
- Lista prestadores habilitados para trabajar con obras sociales, pero **no dice con cuáles
  trabaja cada uno**. Además está desactualizado y no tiene coordenadas.

### PAMI

- [Datos abiertos PAMI — Listado de prestadores](https://datos.pami.org.ar/dataset/listado-de-prestadores):
  solo **cantidades** de prestadores por UGL (región) y por tipo de prestación (versión agosto
  2026). No hay listado nominal.
- La cartilla de PAMI es un buscador en su web para afiliados (por especialidad, nombre,
  institución o cercanía), sin API pública.

### OpenStreetMap

- En CABA, de 421 establecimientos de salud mapeados, **solo 1** tiene alguna etiqueta de
  seguros. No sirve para coberturas (ver
  [doc 4](04-mapas-geocodificacion-y-otras-fuentes.md#openstreetmap)).

## Lo que sí sale de los datos: los hospitales públicos

En Argentina los **hospitales públicos atienden a toda la población**, tenga o no cobertura.
Además, el régimen de Hospitales Públicos de Gestión Descentralizada (Decreto 939/2000,
[Res. 487/2002](https://www.argentina.gob.ar/normativa/nacional/resolución-487-2002-77280/texto))
les permite **facturar a la obra social** la atención que le dan a sus afiliados.

El REFES indica qué establecimientos son públicos (`origen_financiamiento`: Provincial,
Municipal, Nacional, Universitario público, FFAA/Seguridad). Por eso **una parte de la relación
cobertura ↔ establecimiento sale automáticamente**: un hospital público le sirve a cualquier
paciente.

> Esto implica una **regla de negocio nueva** que hoy no está en el CLAUDE.md. Hay que
> confirmarla antes de implementarla (ver
> [doc 5, decisiones](05-propuesta-para-docapp-go.md#5-decisiones-pendientes)).

## Conclusión

| Tipo de establecimiento | ¿Cómo se sabe qué coberturas acepta? |
|---|---|
| **Público** (≈ 12.200 en el REFES, sin contar penitenciarios) | Atiende a todos: sale de `origen_financiamiento` |
| **Privado** (≈ 23.500 en el REFES, incluye seguridad social y mutuales) | **No hay fuente pública.** Lo carga el admin o la propia institución |

Las alternativas para los privados están en [doc 5](05-propuesta-para-docapp-go.md#3-relación-cobertura--institución).
