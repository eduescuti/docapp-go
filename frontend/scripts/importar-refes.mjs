/**
 * Genera `src/mocks/data/refes-caba.json` con los establecimientos de salud de CABA del
 * REFES (Registro Federal de Establecimientos de Salud, Ministerio de Salud, CC BY 4.0).
 *
 * Se corre en la compu, nunca en el celular. Node puro, sin dependencias:
 *
 *   node scripts/importar-refes.mjs scripts/.cache/refes-20251215.csv
 *
 * El CSV crudo (~9 MB) no se commitea: va en `scripts/.cache/` (ignorado por Git). Cómo
 * descargarlo: `DocApp Go/investigacion-apis/06-como-reproducir.md`. Las reglas de filtrado
 * están explicadas en `DocApp Go/investigacion-apis/plan-integracion-apis/02-fases.md` (Fase 2).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "src/mocks/data/refes-caba.json");

const PROVINCIA_CABA = "02";
// Caja que contiene a CABA: lo que cae afuera es un error de carga del registro.
const CAJA_CABA = { latMin: -34.71, latMax: -34.52, lonMin: -58.54, lonMax: -58.33 };

// Origen de financiamiento → origen en la app. Decide la regla 15 (públicos visibles para todos).
const PUBLICOS = new Set(["Provincial", "Municipal", "Nacional", "Universitario público"]);
// FFAA/Seguridad atiende sobre todo a su propia obra social (IOSFA, Churruca) y en CABA incluye
// buques y cuarteles: se trata como seguridad social para no mostrarlo a todos los pacientes.
const SEGURIDAD_SOCIAL = new Set(["Seguridad Social", "FFAA/Seguridad"]);
const PENITENCIARIOS = new Set(["Servicio Penitenciario Provincial", "Servicio Penitenciario Federal"]);

const CAMPOS = ["establecimientoId", "nombre", "tipo", "origen", "domicilio", "latitud", "longitud", "sitioWeb"];

// ---------------------------------------------------------------------------------------------
// Lectura del CSV
// ---------------------------------------------------------------------------------------------

/** Parser mínimo de CSV: comillas dobles, comillas escapadas ("") y saltos de línea \n o \r\n. */
function parsearCsv(texto) {
  const filas = [];
  let fila = [];
  let campo = "";
  let entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else if (c !== "\r") {
      campo += c;
    }
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas;
}

function leerRegistros(ruta) {
  const texto = readFileSync(ruta, "utf8").replace(/^﻿/, "");
  const [encabezado, ...filas] = parsearCsv(texto);
  return filas
    .filter((f) => f.length === encabezado.length)
    .map((f) => Object.fromEntries(encabezado.map((col, i) => [col, f[i].trim()])));
}

// ---------------------------------------------------------------------------------------------
// Clasificación
// ---------------------------------------------------------------------------------------------

function origenApp(origenRefes) {
  if (PUBLICOS.has(origenRefes)) return "publico";
  if (SEGURIDAD_SOCIAL.has(origenRefes)) return "seguridad_social";
  return "privado";
}

/**
 * Tipología del REFES → tipo de la app. Devuelve null si el establecimiento no es un lugar
 * donde un paciente saca un turno (ópticas, geriátricos, vacunatorios, medicina laboral...).
 */
function tipoApp(registro, origen) {
  const sigla = registro.tipologia_sigla;
  const tipologia = registro.tipologia_nombre.toLowerCase();
  if (sigla.startsWith("ESCI")) {
    // ESCIRES: residencias para personas mayores. ESCIETE: internación de tercera edad (geriátricos).
    if (sigla === "ESCIRES" || sigla === "ESCIETE") return null;
    // Con internación: hospital si es público o si el nombre lo dice (Alemán, Británico, Italiano).
    // El resto (sanatorios y clínicas) queda como clínica (decisión D3).
    const esHospital = origen === "publico" || /^(HOSPITAL|HTAL)\b/i.test(registro.establecimiento_nombre);
    return esHospital ? "hospital" : "clinica";
  }
  if (sigla === "ESSIDT") return tipologia.includes("sin atención") ? null : "centro_medico";
  if (sigla === "ESSID" && (tipologia.includes("laboratorio") || tipologia.includes("imágenes"))) {
    return "laboratorio";
  }
  return null;
}

