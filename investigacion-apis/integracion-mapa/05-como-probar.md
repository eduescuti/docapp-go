# 5. Cómo probar

[← Volver al índice](README.md)

---

## 1. Levantar la app

Desde `DocApp Go/frontend/`:

```bash
npx expo start -c      # celular con Expo Go (-c limpia la caché: se sumó react-native-webview)
npx expo start --web   # navegador en http://localhost:8081
npx tsc --noEmit       # chequeo de tipos
```

- El mapa necesita **internet**: MapLibre se baja de unpkg y las calles de OpenFreeMap.
- Usuarios de prueba: [`USUARIOS-DE-PRUEBA.md`](../../frontend/USUARIOS-DE-PRUEBA.md).

## 2. Recorrido de prueba

| # | Paso | Qué tendría que pasar |
|---|---|---|
| 1 | Entrar como paciente | El Inicio muestra la vista previa del mapa con puntos de colores y entra sin scroll |
| 2 | Tocar "Centros" o la vista previa | Se abre el mapa. La primera vez tarda unos segundos en bajar |
| 3 | Aceptar el permiso de ubicación | La cámara va a tu posición y aparece el punto azul |
| 4 | Rechazarlo (otra prueba) | Arranca en el Obelisco con el aviso "Sin tu ubicación…" y **Activar** |
| 5 | Tocar un marcador | Tarjeta con tipo, "Público · atiende a todas las coberturas", dirección, distancia y "Cómo llegar" |
| 6 | Tocar el CESAC Nº 33 | La tarjeta muestra "Atienden acá:" con profesionales de prueba |
| 7 | "Cómo llegar" | Abre Google Maps con la ruta |
| 8 | Filtro "Hospitales" | Quedan 38 |
| 9 | "Más cercano" (con ubicación) | Elige el centro más cercano y lo muestra |
| 10 | Botón "Lista" | Los mismos centros en lista. Tocar uno vuelve al mapa con ese centro |
| 11 | Configuración → Claro / Oscuro | El mapa cambia de colores |
| 12 | Mi perfil → cambiar obra social → mapa | El contador dice el plan nuevo. Hoy los lugares son los mismos (ver [doc 2](02-cobertura-y-busqueda.md#4-qué-ve-cada-obra-social-hoy)) |
| 13 | Menú → Ayuda | "Datos y fuentes" con el REFES y los datos del mapa |
| 14 | Modo avión con el mapa cerrado y abrirlo | A los 15 s aparece "No pudimos cargar el mapa" con **Ver lista** |

## 3. Qué se verificó y qué no

| Verificado (09/10/2026) | Cómo |
|---|---|
| Tipos | `npx tsc --noEmit` sin errores |
| Mapa en web | Carga con calles de CABA y marcadores. Tocar un marcador abre la tarjeta |
| Lista y filtros en web | La lista se ordena y "Hospitales" deja 38 |
| Atribución | Visible arriba de la leyenda |
| Inicio en 360×800 | Sin scroll: el contenido mide justo 736 px |
| Vista previa del Inicio | Muestra varios centros y al tocarla abre `/mapa` |
| Carrusel del Inicio en el celular | Probado por el usuario con Expo Go: funciona |
| Mapa en modo claro | Captura del usuario del Inicio en web (09/10/2026, 17:04): la vista previa usa los colores del tema A |

| Sin verificar | Por qué |
|---|---|
| El mapa en el celular con Expo Go | No hay registro de una prueba explícita (el diseño se aprobó). Hacer el recorrido de arriba |
| Permiso de ubicación en web | No se aceptó en el navegador de prueba |
| App compilada (APK) | No se generó todavía |

> **Sobre las pruebas automáticas en Chrome:** la ventana de prueba estaba en segundo plano.
> En ese estado Chrome no dibuja cuadros (`requestAnimationFrame` no corre), frena los
> temporizadores, no mide tamaños (`onLayout`) y no recibe teclado. Por eso algunas capturas se
> colgaban y ciertas animaciones no avanzaban. Son limitaciones del entorno de prueba, no de la app.
