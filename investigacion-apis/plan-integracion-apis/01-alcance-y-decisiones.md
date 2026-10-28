# 1. Alcance y decisiones

[← Volver al plan](README.md)

## 1. Qué entra

| Tema | Alcance para este sprint |
|---|---|
| Geografía | **Solo CABA** (`provincia_id = 02` en el REFES) |
| Establecimientos | Hospitales públicos, clínicas/sanatorios privados con internación, centros médicos/consultorios y laboratorios con coordenadas. **1.077 sedes** generadas el 09/10/2026 (sin geriátricos: ver Fase 2 en [02](02-fases.md)) |
| Centros médicos sin internación | **Entran** (cambio del 09/10/2026: el usuario quiere ver también consultorios y centros médicos). Son ~739 más en CABA, con el tipo `centro_medico` que ya existe. Mismo criterio de cobertura que el resto |
| Coberturas | **3**, elegidas de las que ya existen en los mocks para no romper usuarios de prueba (propuesta abajo) |
| Relación cobertura ↔ sede | Públicos: automática. Privados: **10 a 15 sedes por cobertura**, cargadas a mano desde la cartilla pública de cada una |
| APIs en vivo desde el celular | Google Maps (SDK nativo, ya está), **Georef** (geocodificación, gratis, sin clave) y GPS del dispositivo (`expo-location`) |
| Backend | **No se toca.** Todo vive en `frontend/` |

## 2. Qué NO entra (y por qué)

| Queda afuera | Motivo |
|---|---|
| Descargar el REFES desde la app | 9 MB, certificado SSL incompleto, sin filtro por consulta. Se usa una foto generada por script |
| Google Places | Pago, no sabe de coberturas y no hace falta (doc 4) |
| Scraping de cartillas | Frágil, puede violar términos de uso y es riesgoso mostrar cartillas viejas (doc 3) |
| Prepagas completas (RNEMP) y PAMI | No hay listado descargable. Se cargan solo las 3 elegidas |
| AMBA / resto del país | Se escala cambiando el filtro del script cuando exista backend |
| Persistir cambios del admin | Sigue en memoria hasta que haya base de datos |

## 3. Coberturas propuestas

| `id` en la app (se mantiene) | Cobertura | Registro | Código | Por qué |
|---|---|---|---|---|
| `plan-osde210` | OSDE 210 | RNAS (obra social nacional) | `400800` | La más conocida, cartilla pública por buscador |
| `plan-swiss` | Swiss Medical SMG20 | RNEMP (prepaga) | — | Representa a las prepagas, red propia de sanatorios en CABA |
| `plan-galeno` | Galeno Oro | RNEMP (prepaga) | — | Red propia (Sanatorio Trinidad), contraste visible en el mapa |

`plan-medife` queda en el catálogo pero **sin relaciones cargadas**: sirve para mostrar en la
demo que un paciente con esa cobertura solo ve hospitales públicos (estado vacío honesto).

> Con 3 coberturas alcanza para que la demo muestre lo importante: **cambiar de obra social
> cambia el mapa**.

## 4. Decisiones a confirmar antes de programar

Son reglas de negocio nuevas o cambios al dominio: según CLAUDE.md §3 se confirman antes de
tocar código.

| # | Decisión | Recomendación | Impacto si se elige otra cosa |
|---|---|---|---|
| D1 | ¿Los **hospitales públicos** se muestran a **todos** los pacientes, sin importar la cobertura? | **Sí.** En Argentina atienden a toda la población (doc 3). Sumar como regla #15 en CLAUDE.md §10 | Si no: el mapa de cada cobertura queda casi vacío |
| D2 | ¿Las **3 coberturas** de la tabla de arriba? | Sí, OSDE + Swiss Medical + Galeno | Cambian solo los datos de la Fase 3 |
| D3 | ¿Se agrega el tipo **`sanatorio`** o se sigue con `clinica`? | Seguir con `clinica` en este sprint (menos cambios). Mostrar "Sanatorio" cuando el nombre lo diga | Si se agrega: tocar `TipoInstitucion`, chips y colores |
| D4 | ¿Se dejan las instituciones inventadas actuales (Centro Médico Norte, Los Arcos…)? | **No:** se reemplazan por sedes reales. Los médicos mock se reasignan a sedes reales | Si se dejan: mezclar datos reales y ficticios confunde en la demo |
| D5 | ¿Se agrupan las sedes de una misma institución (p. ej. Hospital Italiano y sus centros)? | En la foto de CABA, agrupar **solo** los casos conocidos con una tabla manual chica (≤ 10 instituciones). El resto: 1 institución = 1 sede | Agrupar por nombre automáticamente da falsos positivos |
| D6 | ¿Dónde se muestra la **atribución** del REFES (licencia CC BY 4.0)? | En el mapa (texto chico) y en Menú → Ayuda | Es obligatoria por licencia |

### Respuestas

| # | Estado | Respuesta |
|---|---|---|
| D1 | ✅ 09/10/2026 | Sí: los hospitales públicos se muestran a todos los pacientes. Sumada como regla #15 en CLAUDE.md §10 |
| D2 | ✅ 09/10/2026 | OSDE 210 + Swiss Medical SMG20 + Galeno Oro, "de momento". Medifé queda sin relaciones. La relación obra social ↔ hospital se guarda como dato propio (`FuenteCobertura`) para que a futuro pueda venir de una integración con las obras sociales sin tocar las pantallas |
| D3 | ✅ 09/10/2026 | Los sanatorios quedan como `clinica`. El nombre ya dice "Sanatorio" |
| D4 | ✅ 09/10/2026 | Se reemplazan por sedes reales del REFES. Los médicos, turnos y favoritos mock se reasignan a esas sedes |
| D5 | ✅ 09/10/2026 | **No se agrupa nada:** cada establecimiento del REFES es una institución con una sede, es decir, una dirección. Así el paciente ve en el mapa a dónde tiene que ir exactamente |
| D6 | ✅ 09/10/2026 | La atribución del REFES va **solo en Menú → Ayuda**, no en el mapa |

> **27/10/2026:** D2 y la Fase 3 se redefinieron. La cobertura pasa a ser obra social + planes opcionales,
> el catálogo crece a 29 obras sociales y el seed son 9 instituciones verificadas contra sus webs (no 10–15
> por cobertura). Ver `DocApp Go (backend)/docs/08-coberturas.md`.

## 5. Riesgos

| Riesgo | Mitigación |
|---|---|
| Relación cobertura ↔ sede cargada a mano queda vieja | Cada relación guarda `verificadoEl` y `fuente` (URL de la cartilla). En la tarjeta se muestra "Cobertura informada por la cartilla de X al dd/mm/aaaa" |
| ~1.400 marcadores hacen lento el mapa en Android | Renderizar solo los de la región visible (tope 150), `tracksViewChanges={false}`, filtros por tipo |
| El paciente niega el permiso de ubicación | Centro por defecto en el Obelisco (-34.6037, -58.3816) y aviso no bloqueante |
| Georef caído o lento | Timeout de 6 s, error claro y carga manual de lat/lng como respaldo (ya existe) |
| Bundle pesado | JSON compacto (claves cortas o solo campos usados). Objetivo < 350 KB |
| Falta la API key de Google Maps | Va en `.env` / `app.config` (nunca commiteada, CLAUDE.md §11). Para un build propio (development build / APK) la key es obligatoria; verificar en la Fase 5 si Expo Go alcanza para la demo |
