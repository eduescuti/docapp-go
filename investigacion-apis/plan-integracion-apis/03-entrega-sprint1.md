# 3. Entrega del Sprint 1

[← Volver al plan](README.md)

Consigna: **Sprint 1 – FrontEnd** (EVA UCA, cierre **jueves 15/10/2026, 18:00 hs**). Docentes:
Ing. Ignacio Parravicini e Ing. Martín Buzzetti. Leída el 08/10/2026.

## 1. Qué pide la consigna y dónde está cada cosa

| Criterio de la consigna | Qué piden | Dónde lo tenemos |
|---|---|---|
| 1.1 Temática | Problema, público objetivo, diferencial, modelo de negocio | CLAUDE.md §1 y §12 → hay que redactarlo para el PDF |
| 1.2 Branding | Nombre, paleta en HEX, tipografías, isotipo/logotipo | CLAUDE.md §7 (temas A y C, Inter / Playfair Display / Plus Jakarta Sans). **Falta un isologo definitivo** |
| 1.3 Mockup | Pantallas con información estática **que muestren los flujos de navegación**, con URL pública | **`DocApp Go/mockup/index.html`** — emulador interactivo (ver abajo) |
| 1.4 Componentes nativos | Al menos 2, con justificación técnica | **GPS** (`expo-location`, en el mapa y el Inicio) y **notificaciones push** (`expo-notifications`, planificado). El mapa pasó a MapLibre en un WebView (no es un componente nativo); ver [doc 8](../08-motor-del-mapa.md). Si el docente exige el SDK de Google Maps, se suma para la app compilada |
| 1.5 Desarrollo | Expo inicializado, router, navegación y pantallas en base al mockup | `DocApp Go/frontend/` (CLAUDE.md §13) |
| Formato | **Un único PDF** con URL pública del mockup y URL pública del repositorio | Ver "Pendientes" |

## 2. El mockup interactivo

Archivo: `DocApp Go/mockup/index.html`. Un solo HTML, sin dependencias además de Google Fonts.
Se abre con doble clic en cualquier navegador.

- **Emulador de teléfono** en el centro: las 23 pantallas de los tres roles, con los mismos
  datos de ejemplo que `src/mocks/`. Se navega tocando dentro del teléfono como en la app
  (tabs, botones, tarjetas) o con las flechas del teclado.
- **Índice** a la izquierda, agrupado por rol (Acceso · Paciente · Profesional · Administrador),
  con marcas de qué pantallas usan hardware del teléfono (**Nativo**) y cuáles se completan con
  este plan (**Plan**).
- **Ficha técnica** a la derecha: qué muestra la pantalla, qué se puede tocar y a dónde lleva,
  de qué service salen los datos, componente nativo y fase del plan que la afecta.
- **Flujo principal del paciente** siempre visible: Login → Inicio → Buscar → Médico → Reservar
  → Mis turnos → Calificar.
- **Tema claro / oscuro** de la app (temas A y C). La pantalla Configuración también lo cambia.
- El **mapa** ya usa establecimientos reales del REFES de CABA (Hospital Fernández, Hospital
  Alemán, Sanatorio Güemes, Hospital de Clínicas, Hospital Italiano) con la regla de cobertura
  propuesta (D1). Qué cobertura acepta cada privado es **un ejemplo** hasta completar la Fase 3.

**Por qué HTML y no PDF:** el criterio 3.3 evalúa el *flujo de navegación*; un PDF muestra
capturas sueltas, el HTML deja recorrerlo. El PDF de entrega igual es obligatorio: tiene que
incluir el link al mockup y algunas capturas del emulador.

## 3. Pendientes para entregar

| # | Pendiente | Comentario |
|---|---|---|
| 1 | **URL pública del mockup** | El mockup está publicado como artifact privado de claude.ai: hay que compartirlo con acceso público desde el menú *Compartir*. Alternativa: GitHub Pages desde un repo público |
| 2 | **URL pública del repositorio** | `github.com/eduescuti/docapp-go` hoy es **privado**. La consigna pide el repo del frontend público: hacerlo público o pedirle a los docentes acceso |
| 3 | **Grupo en EVA** | La página de la tarea dice "No perteneces a ningún grupo": hay que pedirle al docente que te agregue a un grupo para poder entregar |
| 4 | Isologo | Definir el isotipo de la app (hoy es un ícono de estetoscopio) |
| 5 | PDF | Temática, branding, link al mockup + capturas, componentes nativos con justificación, link al repo |
