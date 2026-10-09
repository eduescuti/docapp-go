# 4. Pantallas

[← Volver al índice](README.md)

Qué ve el paciente (y el admin) después de la integración.

---

## 1. Mapa (`app/(paciente)/mapa.tsx`)

Una sola pantalla para celular y web: la diferencia de plataforma la resuelve `MapaCentros`. El
archivo `mapa.web.tsx`, que solo avisaba que en web no había mapa, se borró.

| Elemento | Detalle |
|---|---|
| Arriba | Volver · contador ("162 centros para OSDE 210") · botón **Lista / Mapa** |
| Filtros | Todos · Hospitales · Clínicas · Centros médicos · Laboratorios · **Más cercano** (solo con ubicación) |
| Aviso sin ubicación | "Sin tu ubicación: te mostramos el centro de CABA" con **Activar** (vuelve a pedir el permiso) |
| Marcadores | Un color por tipo (`theme.mapa`). El seleccionado se agranda |
| Tu ubicación | Punto con halo. El botón de abajo a la derecha vuelve a ella |
| Leyenda | Abajo, cuando no hay nada seleccionado: qué color es cada tipo |
| Tarjeta al tocar un centro | Tipo · motivo ("Público · atiende a todas las coberturas" o "Acepta OSDE 210") · nombre · dirección y distancia · **profesionales que atienden ahí** (link a su perfil) · **Cómo llegar** (abre Google Maps con la ruta) · **Llamar** si hay teléfono |
| Vista de lista | Los mismos resultados y filtros, ordenados por distancia (o por nombre sin ubicación). Tocar uno vuelve al mapa con ese centro elegido |
| Si el mapa no carga | "No pudimos cargar el mapa" con **Ver lista** y **Reintentar** |

Al llegar la ubicación por primera vez, la cámara vuela hasta el paciente. Al elegir un centro, el
mapa lo centra un poco más arriba para que la tarjeta no lo tape.

"Profesionales que atienden ahí" usa `searchMedicos({ sedeId, planMedicoId })`: solo los que
atienden en esa sede y aceptan el plan del paciente.

## 2. Inicio (`app/(paciente)/index.tsx`)

- **"Instituciones cercanas" es una vista previa del mapa real**, sin lista de nombres. Es el
  mismo `MapaCentros` en modo `interactivo={false}`: sin gestos, zoom 12, atribución plegada.
  Tocarla abre el mapa completo.
- Si el permiso de ubicación ya estaba dado, la vista previa se centra en el paciente.
- **El Inicio entra en una sola pantalla** en 360×800: la vista previa ocupa el alto que sobra,
  con un mínimo de 160 px (en pantallas más bajas aparece un poco de scroll).
- La tarjeta del próximo turno toma la institución de **la sede del turno**. Antes usaba la
  primera institución del médico y fallaba si el turno era en otra.

## 3. Otras pantallas tocadas por la integración

| Pantalla | Cambio |
|---|---|
| Menú → Mi plan médico | Lista las primeras 20 instituciones que cubre el plan y avisa cuántas más hay en el mapa |
| Menú → Instituciones favoritas | "Llamar" solo si la sede tiene teléfono (el REFES no lo trae) |
| Menú → Ayuda | Sección "Datos y fuentes": REFES (con versión y licencia) y datos del mapa |
| Admin → Instituciones | Primeras 30, altas nuevas arriba y texto de cobertura por institución |

## 4. Accesibilidad

- El mapa tiene `accessibilityLabel` y una **alternativa completa en lista**, que es la vía
  accesible para lectores de pantalla.
- Filtros, botones y marcadores de la lista tienen etiquetas. Áreas táctiles ≥ 44 px.
- La leyenda explica los colores con texto, no solo con color.
