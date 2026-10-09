# 7. Otros cambios de la app

[← Volver al índice](README.md)

Cambios hechos en la misma etapa (09/10/2026) que no son del mapa, pero conviene tener anotados.

---

## 1. La app en el navegador

| Cambio | Detalle |
|---|---|
| Dependencias web | `react-native-web`, `@expo/metro-runtime` y `react-dom` (19.2.3, igual que `react`), con `npx expo install` |
| Bucle al recargar | Los grupos `(paciente)`, `(doctor)` y `(admin)` comparten la URL `/` en web: redirigir a `/` sin sesión era un bucle infinito. `src/utils/navigation.ts` (`rutaInicio`) manda a la ruta concreta de cada rol |
| Botones anidados | En web, la tarjeta del próximo turno y la de médicos favoritos eran un botón con botones adentro (HTML inválido). Ahora la parte tocable y los botones son hermanos. También mejora el lector de pantalla en Android |

## 2. Inicio

| Cambio | Detalle |
|---|---|
| Vista previa del mapa | Ver [doc 4](04-pantallas.md), sección "Inicio" |
| Carrusel | El **próximo turno** y la **credencial del plan médico** se alternan solos (cada 4 s, valor por defecto en `src/components/Carrusel.tsx`), se pueden deslizar y tienen puntos indicadores. Sin turno próximo, solo la credencial. Si el usuario desliza, el avance espera un intervalo completo |
| Accesibilidad del carrusel | No avanza solo con "reducir movimiento" activado, ni con lector de pantalla en el celular. En web no se consulta el lector, porque react-native-web responde siempre que sí y frenaba el carrusel |
| `CredencialPlan` | La credencial de "Mi plan médico" pasó a ser un componente, usado también en el Inicio |

## 3. Turnos

- Mismo ancho que el resto de las pantallas: sumaba 24 px de margen sobre los de `ScreenContainer`.
- Tarjetas con foto, profesional, especialidad · sede, estado, fecha y hora.
- **Tocar un turno abre su detalle**: profesional y matrícula (link al perfil), fecha y horario,
  tipo de consulta y sede con "Cómo llegar".
- **Cancelar turno** dentro del detalle, con **segunda confirmación**.
- **Historial:** "Eliminar del historial" de a uno y "Eliminar todo", también con confirmación.
  Funciona en memoria. **Solo oculta** el turno de esa lista (`ocultoEnHistorial`): el historial
  médico, el feedback y lo que ve el profesional no cambian.
- `listMisTurnos` separa próximos e historial en el service (antes lo hacía la pantalla).

## 4. Estudios

- Mismo ancho que el resto. Pestañas **Resultados | Archivados**. Se quitó "Órdenes": la orden
  médica se ve en el detalle de cada estudio (Menú → Órdenes médicas sigue existiendo).
- **Detalle del estudio:** médico solicitante, fecha, dónde se hizo, orden e indicaciones.
- **Ver estudio:** visor de PDF dentro de la app (`src/components/visorPdf/`), con pdf.js 3.11.174
  en un WebView o iframe, igual que el mapa. Zoom de 100 % a 300 % con botones y, en el celular,
  con los dedos.
- Los estudios de prueba no tienen archivo: `getResultadoPdf` arma un **PDF de ejemplo**
  (`src/utils/pdf.ts`) con los datos del estudio, marcado como datos ficticios y sin membrete de
  ninguna institución real.
- **Archivar** lo pasa a Archivados, en carpetas **año → mes** según la fecha en que se archivó
  (`archivadoEl`). Solo existen las carpetas con estudios. **Desarchivar** lo devuelve a Resultados.

## 5. Componentes compartidos nuevos

| Componente | Para qué |
|---|---|
| `SheetModal` | Base de los paneles que suben desde abajo: el fondo oscuro **aparece de a poco** y el panel sube por separado (antes el fondo subía pegado al panel) |
| `BottomSheet` | Panel con título, contenido y botones (detalle de turnos y estudios) |
| `Confirmacion` | Segunda confirmación antes de una acción que no se deshace. Reemplaza a `Alert`, que en web no funciona |
| `TabSwitch` | Selector de pestañas (estaba copiado en Turnos y Estudios) |
| `Carrusel` | Tarjetas deslizables con avance automático |
| `CredencialPlan` | Credencial del plan médico |
| `VisorPdf` / `VisorPdfModal` | Visor de PDF |

`NotificacionesSheet` y `SelectField` también usan ahora `SheetModal`. `PrimaryButton` sumó la
variante `danger` y el tema el token `dangerForeground`.

## 6. Excepción a "sin HTML" (CLAUDE.md §2)

Las únicas partes con HTML son el **mapa** (`src/components/mapa/`) y el **visor de PDF**
(`src/components/visorPdf/`): páginas con una librería web dentro de un WebView. En web se
muestran con `<iframe>` desde archivos `*.web.tsx`, que Expo usa solo en el navegador.