function coordenadas(registro) {
  const latitud = Number(registro.latitud);
  const longitud = Number(registro.longitud);
  const { latMin, latMax, lonMin, lonMax } = CAJA_CABA;
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return null;
  if (latitud < latMin || latitud > latMax || longitud < lonMin || longitud > lonMax) return null;
  // 6 decimales ≈ 10 cm: más precisión que la del registro, sin inflar el JSON.
  return { latitud: Number(latitud.toFixed(6)), longitud: Number(longitud.toFixed(6)) };
}

// ---------------------------------------------------------------------------------------------
// Normalización de textos: el REFES viene en mayúsculas, sin tildes y con abreviaturas.
// ---------------------------------------------------------------------------------------------

const EN_MINUSCULA = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "o", "u", "en", "a", "al", "para", "por", "con"]);
const SIGLAS = new Set([
  "SA", "SRL", "SAS", "CESAC", "CEMAR", "CMB", "CEMIC", "FLENI", "ITAC", "ITEBA", "IOSFA", "IOSE", "UAI",
  "UBA", "GNA", "API", "IMO", "OSDE", "CABA", "IADT", "CENARD", "CEMA",
]);
const ROMANOS = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XX)$/;
const ABREVIATURAS = { htal: "hospital" };
const CON_TILDE = Object.fromEntries(
  [
    "clínica", "clínicas", "clínico", "clínicos", "policlínico", "policlínica", "médico", "médica",
    "médicos", "médicas", "diagnóstico", "análisis", "pediatría", "pediátrico", "pediátrica",
    "odontología", "odontológico", "odontológica", "oftalmología", "oftalmológico", "oftalmológica",
    "cardiología", "cardiológico", "neurología", "neurológico", "traumatología", "ginecología",
    "rehabilitación", "atención", "internación", "investigación", "nutrición", "psiquiátrico",
    "psiquiátrica", "psicología", "kinesiología", "dermatología", "urología", "oncología",
    "oncológico", "hematología", "endocrinología", "gastroenterología", "nefrología", "radiología",
    "ecografía", "tomografía", "mamografía", "imágenes", "terapéutico", "terapéutica", "día",
    "fundación", "asociación", "unión", "religión", "integración", "prevención", "reproducción",
    "obstétrico", "pública", "público", "geriátrico", "patología", "anatomía", "hemodiálisis", "diálisis",
    "josé", "maría", "martín", "ramón", "córdoba", "pueyrredón", "perón", "tucumán", "perú", "méxico",
    "ríos", "núñez", "maipú", "paraná", "díaz", "vélez", "suárez", "sánchez", "gutiérrez", "garcía",
    "rodríguez", "fernández", "gonzález", "martínez", "lópez", "pérez", "ramírez", "jiménez",
    "álvarez", "hernández", "domínguez", "gómez", "nación", "río", "jesús", "ángel",
    "alemán", "británico", "libanés", "mejía", "cirugía", "psiquiátricas", "psicofísica", "policía",
    "aeronáutico", "donación", "calderón", "raúl", "lucía", "sardá", "tornú", "neumonología",
    "tisioneumonología", "odontológicos", "oftalmológicos",
    "área", "programática", "básico", "básica",
  ].map((palabra) => [palabra.normalize("NFD").replace(/[̀-ͯ]/g, ""), palabra]),
);

function capitalizar(palabra) {
  return palabra.charAt(0).toLocaleUpperCase("es") + palabra.slice(1);
}

/** "HOSPITAL GRAL. DE AGUDOS DR. J. A. FERNANDEZ" → "Hospital Gral. de Agudos Dr. J. A. Fernández". */
function normalizarTexto(texto) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  let indice = 0;
  return limpio.replace(/\p{L}+(?:\.\p{L}+)*\.?/gu, (token, posicion) => {
    const esPrimera = indice++ === 0;
    const anterior = limpio[posicion - 1];
    const siguiente = limpio[posicion + token.length];
    const mayus = token.toLocaleUpperCase("es");
    const letras = mayus.replace(/\./g, "");

    if (/^(\p{L}\.)+\p{L}?\.?$/u.test(token)) return mayus; // S.A., A.R.A., I.M.O.
    if (ROMANOS.test(mayus) && token.length > 1) return mayus; // II, III (la "I" sola queda como está)
    if (SIGLAS.has(letras)) return mayus;
    if (anterior === "(" && siguiente === ")" && letras.length === 1) return mayus; // (A), (M)

    const punto = token.endsWith(".") ? "." : "";
    let base = token.toLocaleLowerCase("es").replace(/\.$/, "");
    base = ABREVIATURAS[base] ?? base;
    base = CON_TILDE[base] ?? base;
    if (!esPrimera && !punto && EN_MINUSCULA.has(base)) return base;
    return capitalizar(base) + punto;
  });
}

