# 6. Pendientes y riesgos

[← Volver al índice](README.md)

---

## 1. Lo que falta del plan

| Fase | Qué falta | Notas |
|---|---|---|
| 0.3 / 3 | **Relevar las cartillas** de OSDE, Swiss Medical y Galeno (sanatorios, clínicas y laboratorios de CABA) y cargarlas como `FuenteCobertura` | La cartilla de OSDE es pública y no pide login, pero un cartel de tutorial bloqueó la navegación automática. Sumar `registro` y `codigoOficial` a los planes (OSDE: RNAS 400800) |
| 4 | Que la reserva y la búsqueda de médicos respeten la regla de cobertura **de la sede** · `crearInstitucion` con `origen` | `buscarCentros` y `aceptaCobertura` ya están |
| 6 | **Georef** en el alta de instituciones del admin (dirección → coordenadas) y selector Público / Privado | API gratis y sin clave |
| 7 | Documentación final | El **mockup HTML** ya está al día (09/10/2026): mapa MapLibre, carrusel del Inicio, Turnos y Estudios nuevos, modo claro por defecto y componentes nativos GPS + push |

## 2. A confirmar

| Tema | Detalle |
|---|---|
| **Google Maps y la consigna** | CLAUDE.md decía que Google Maps era obligatorio. Confirmar con el docente si alcanza con MapLibre + "Cómo llegar" a Google Maps, o si exige el SDK dibujado en la app (en ese caso, sumarlo para la app compilada con clave propia) |
| FFAA/Seguridad como `seguridad_social` | Decisión tomada al ver los datos (buques, cuarteles). Si se prefiere mostrar los hospitales militares a todos, se cambia en el script |
| Centros públicos internos | Algunos "centros" públicos son servicios internos (por ejemplo el CENARD o consultorios de un ministerio). Si molestan, se pueden excluir con una lista en el script |

## 3. Riesgos

| Riesgo | Mitigación |
|---|---|
| OpenFreeMap **no garantiza disponibilidad** | La URL está en una constante (`ESTILOS_URL`). Alternativas con plan gratis: MapTiler o Stadia (con clave). Si falla, la pantalla ofrece la lista |
| El mapa y el visor de PDF dependen de **CDNs** (unpkg, cdnjs) y de internet | Versiones fijas (MapLibre 5.24.0, pdf.js 3.11.174). A futuro se pueden incluir en la app |
| `react-native-maps` sigue instalado sin usarse | Queda por si se exige Google para la app compilada. Si no, se puede desinstalar |
| `app.config.ts` todavía tiene la configuración de la clave de Google | No molesta (sin `.env` queda vacía). La documentación actual de Expo la pone en el plugin `react-native-maps` (`androidGoogleMapsApiKey`) |
| Datos del REFES de diciembre de 2025 | Regenerar con el script cuando salga una versión nueva ([doc 1](01-dominio-y-datos-refes.md#6-cómo-regenerar-los-datos)) |
| Médicos de prueba en lugares reales | Son ficticios: solo para la demo |
