# 6. Cómo reproducir la investigación

[← Volver al índice](README.md)

Comandos usados para descargar y verificar cada fuente. Sirven para repetir las pruebas y como
punto de partida del futuro script de importación. Requieren `curl` y `python3` (solo
biblioteca estándar).

> `datos.salud.gob.ar` tiene un certificado SSL incompleto: por eso los `curl` llevan `-k`.
> Algunas URLs redirigen de `http` a `https`: por eso llevan `-L`.

---

## REFES

### Ver las versiones disponibles (API CKAN)

```bash
curl -sk "https://datos.salud.gob.ar/api/3/action/package_show?id=listado-establecimientos-de-salud-asentados-en-el-registro-federal-refes" \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)['result']
print(d['title'], '|', d['license_title'])
for r in d['resources']:
    print('-', r['name'], '|', r['format'], '|', r['url'])
"
```

### Descargar el CSV (versión dic-2025)

```bash
curl -skL -o refes2025.csv \
  "https://datos.salud.gob.ar/dataset/336cf4d9-447a-44c4-8e34-0ba1fc293d55/resource/6aa2c00e-0706-4d39-bade-95ceb271a4c6/download/establecimientos-asistenciales-asentados-registro-federal-refes-20251215.csv"
```

La versión ene-2026 está en XLSX:
`.../resource/d91c27de-e440-4cd8-8f4c-0b8a8fd8dfa6/download/establecimientos-asistenciales-asentados-registro-federal-refes-20260114.xlsx`.
Las URLs exactas de cada versión salen del comando anterior.

### Contar coordenadas válidas y filtrar por tipo

```python
import csv

PUBLICOS = {"Provincial", "Municipal", "Nacional", "Universitario público", "FFAA/Seguridad"}

def coordenadas_validas(r):
    try:
        lat, lon = float(r["latitud"]), float(r["longitud"])
    except ValueError:
        return False
    return -56 < lat < -21 and -74 < lon < -53   # caja aproximada de Argentina

def tipo_app(r):
    sigla, nombre = r["tipologia_sigla"], r["tipologia_nombre"].lower()
    if sigla.startswith("ESCI") and sigla != "ESCIRES":
        return "hospital" if r["origen_financiamiento"] in PUBLICOS else "clinica"
    if sigla == "ESSIDT" and "sin atención" not in nombre:
        return "centro_medico"
    if sigla == "ESSID" and ("laboratorio" in nombre or "imágenes" in nombre):
        return "laboratorio"
    return None   # se descarta

filas = list(csv.DictReader(open("refes2025.csv", encoding="utf-8-sig")))
utiles = [r for r in filas if tipo_app(r) and coordenadas_validas(r)]
print(len(filas), "establecimientos ·", len(utiles), "útiles con coordenadas")
```

---

## RNAS

El botón "Exportar listado a Excel" es un `POST` que devuelve texto separado por tabulaciones
(Latin-1), con 3 líneas de encabezado antes de la fila de columnas.

```bash
curl -skL -A "Mozilla/5.0" -X POST \
  -d "obj=listRnosc&tipo=100&provincia=&localidad=" \
  "https://www.sssalud.gob.ar/descargas/dump.php" -o rnas.tsv
```

```python
lineas = open("rnas.tsv", encoding="latin-1").read().splitlines()
i = next(n for n, l in enumerate(lineas) if l.startswith("RNAS\t"))
columnas = lineas[i].split("\t")
obras = [dict(zip(columnas, [c.strip() for c in l.split("\t")])) for l in lineas[i + 1:] if l.strip()]
print(len(obras), "obras sociales")   # 366 el 03/10/2026
```

Para un sublistado, cambiar `tipo` (por ejemplo `tipo=3` para las que aceptan monotributistas).

---

## Prepagas (RNEMP)

Búsqueda por parte del nombre. **No automatizar consultas masivas.**

```bash
curl -skL -A "Mozilla/5.0" -X POST \
  -d "pagina_consulta=&denominacion_b=SWISS&B1=Buscar" \
  "https://www.sssalud.gob.ar/index.php?page=bus_emp_padron&cat=consultas"
```

---

## API Georef

```bash
curl -s "https://apis.datos.gob.ar/georef/api/direcciones?direccion=Avenida%20Pueyrredon%201640&provincia=caba&max=1"
```

Respuesta: `direcciones[0].nomenclatura` (dirección normalizada) y `direcciones[0].ubicacion`
(`lat`, `lon`).

---

## OpenStreetMap (Overpass)

```bash
curl -s -A "DocAppGo-research" --data-urlencode \
  'data=[out:json][timeout:90];area["ISO3166-2"="AR-C"]->.a;(nwr["amenity"="hospital"](area.a);nwr["amenity"="clinic"](area.a);nwr["healthcare"="laboratory"](area.a););out tags center;' \
  https://overpass-api.de/api/interpreter
```

`AR-C` es CABA. Para otra provincia, usar su código ISO 3166-2 (por ejemplo `AR-B` para Buenos
Aires).

---

## Buscar otros datasets en los portales

```bash
# Portal nacional
curl -sk "https://datos.gob.ar/api/3/action/package_search?q=prestadores&rows=10"
# Portal de Salud
curl -sk "https://datos.salud.gob.ar/api/3/action/package_search?q=obras%20sociales&rows=10"
```
