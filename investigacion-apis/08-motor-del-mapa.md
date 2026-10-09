# 8. Motor del mapa: qué usar para que funcione en todos lados

[← Volver al índice](README.md)

- **Fecha:** 09/10/2026
- **Pregunta:** el mapa del celular (Google Maps con `react-native-maps`) se ve negro en Expo
  Go. ¿Qué opciones hay para tener un mapa que funcione en **Expo Go, web y la app compilada**,
  que se pueda **diseñar** y que sea **estándar en la industria**, todo desde el frontend?

---

## 1. Por qué hoy no anda en Expo Go

No es un error de nuestro código ni del celular (un Samsung Galaxy A54 con Google Play Services,
en el que la app de Google Maps funciona bien).

- **Expo Go para Android trae una clave de Google Maps propia que está vencida** en las versiones
  55, 56 y 57. El mapa se ve negro, con el logo de Google y sin calles. El log de Android dice
  "Authorization failure". Reportado para SDK 57 y **todavía abierto**:
  [expo/expo #49323](https://github.com/expo/expo/issues/49323).
- Según el mismo reporte, **Expo Go usa la clave de Expo, no la nuestra**, así que ninguna
  configuración de `app.config.ts` lo arregla.
- En [react-native-maps #5888](https://github.com/react-native-maps/react-native-maps/issues/5888)
  el autor cuenta que el equipo de Expo Go **dejó de dar soporte a Google Maps dentro de Expo
  Go**. La única salida con Google es compilar la app propia (development build), con nuestra
  clave.
- La documentación de Expo todavía dice que en Expo Go "no hace falta configuración": está
  desactualizada.

## 2. ¿Podemos dibujar el mapa nosotros?

Un mapa digital tiene cuatro capas. Solo la última se "diseña":

| Capa | Qué es | ¿La hacemos nosotros? |
|---|---|---|
| **Datos** | Calles, alturas, parques, ríos, nombres | No. Lo tienen Google, Apple, HERE, TomTom u **OpenStreetMap** (abierto). Relevar una ciudad es imposible para un proyecto |
| **Teselas** | Los datos cortados en cuadraditos por zoom (imágenes o vectores) | No. Las sirve un proveedor (Google, Mapbox, MapTiler, OpenFreeMap…) |
| **Motor** | La librería que dibuja las teselas, hace zoom y pone marcadores | No. Google Maps SDK, MapLibre, Mapbox, Leaflet… |
| **Estilo** | Colores, tipografías, qué se muestra y qué se esconde, marcadores | **Sí.** Esto es lo que hace que un mapa "se vea distinto" |

Dibujar las calles a mano (por ejemplo un SVG de CABA) no da zoom real ni detalle, es mucho
trabajo y **no lo hace nadie en la industria**. Lo estándar es elegir un motor y **diseñar el
estilo**.

## 3. Cómo lo hace Mercado Libre

Lo verifiqué el 09/10/2026 abriendo el mapa de alquileres de
[inmuebles.mercadolibre.com.ar](https://inmuebles.mercadolibre.com.ar/departamentos/alquiler/capital-federal/_DisplayType_M)
y mirando los pedidos de red: carga `maps.googleapis.com/maps/api` y el mapa tiene la clase
`.gm-style`, o sea que **es Google Maps** (versión web, Maps JavaScript API).

Se ve distinto porque Google permite **cambiar el estilo** (colores apagados, menos lugares de
interés) y poner **marcadores propios** (las "pastillas" con el precio). No encontré una fuente
pública sobre qué usa la app del celular, así que eso queda sin confirmar.

Así trabajan las apps grandes: casi ninguna dibuja su mapa. Usan un motor (Google, Mapbox o
MapLibre) y le aplican **su** estilo.

## 4. Las opciones, comparadas

| Opción | Expo Go | Web | App compilada | Clave / costo | Diseño | Estándar |
|---|---|---|---|---|---|---|
| **A. Google Maps nativo** (`react-native-maps`, lo de hoy) | ❌ Clave de Expo Go vencida | ❌ No tiene versión web | ✅ Con clave propia | Clave de Google Cloud + cuenta de facturación. Los mapas en el celular no se cobran | Medio: estilo JSON (colores, esconder capas) y marcadores propios | Muy alto |
| **B. Google Maps web en un WebView** (Maps JavaScript API) | ✅ | ✅ | ✅ | Clave + facturación. 10.000 cargas gratis por mes, después pago. La clave queda expuesta en el código | Medio, igual que A | Alto |
| **C. MapLibre + OpenFreeMap en un WebView** | ✅ | ✅ | ✅ | **Sin clave y gratis**, sin límite de vistas. Sin garantía de servicio (SLA) | **Total**: mapa vectorial, cada capa (agua, parques, calles, textos) se colorea con los tokens de nuestro tema | Alto: motor abierto que recomienda AWS, con Meta y Microsoft como sponsors |
| **D. Leaflet + teselas en imagen** (OpenStreetMap o CARTO) | ✅ | ✅ | ✅ | Sin clave. El servidor de OpenStreetMap **prohíbe** el uso intensivo desde apps sin permiso | Bajo en el mapa (las calles vienen "pintadas" en imágenes, solo se elige entre los estilos del proveedor). Marcadores 100 % libres | Muy usado en web, tecnología más vieja (raster) |
| **E. MapLibre o Mapbox nativos** (`@maplibre/maplibre-react-native`, `@rnmapbox/maps`) | ❌ Necesitan development build | ⚠️ Otra librería | ✅ | MapLibre gratis; Mapbox con token y plan gratuito limitado | Total | Alto |
| **F. Dibujarlo nosotros** | ✅ | ✅ | ✅ | Gratis | Total, pero sin zoom ni detalle real | ❌ No es estándar |

**Qué es MapLibre:** el motor de mapas vectoriales de código abierto (licencia BSD) que nació
cuando Mapbox cerró su librería en 2020. AWS lo recomienda como motor de Amazon Location Service
([AWS](https://docs.aws.amazon.com/location/latest/developerguide/dev-maplibre.html)), y Meta y
Microsoft son sponsors y tienen asiento en su consejo asesor
([Meta](https://maplibre.org/news/2022-08-26-meta-announcement/),
[The New Stack](https://thenewstack.io/maplibre-how-a-fork-became-a-thriving-open-source-project/)).

**Qué es OpenFreeMap:** teselas vectoriales de OpenStreetMap listas para MapLibre. "Completely
free", sin registro ni claves, uso comercial permitido; exige mostrar la atribución y **no da
garantía de disponibilidad** ([openfreemap.org](https://openfreemap.org/)). Trae estilos base
(Positron, Bright, Liberty, Dark, Fiord) que se pueden modificar.

**Leaflet vs. MapLibre:** los dos se pueden personalizar, pero no de la misma forma. Con Leaflet
el mapa de fondo es una imagen ya dibujada por el proveedor: se elige entre sus estilos, pero no
se cambia, por ejemplo, el color de las avenidas. Con MapLibre el mapa llega como datos y el
estilo es un JSON que controlamos nosotros (hay editor visual: Maputnik). Para "diseñar el mapa"
como pide la app, MapLibre es mejor.

## 5. El punto a confirmar: Google Maps y la consigna

El CLAUDE.md dice que Google Maps es **requisito obligatorio de la materia**, y en la entrega del
Sprint 1 figura como uno de los dos componentes nativos (consigna 1.4: "al menos 2, con
justificación técnica"). Con un mapa en WebView:

- El mapa deja de ser un componente nativo. Los dos componentes nativos pasarían a ser **GPS**
  (`expo-location`, que usa el mapa igual) y **notificaciones push** (`expo-notifications`, ya
  planificado como tercero).
- "Cómo llegar" sigue abriendo **la app de Google Maps** con la ruta: la integración con Google
  se mantiene.
- Si el docente exige el SDK de Google Maps dibujado en la app, se puede **sumar** la opción A
  para la app compilada (con clave propia) sin rehacer nada: la pantalla, los filtros, la tarjeta
  y la lista son los mismos, solo cambia el componente que dibuja el mapa.

## 6. Recomendación

**Opción C: MapLibre + OpenFreeMap**, en un WebView en el celular y en un `<iframe>` en web (la
excepción a "sin etiquetas HTML" ya está aprobada, limitada a `mapa.web.tsx`).

- Es **la única que funciona hoy en los tres entornos** sin claves ni facturación.
- Es un estándar abierto de la industria y permite **diseñar el mapa con los colores de la app**:
  claro (tema A) y oscuro (tema C).
- Todo queda en el frontend. El estilo es un JSON nuestro.
- Riesgos y cómo se cubren:
  - **OpenFreeMap sin garantía de servicio.** El estilo apunta a una URL configurable: si se cae,
    se cambia a MapTiler o Stadia (tienen plan gratuito con clave) sin tocar la pantalla.
  - **Rendimiento del WebView.** Los ~160 marcadores públicos se dibujan dentro de MapLibre como
    una sola capa, no como componentes de React. Probado en el A54 antes de dar la fase por
    terminada.
  - **Consigna.** Confirmar con el docente si el mapa tiene que ser el SDK de Google (ver punto 5).

## Fuentes

- [expo/expo #49323 — Expo Go SDK 57: mapa negro, clave vencida](https://github.com/expo/expo/issues/49323)
- [react-native-maps #5888 — Google Maps en blanco en Expo Go](https://github.com/react-native-maps/react-native-maps/issues/5888)
- [Expo — react-native-webview (incluido en Expo Go)](https://docs.expo.dev/versions/v57.0.0/sdk/webview/)
- [MapLibre React Native — requiere development build](https://maplibre.org/maplibre-react-native/docs/setup/expo)
- [OpenFreeMap](https://openfreemap.org/)
- [OSM — política de uso de teselas](https://operations.osmfoundation.org/policies/tiles/)
- [Google — Maps SDK for Android, uso y facturación](https://developers.google.com/maps/documentation/android-sdk/usage-and-billing)
- [Google — estilos de mapa en Android](https://developers.google.com/maps/documentation/android-sdk/styling)
- [AWS — MapLibre en Amazon Location Service](https://docs.aws.amazon.com/location/latest/developerguide/dev-maplibre.html)
- [MapLibre — Meta como sponsor](https://maplibre.org/news/2022-08-26-meta-announcement/)
