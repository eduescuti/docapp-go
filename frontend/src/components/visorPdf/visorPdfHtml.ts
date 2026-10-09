/**
 * Página que muestra un PDF con pdf.js dentro de un WebView (celular) o un iframe (web), igual
 * que el mapa: pdf.js es una librería web y así anda en Expo Go, en la app compilada y en web.
 *
 * - pdf.js 3.11 (la última con build UMD; desde la 4 viene solo como módulos ES).
 * - El worker se baja como texto y se crea desde un Blob: un worker de otro dominio no se puede
 *   crear directo desde un WebView con HTML en línea.
 * - Zoom: botones de la app (mensaje "zoom") y, en el celular, pellizcando (viewport escalable).
 */
const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

interface OpcionesVisor {
  /** PDF como string binario (un carácter por byte). */
  datos: string;
  fondo: string;
}

/** JSON con todo lo que no es ASCII escapado, para meterlo seguro dentro de un <script>. */
function jsonSeguro(valor: unknown): string {
  return JSON.stringify(valor).replace(/[\u007f-￿<]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export function crearHtmlVisorPdf({ datos, fondo }: OpcionesVisor): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes">
<style>
  html, body { margin: 0; padding: 0; background: ${fondo}; }
  #paginas { width: max-content; min-width: 100%; box-sizing: border-box; padding: 12px; }
  canvas { display: block; margin: 0 auto 12px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.25); }
</style>
</head>
<body>
<div id="paginas"></div>
<script src="${PDFJS_CDN}/pdf.min.js"></script>
<script>
(function () {
  var DATOS = ${jsonSeguro(datos)};
  var WORKER_URL = "${PDFJS_CDN}/pdf.worker.min.js";
  var contenedor = document.getElementById("paginas");
  var documento = null;
  var zoom = 1;
  var dibujando = false, pendiente = false;

  function enviar(mensaje) {
    var texto = JSON.stringify(mensaje);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(texto);
    else if (window.parent !== window) window.parent.postMessage(texto, "*");
  }

  if (!window.pdfjsLib) { enviar({ tipo: "error", detalle: "No se pudo descargar el visor de PDF." }); return; }

  function prepararWorker() {
    return fetch(WORKER_URL)
      .then(function (r) { return r.text(); })
      .then(function (codigo) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([codigo], { type: "text/javascript" }));
      })
      .catch(function () { pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL; });
  }

  // Dibuja todas las páginas al ancho de la pantalla por el zoom, con más resolución que la
  // pantalla para que se lea nítido al pellizcar.
  function dibujar() {
    if (!documento) return;
    if (dibujando) { pendiente = true; return; }
    dibujando = true;
    var ancho = document.documentElement.clientWidth - 24;
    var nitidez = Math.min(3, (window.devicePixelRatio || 1) * 1.5);
    var canvases = [];
    var cadena = Promise.resolve();
    for (var i = 1; i <= documento.numPages; i++) {
      (function (n) {
        cadena = cadena.then(function () { return documento.getPage(n); }).then(function (pagina) {
          var base = pagina.getViewport({ scale: 1 });
          var escala = (ancho / base.width) * zoom;
          var vista = pagina.getViewport({ scale: escala * nitidez });
          var canvas = document.createElement("canvas");
          canvas.width = Math.floor(vista.width);
          canvas.height = Math.floor(vista.height);
          canvas.style.width = Math.floor(vista.width / nitidez) + "px";
          canvas.style.height = Math.floor(vista.height / nitidez) + "px";
          canvases.push(canvas);
          return pagina.render({ canvasContext: canvas.getContext("2d"), viewport: vista }).promise;
        });
      })(i);
    }
    cadena.then(function () {
      contenedor.innerHTML = "";
      canvases.forEach(function (c) { contenedor.appendChild(c); });
      dibujando = false;
      if (pendiente) { pendiente = false; dibujar(); }
    }).catch(function () {
      dibujando = false;
      enviar({ tipo: "error", detalle: "No se pudo mostrar el PDF." });
    });
  }

  function recibir(evento) {
    if (window.parent !== window && evento.source && evento.source !== window.parent) return;
    var m;
    try { m = typeof evento.data === "string" ? JSON.parse(evento.data) : evento.data; } catch (e) { return; }
    if (m && m.tipo === "zoom" && typeof m.valor === "number") { zoom = m.valor; dibujar(); }
  }
  window.addEventListener("message", recibir);
  document.addEventListener("message", recibir); // WebView de Android

  prepararWorker().then(function () {
    var bytes = new Uint8Array(DATOS.length);
    for (var i = 0; i < DATOS.length; i++) bytes[i] = DATOS.charCodeAt(i) & 255;
    return pdfjsLib.getDocument({ data: bytes }).promise;
  }).then(function (doc) {
    documento = doc;
    dibujar();
    enviar({ tipo: "listo", paginas: doc.numPages });
  }).catch(function () {
    enviar({ tipo: "error", detalle: "No se pudo abrir el PDF." });
  });
})();
</script>
</body>
</html>`;
}