function normalizarWeb(web) {
  const limpia = web.trim().replace(/\s+/g, "");
  if (!limpia || !limpia.includes(".")) return "";
  return /^https?:\/\//i.test(limpia) ? limpia : `https://${limpia}`;
}

// ---------------------------------------------------------------------------------------------
// Programa
// ---------------------------------------------------------------------------------------------

function versionDesdeArchivo(ruta) {
  const fecha = basename(ruta).match(/(\d{4})(\d{2})(\d{2})/);
  return fecha ? `${fecha[1]}-${fecha[2]}-${fecha[3]}` : "desconocida";
}

/** Una fila por línea: diffs chicos entre versiones y el archivo sigue siendo JSON válido. */
function serializar(cabecera, filas) {
  const lineas = Object.entries(cabecera).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  const cuerpo = filas.map((f) => `    ${JSON.stringify(f)}`).join(",\n");
  return `{\n${lineas.join("\n")}\n  "filas": [\n${cuerpo}\n  ]\n}\n`;
}

function main() {
  const entrada = process.argv[2];
  if (!entrada) {
    console.error("Uso: node scripts/importar-refes.mjs <ruta al CSV del REFES>");
    process.exit(1);
  }

  const registros = leerRegistros(entrada);
  const descartes = new Map();
  const descartar = (motivo) => descartes.set(motivo, (descartes.get(motivo) ?? 0) + 1);
  const filas = [];

  for (const r of registros) {
    if (r.provincia_id !== PROVINCIA_CABA) continue;
    if (PENITENCIARIOS.has(r.origen_financiamiento)) {
      descartar("servicio penitenciario");
      continue;
    }
    const origen = origenApp(r.origen_financiamiento);
    const tipo = tipoApp(r, origen);
    if (!tipo) {
      descartar(`tipología fuera de alcance (${r.tipologia_sigla})`);
      continue;
    }
    const coords = coordenadas(r);
    if (!coords) {
      descartar("sin coordenadas válidas en CABA");
      continue;
    }
    if (!r.establecimiento_nombre || !r.domicilio) {
      descartar("sin nombre o domicilio");
      continue;
    }
    filas.push([
      r.establecimiento_id,
      normalizarTexto(r.establecimiento_nombre),
      tipo,
      origen,
      normalizarTexto(r.domicilio),
      coords.latitud,
      coords.longitud,
      normalizarWeb(r.sitio_web),
    ]);
  }

  filas.sort((a, b) => a[0].localeCompare(b[0]));

  const cabecera = {
    fuente: "REFES — Registro Federal de Establecimientos de Salud, Ministerio de Salud de la Nación",
    url: "https://datos.salud.gob.ar/dataset/listado-establecimientos-de-salud-asentados-en-el-registro-federal-refes",
    licencia: "CC BY 4.0",
    version: versionDesdeArchivo(entrada),
    generadoEl: new Date().toISOString().slice(0, 10),
    generadoPor: "scripts/importar-refes.mjs",
    campos: CAMPOS,
  };

  mkdirSync(dirname(SALIDA), { recursive: true });
  const json = serializar(cabecera, filas);
  writeFileSync(SALIDA, json);

  // Reporte para pegar en el README o revisar a ojo.
  const conteo = {};
  for (const [, , tipo, origen] of filas) {
    conteo[tipo] ??= { publico: 0, privado: 0, seguridad_social: 0 };
    conteo[tipo][origen]++;
  }
  const totalCaba = registros.filter((r) => r.provincia_id === PROVINCIA_CABA).length;
  console.log(`REFES ${cabecera.version}: ${totalCaba} establecimientos en CABA → ${filas.length} en la app`);
  console.table(conteo);
  console.log("Descartados:");
  for (const [motivo, n] of [...descartes].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${motivo}`);
  console.log(`Escrito ${relative(RAIZ, SALIDA)} (${(Buffer.byteLength(json) / 1024).toFixed(0)} KB)`);
}

main();
