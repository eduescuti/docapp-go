import type { Coordenada } from "@/hooks/useUbicacion";
import type { ThemeMapa } from "@/theme";

/**
 * Página que dibuja el mapa con MapLibre GL JS dentro de un WebView (celular) o un iframe (web).
 * Es la única parte de la app escrita en HTML: MapLibre es una librería web (decisión del
 * 09/10/2026, ver `DocApp Go/investigacion-apis/08-motor-del-mapa.md`).
 *
 * - Motor: MapLibre GL JS 5.x (la 6 viene solo como módulos ES con un worker aparte, que no
 *   funciona en un WebView con HTML en línea).
 * - Teselas: OpenFreeMap, gratis y sin clave. Si el servicio cambia, alcanza con tocar `ESTILOS_URL`.
 * - El estilo base se repinta con los colores del tema (`theme.mapa`).
 */
const MAPLIBRE_VERSION = "5.24.0";
const MAPLIBRE_CDN = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist`;
const ESTILOS_URL = "https://tiles.openfreemap.org/styles/";
const ZOOM_INICIAL = 13;
// La vista previa es chica: se abre un poco más para que se vean varios centros.
const ZOOM_VISTA_PREVIA = 12;

interface OpcionesHtml {
  colores: ThemeMapa;
  centro: Coordenada;
  /** false: vista previa sin gestos (Inicio). */
  interactivo: boolean;
}

export function crearHtmlMapa({ colores, centro, interactivo }: OpcionesHtml): string {
  // "<" escapado para que ningún valor pueda cerrar el <script>.
  const config = JSON.stringify({
    estiloUrl: ESTILOS_URL + colores.estiloBase,
    colores,
    centro: [centro.longitud, centro.latitud],
    zoom: interactivo ? ZOOM_INICIAL : ZOOM_VISTA_PREVIA,
    interactivo,
  }).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="${MAPLIBRE_CDN}/maplibre-gl.css">
<style>
  html, body, #mapa { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${colores.tierra}; }
  .maplibregl-ctrl-attrib { font: 10px/1.4 sans-serif; }
</style>
</head>
<body>
<div id="mapa"></div>
<script src="${MAPLIBRE_CDN}/maplibre-gl.js"></script>
<script>
(function () {
  var CONFIG = ${config};
  var C = CONFIG.colores;

  function enviar(mensaje) {
    var texto = JSON.stringify(mensaje);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(texto);
    else if (window.parent !== window) window.parent.postMessage(texto, "*");
  }

  if (!window.maplibregl) {
    enviar({ tipo: "error", detalle: "No se pudo descargar el motor del mapa." });
    return;
  }

  var listo = false;
  var pendientes = [];
  var puntosPorId = {};

  var map = new maplibregl.Map({
    container: "mapa",
    style: CONFIG.estiloUrl,
    center: CONFIG.centro,
    zoom: CONFIG.zoom,
    attributionControl: false,
    interactive: CONFIG.interactivo,
    dragRotate: false,
    pitchWithRotate: false
  });
  // Los errores sueltos (una tesela que no bajó) no se informan: si el mapa no llega a cargar,
  // la app se entera porque no recibe "listo" a tiempo.
  if (map.touchZoomRotate) map.touchZoomRotate.disableRotation();
  // Atribución obligatoria (OpenFreeMap, OpenMapTiles, OpenStreetMap) abajo a la izquierda;
  // la app la sube con el mensaje "margenes" para que sus tarjetas no la tapen.
  map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

  // Repinta el estilo base por categoría de capa (esquema OpenMapTiles), no por id.
  function repintar() {
    map.getStyle().layers.forEach(function (capa) {
      var id = capa.id, tipo = capa.type, origen = capa["source-layer"];
      try {
        if (tipo === "background") map.setPaintProperty(id, "background-color", C.tierra);
        else if (origen === "water" && tipo === "fill") map.setPaintProperty(id, "fill-color", C.agua);
        else if (origen === "waterway" && tipo === "line") map.setPaintProperty(id, "line-color", C.agua);
        else if (tipo === "fill" && (origen === "park" || /park|wood|grass/.test(id))) map.setPaintProperty(id, "fill-color", C.parque);
        else if (origen === "landuse" && tipo === "fill") map.setPaintProperty(id, "fill-color", C.manzana);
        else if (origen === "building" && tipo === "fill") {
          map.setPaintProperty(id, "fill-color", C.edificio);
          map.setPaintProperty(id, "fill-outline-color", C.borde);
        } else if (origen === "transportation" && tipo === "line") {
          if (/casing|rail/.test(id)) map.setPaintProperty(id, "line-color", C.borde);
          else if (/major|motorway|trunk|primary/.test(id)) map.setPaintProperty(id, "line-color", C.avenida);
          else map.setPaintProperty(id, "line-color", C.calle);
        } else if (tipo === "symbol" && capa.layout && capa.layout["text-field"]) {
          map.setPaintProperty(id, "text-color", C.texto);
          map.setPaintProperty(id, "text-halo-color", C.textoHalo);
        }
      } catch (e) {}
    });
  }

  function vacio() {
    return { type: "FeatureCollection", features: [] };
  }

  function aGeojson(puntos) {
    return {
      type: "FeatureCollection",
      features: puntos.map(function (p) {
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.longitud, p.latitud] },
          properties: { id: p.id, tipo: p.tipo }
        };
      })
    };
  }

  var COLOR_POR_TIPO = ["match", ["get", "tipo"],
    "hospital", C.hospital, "clinica", C.clinica, "centro_medico", C.centroMedico, "laboratorio", C.laboratorio, C.texto];

  function agregarCapas() {
    map.addSource("centros", { type: "geojson", data: vacio() });
    map.addSource("yo", { type: "geojson", data: vacio() });
    map.addLayer({ id: "centros", type: "circle", source: "centros", paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 13, 6, 16, 9],
      "circle-color": COLOR_POR_TIPO,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 14, 2],
      "circle-stroke-color": C.marcadorBorde
    } });
    map.addLayer({ id: "yo-halo", type: "circle", source: "yo", paint: {
      "circle-radius": 18, "circle-color": C.ubicacion, "circle-opacity": 0.18
    } });
    map.addLayer({ id: "yo", type: "circle", source: "yo", paint: {
      "circle-radius": 7, "circle-color": C.ubicacion, "circle-stroke-width": 3, "circle-stroke-color": C.marcadorBorde
    } });
    map.addLayer({ id: "centros-seleccion", type: "circle", source: "centros", filter: ["==", ["get", "id"], ""], paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 8, 14, 12, 16, 14],
      "circle-color": COLOR_POR_TIPO,
      "circle-stroke-width": 3,
      "circle-stroke-color": C.marcadorBorde
    } });
  }

  // Toque con tolerancia de 14 px: un dedo es más grande que el marcador.
  map.on("click", function (e) {
    var r = 14;
    var encontrados = map.queryRenderedFeatures(
      [[e.point.x - r, e.point.y - r], [e.point.x + r, e.point.y + r]], { layers: ["centros"] });
    if (!encontrados.length) { enviar({ tipo: "seleccion", id: null }); return; }
    var mejor = encontrados[0], distanciaMejor = Infinity;
    encontrados.forEach(function (f) {
      var p = map.project(f.geometry.coordinates);
      var d = (p.x - e.point.x) * (p.x - e.point.x) + (p.y - e.point.y) * (p.y - e.point.y);
      if (d < distanciaMejor) { distanciaMejor = d; mejor = f; }
    });
    enviar({ tipo: "seleccion", id: mejor.properties.id });
  });
  map.on("mouseenter", "centros", function () { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "centros", function () { map.getCanvas().style.cursor = ""; });

  function aplicar(m) {
    if (m.tipo === "puntos" && Array.isArray(m.puntos)) {
      puntosPorId = {};
      m.puntos.forEach(function (p) { puntosPorId[p.id] = p; });
      map.getSource("centros").setData(aGeojson(m.puntos));
    } else if (m.tipo === "seleccion") {
      map.setFilter("centros-seleccion", ["==", ["get", "id"], m.id || ""]);
      var p = m.id ? puntosPorId[m.id] : null;
      // Se corre hacia arriba para que la tarjeta de abajo no tape el marcador.
      if (p) map.easeTo({ center: [p.longitud, p.latitud], offset: [0, -90], duration: 500 });
    } else if (m.tipo === "ubicacion") {
      map.getSource("yo").setData(m.coordenada ? aGeojson([{ id: "yo", tipo: "yo", latitud: m.coordenada.latitud, longitud: m.coordenada.longitud }]) : vacio());
    } else if (m.tipo === "margenes") {
      var abajo = document.querySelector(".maplibregl-ctrl-bottom-left");
      if (abajo) abajo.style.bottom = (Number(m.inferior) || 0) + "px";
    } else if (m.tipo === "volar" && m.coordenada) {
      map.flyTo({ center: [m.coordenada.longitud, m.coordenada.latitud], zoom: m.zoom || 14, essential: true });
    }
  }

  function recibir(evento) {
    // En un iframe solo se aceptan mensajes de la página que lo contiene.
    if (window.parent !== window && evento.source && evento.source !== window.parent) return;
    var m;
    try { m = typeof evento.data === "string" ? JSON.parse(evento.data) : evento.data; } catch (e) { return; }
    if (!m || typeof m.tipo !== "string") return;
    if (listo) aplicar(m); else pendientes.push(m);
  }
  window.addEventListener("message", recibir);
  document.addEventListener("message", recibir); // WebView de Android

  map.on("load", function () {
    repintar();
    agregarCapas();
    listo = true;
    pendientes.splice(0).forEach(aplicar);
    // En la vista previa la atribución arranca plegada en el ícono "i": el texto completo
    // se ve en el mapa grande.
    if (!CONFIG.interactivo) {
      document.querySelectorAll(".maplibregl-ctrl-attrib").forEach(function (el) {
        el.classList.remove("maplibregl-compact-show");
      });
    }
    enviar({ tipo: "listo" });
  });
})();
</script>
</body>
</html>`;
}
