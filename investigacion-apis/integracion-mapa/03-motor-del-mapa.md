# 3. Motor del mapa

[← Volver al índice](README.md)

Por qué el mapa dejó de ser Google Maps y cómo funciona el actual. La comparación completa de
opciones está en [08-motor-del-mapa.md](../08-motor-del-mapa.md).

---

## 1. El problema: Google Maps en Expo Go

En el celular (Samsung Galaxy A54, con Google Play Services y la app de Google Maps funcionando),
el mapa se veía **negro, con el logo de Google y sin calles ni marcadores**.

- **Causa:** Expo Go para Android trae una clave de Google Maps propia que está **vencida** en
  las versiones 55, 56 y 57. El log de Android dice "Authorization failure".
- **Reportado** para SDK 57 y abierto: [expo/expo #49323](https://github.com/expo/expo/issues/49323).
  Según [react-native-maps #5888](https://github.com/react-native-maps/react-native-maps/issues/5888),
  Expo Go dejó de dar soporte a Google Maps.
- **No se arregla desde el proyecto:** Expo Go usa su clave, no la nuestra.
- La documentación de Expo todavía dice que en Expo Go "no hace falta configuración": está
  desactualizada.

## 2. La decisión

**MapLibre GL JS + OpenFreeMap**, decidido el 09/10/2026.

| Criterio | Cómo lo cumple |
|---|---|
| Funciona en Expo Go, web y app compilada | MapLibre es una librería web: corre dentro de un WebView (celular) o un `<iframe>` (web). `react-native-webview` viene incluido en Expo Go |
| Sin claves ni facturación | OpenFreeMap es gratis, sin registro ni límite de vistas |
| Diseñable | El mapa llega como datos vectoriales y cada capa se pinta con los colores de la app |
| Estándar | MapLibre es el motor abierto que recomienda AWS, con Meta y Microsoft como sponsors |
| Solo frontend | No hace falta backend |

Lo que implica para la entrega del Sprint 1:

- El mapa dejó de ser un componente nativo. Los dos componentes nativos de la consigna 1.4 pasan
  a ser **GPS** (`expo-location`) y **notificaciones push** (`expo-notifications`, planificado).
- "Cómo llegar" sigue abriendo **la app de Google Maps** con la ruta.
- **A confirmar con el docente:** CLAUDE.md decía que Google Maps era obligatorio. Si lo exige, se
  suma para la app compilada (con clave propia) sin rehacer la pantalla. `react-native-maps` sigue
  instalado para eso.

## 3. Cómo está armado

```
app/(paciente)/mapa.tsx  ──props──►  MapaCentros
                                        │
              ┌─────────────────────────┴─────────────────────────┐
     MapaCentros.tsx (Android/iOS)                    MapaCentros.web.tsx (web)
     <WebView source={{ html, baseUrl }}>             <iframe srcDoc={html}>
              └─────────────┬─────────────────────────────────────┘
                            ▼
                mapaHtml.ts → página HTML con MapLibre GL JS
                            ▲
                usePuenteMapa.ts → mensajes en las dos direcciones
```

| Archivo (`src/components/mapa/`) | Qué hace |
|---|---|
| `tipos.ts` | Props (`MapaCentrosProps`), `PuntoMapa`, mensajes y su validación |
| `mapaHtml.ts` | Arma la página: carga MapLibre, el estilo, repinta con el tema, capas de marcadores y ubicación |
| `usePuenteMapa.ts` | Lógica compartida: manda datos cuando el mapa está listo, traduce lo que responde, tiempo de espera |
| `MapaCentros.tsx` | Versión con WebView (Android/iOS) |
| `MapaCentros.web.tsx` | Versión con `<iframe>` (web). Única excepción, junto con el visor de PDF, a "sin etiquetas HTML" |

### Mensajes

La página del mapa no conoce la app: solo recibe y manda mensajes JSON.

| Dirección | Mensaje | Para qué |
|---|---|---|
| App → mapa | `puntos` | Los centros a dibujar (`id`, coordenadas, tipo) |
| App → mapa | `seleccion` | Resaltar un centro y centrarlo arriba de la tarjeta |
| App → mapa | `ubicacion` | El punto del paciente (o ninguno) |
| App → mapa | `volar` | Mover la cámara (ubicación propia, "Más cercano") |
| App → mapa | `margenes` | Subir la atribución para que las tarjetas de abajo no la tapen |
| Mapa → app | `listo` | El estilo cargó: ya se pueden mandar datos |
| Mapa → app | `seleccion` | El paciente tocó un centro (o el fondo: `null`) |
| Mapa → app | `error` | No se pudo descargar MapLibre |

Lo que llega del mapa se valida (`parsearMensajeDelMapa`) antes de usarlo. En web solo se aceptan
mensajes del propio iframe.

## 4. Decisiones técnicas

| Decisión | Por qué |
|---|---|
| **MapLibre 5.24.0** desde unpkg | La versión 6 viene solo como módulos ES con el *worker* en un archivo aparte, que no se puede crear desde un WebView con HTML en línea. La 5 trae todo en un archivo y crea el worker desde un Blob |
| WebView con `baseUrl: "https://localhost/"` | Con HTML en línea el origen es "nulo" y Android puede bloquear el worker. No se pide nada a esa dirección |
| Links de la atribución | Se abren en el navegador del sistema (`onShouldStartLoadWithRequest`), no dentro del mapa |
| Estilo base de OpenFreeMap, repintado | Se toma `positron` (claro) o `dark` (oscuro) y se repinta **por categoría de capa** (agua, parques, manzanas, edificios, calles, avenidas, textos), no por id. Así sirve aunque cambien los estilos |
| Marcadores como **una capa de círculos** de MapLibre | No son componentes de React: 1.000 puntos no traban el mapa y no hace falta tope |
| Toque con tolerancia de 14 px | Un dedo es más grande que un marcador. Se elige el más cercano al toque |
| Sin rotación ni inclinación | Mapa simple, siempre con el norte arriba |
| Tiempo de espera de 15 s | Si no llega `listo`, la pantalla ofrece la lista. Si después carga, el aviso se va solo |
| URL del proveedor en una constante (`ESTILOS_URL`) | Si OpenFreeMap deja de andar, se cambia una línea (MapTiler y Stadia tienen plan gratis con clave) |
| Modo vista previa (`interactivo={false}`) | Para el Inicio: sin gestos, zoom 12 y la atribución plegada en el ícono "i" |

## 5. Colores (`theme.mapa`)

Están en `src/theme/tokens.ts`, tipados en `ThemeMapa`, para los tres temas. Nunca hay colores
sueltos en la pantalla.

| Token | Tema A (claro) | Tema C (oscuro) |
|---|---|---|
| `estiloBase` | `positron` | `dark` |
| `tierra` | `#F8FAFC` | `#020617` |
| `agua` | `#CFE6F5` | `#0C2236` |
| `parque` | `#DDF0E3` | `#0B2A22` |
| `calle` / `avenida` | `#FFFFFF` / `#FFFFFF` | `#1E293B` / `#334155` |
| `texto` | `#64748B` | `#94A3B8` |
| `ubicacion` | `#0284C7` | `#38BDF8` |
| `hospital` | `#DC2626` | `#F87171` |
| `clinica` | `#0284C7` | `#38BDF8` |
| `centroMedico` | `#0D9488` | `#10B981` |
| `laboratorio` | `#9333EA` | `#C084FC` |

Los colores de hospital, clínica y laboratorio del tema A son los del mockup HTML. Al cambiar de
tema, la página del mapa se recarga con los colores nuevos.

## 6. Ubicación (`useUbicacion`)

`src/hooks/useUbicacion.ts`, con `expo-location`:

- `pedirPermiso: true` en el mapa (muestra el aviso del sistema) y `false` en el Inicio (usa la
  ubicación solo si el permiso ya estaba dado).
- Primero devuelve la última posición conocida (instantánea) y después la actual, más precisa.
- Estados: `cargando` · `concedida` · `denegada` · `error`. Si no hay permiso, la cámara arranca en
  el **Obelisco** (`CENTRO_CABA`) y la pantalla avisa sin bloquear.
- El texto del permiso para la app compilada está en `app.config.ts`
  (`locationWhenInUsePermission`).

## 7. Atribuciones

| Qué | Dónde |
|---|---|
| OpenFreeMap, OpenMapTiles y OpenStreetMap (obligatorio por licencia) | En el mapa, abajo a la izquierda, por encima de las tarjetas |
| REFES, Ministerio de Salud (CC BY 4.0, decisión D6) | Menú → Ayuda → "Datos y fuentes", con la versión del archivo |
