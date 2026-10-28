# DocApp Go

App móvil de gestión de turnos y servicios médicos multi-hospital. Trabajo práctico de
**Programación de Apps Móviles (UCA)**.

El contexto completo del proyecto (modelo de dominio, reglas de negocio, sistema de diseño,
alcance del MVP) vive en [`CLAUDE.md`](../../CLAUDE.md), dos niveles arriba de esta carpeta (en el workspace). Léelo
antes de tocar código.

## Stack

- React Native 0.86 + **Expo SDK 57** (pineado — no actualizar sin confirmación)
- TypeScript (`strict: true`)
- Expo Router (navegación file-based)
- Mapa con **MapLibre GL JS + OpenFreeMap** dentro de un WebView (`react-native-webview`): anda en Expo Go, web y
  la app compilada, sin clave de API
- `expo-image-picker` + `expo-image-manipulator` (foto de perfil: cámara o galería, recortada a 512×512 JPEG)

## Requisitos previos

- **Node.js** 20 o superior y **npm** (`node -v`, `npm -v`).
- La app **Expo Go** instalada en el celular Android — [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
  Usá **siempre la versión de Expo Go compatible con SDK 57** (la que baja Play Store por
  defecto ya sirve; si tenías Expo Go instalado de antes y no conecta, desinstalá y volvé a
  instalar).
- Celular y computadora **en la misma red Wi-Fi** (el QR conecta por IP local).
- Opcional: [Android Studio](https://developer.android.com/studio) con un emulador configurado,
  si preferís probar sin celular físico.

## Puesta en marcha

Este repo es el del **frontend**: la app Expo está en `frontend/`. El backend está en otro repo,
[docapp-go-backend](https://github.com/eduescuti/docapp-go-backend). Clonar este repo y pararse en
`frontend/`, la raíz del proyecto Expo:

```bash
git clone https://github.com/eduescuti/docapp-go.git
cd docapp-go/frontend

npm install
cp .env.example .env     # una sola vez: dirección del backend (EXPO_PUBLIC_API_URL)
npx expo start
```

Esto levanta **Metro** (el bundler de React Native) y muestra un QR en la terminal.

### La app necesita el backend

Login, registro y los datos ya conectados vienen de la API (ver el estado en el README del backend). Antes de
abrir la app, levantá el backend (`docapp-go-backend/backend`: `npm install`, `cp .env.example .env`,
`npm run db:migrate`, `npm run db:seed`, `npm run dev`) y dejá en `frontend/.env` su dirección:

| Dónde probás | `EXPO_PUBLIC_API_URL` |
|---|---|
| Web (`npx expo start --web`) | `http://localhost:3000` |
| Celular con Expo Go | `http://<IP de la computadora en la red>:3000` (p. ej. `http://192.168.0.10:3000`), con el celular en la misma red. `localhost` en el celular es el propio celular. |

Después de cambiar `.env` hay que reiniciar `npx expo start`. Si la app dice "No pudimos conectarnos con el
servidor", probá `http://<esa dirección>/api/health` en el navegador del celular. Las cuentas de prueba están en
[`USUARIOS-DE-PRUEBA.md`](USUARIOS-DE-PRUEBA.md).

### Probar en el celular (Expo Go) — método principal

1. Corré `npx expo start`.
2. Abrí la app **Expo Go** en el celular.
3. Escaneá el QR que aparece en la terminal (en Android, Expo Go tiene su propio lector de QR
   integrado; también podés usar la cámara del celular, que te va a ofrecer abrirlo en Expo Go).
4. La app se compila en el celular y recarga sola cada vez que guardás un cambio (**Fast Refresh**).

Si el celular no se conecta al QR (redes corporativas, WSL, etc.), forzá modo túnel:

```bash
npx expo start --tunnel
```

### Probar en un emulador Android

Con un emulador ya corriendo (o Android Studio instalado y detectable):

```bash
npx expo start --android
```

### Comandos útiles durante el desarrollo

En la terminal donde corre `npx expo start`, con el bundler activo podés apretar:

- `r` — recargar la app
- `m` — abrir el menú de developer tools en el celular
- `j` — abrir el debugger de JS
- `a` — abrir en un emulador/dispositivo Android conectado

## Scripts

```bash
npx expo start          # levanta el bundler (método normal de trabajo diario)
npx expo start -c       # idem, limpiando caché de Metro — usalo si algo "raro" no refresca
npx expo start --tunnel # idem, con túnel — usalo si el QR no conecta por red local
npm run typecheck       # tsc --noEmit, correlo antes de cada commit
npx expo-doctor         # chequea que la instalación y config de Expo estén sanas
```

## Establecimientos reales (REFES)

Las instituciones de la app son los **1.077 establecimientos de salud de CABA** del REFES
(Registro Federal de Establecimientos de Salud, Ministerio de Salud de la Nación, licencia
CC BY 4.0): hospitales, clínicas y sanatorios, centros médicos y laboratorios. Los carga el **seed del
backend** (`backend/prisma/datos/demo.json`); la app los pide a la API.

`src/mocks/data/refes-caba.json` es la salida del script que procesa el CSV del REFES (la app ya no lo
importa). Para regenerarlo con una versión nueva:

```bash
# 1. Bajar el CSV (~9 MB) a scripts/.cache/, que está en .gitignore.
#    La URL de cada versión sale de DocApp Go/investigacion-apis/06-como-reproducir.md.
curl -skL -o scripts/.cache/refes-20251215.csv "<URL del CSV>"

# 2. Generar el JSON. Imprime cuántos quedaron por tipo y por qué se descartó el resto.
node scripts/importar-refes.mjs scripts/.cache/refes-20251215.csv
```

Después hay que pasar esos establecimientos a `demo.json` del backend: hoy no hay un paso automático para eso.

Los públicos se muestran a todos los pacientes (CLAUDE.md §10, regla 15). Los privados, solo
si aceptan la obra social del paciente (entera o su plan). Esa relación no existe como dato
público: la carga el admin desde la app (Instituciones → tocar una), y el seed trae las coberturas
verificadas de 9 hospitales y el catálogo de 26 obras sociales (detalle en
`DocApp Go (backend)/docs/08-coberturas.md`).

## Nota sobre el mapa

El mapa es MapLibre + OpenFreeMap en un WebView (en web, en un `<iframe>`), así que **no necesita clave**.
`react-native-maps` sigue instalado y `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` sigue en `.env.example` solo por si el
docente exige el SDK de Google en la app compilada (pendiente de confirmar). Si alguna vez se usa la clave, va en
`.env`, que está en `.gitignore` — **nunca la commitees** (CLAUDE.md §11). El detalle de la decisión está en
`investigacion-apis/08-motor-del-mapa.md`.

## Problemas comunes

- **"Something went wrong" / la app no carga en Expo Go**: parate en `frontend/` (no en la raíz
  del repo) antes de correr `npx expo start` — tiene que ejecutarse donde está el
  `package.json` de Expo.
- **Cambios que no se reflejan**: `npx expo start -c` para limpiar caché de Metro.
- **Versión de SDK no coincide con Expo Go**: confirmá `npx expo-doctor` sin errores y que
  `package.json` tenga `"expo": "^57"`. No corras `npx expo upgrade` — el proyecto está
  pineado a SDK 57 (CLAUDE.md §2); cualquier cambio de versión se confirma antes.

## Estructura

Ver CLAUDE.md §4 para el detalle de `app/` y `src/`. En resumen:

- `app/` — rutas de Expo Router, agrupadas por rol: `(auth)`, `(paciente)`, `(doctor)`, `(admin)`.
- `src/theme/` — los tres temas tipados del sistema de diseño (A, B, C — este último es el modo oscuro).
- `src/domain/` — tipos del dominio médico.
- `src/services/` — la única puerta de entrada a los datos; hoy leen `src/mocks/`, mañana un backend real.
- `src/mocks/` — solo las preguntas frecuentes de Ayuda: los datos vienen del backend (sus datos de prueba
  los carga el seed).
- [`USUARIOS-DE-PRUEBA.md`](USUARIOS-DE-PRUEBA.md) — cuentas para el SignIn, fichas para el SignUp y dónde modificarlas.

## Estado

- **Paciente:** base funcional de las 7 pantallas de referencia (`/template-ejemplo-figma`).
  Todas las tarjetas del Menú tienen su página (`app/(paciente)/cuenta/`), la campana del
  Inicio abre un panel de notificaciones y en Configuración se elige modo claro, oscuro o
  automático.
- **Profesional:** agenda, pacientes asignados, ficha del paciente (historial con ese
  profesional + notas privadas) y perfil.
- **Foto de perfil:** el paciente (Mi perfil) y el profesional (Perfil) la suben, cambian o quitan; se
  guarda en el backend. En web, "Sacar una foto" abre el selector de archivos de la computadora.
- **Admin:** panel con métricas de uso y gráfico de pacientes por obra social, alta de obras
  sociales y de instituciones.

Ver CLAUDE.md §13 para el detalle de qué falta.
