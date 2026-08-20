# DocApp Go

App móvil de gestión de turnos y servicios médicos multi-hospital. Trabajo práctico de
**Programación de Apps Móviles (UCA)**.

El contexto completo del proyecto (modelo de dominio, reglas de negocio, sistema de diseño,
alcance del MVP) vive en [`CLAUDE.md`](../CLAUDE.md), un nivel arriba de esta carpeta. Léelo
antes de tocar código.

## Stack

- React Native + **Expo SDK 54** (pineado — no actualizar sin confirmación)
- TypeScript (`strict: true`)
- Expo Router (navegación file-based)
- `react-native-maps` (Google Maps)

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completar EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
npx expo start
```

Escaneá el QR con la app Expo Go (Android) para probar en el celular.

## Scripts

```bash
npx expo start        # levanta el bundler
npx expo start -c     # idem, limpiando caché de Metro
npm run typecheck     # tsc --noEmit
```

## Estructura

Ver CLAUDE.md §4 para el detalle de `app/` y `src/`. En resumen:

- `app/` — rutas de Expo Router, agrupadas por rol: `(auth)`, `(paciente)`, `(doctor)`, `(admin)`.
- `src/theme/` — los tres temas tipados del sistema de diseño (A, B, C — este último es el modo oscuro).
- `src/domain/` — tipos del dominio médico.
- `src/services/` — la única puerta de entrada a los datos; hoy leen `src/mocks/`, mañana un backend real.
- `src/mocks/` — datos de prueba.

## Estado

Base funcional del **modo paciente** (las 7 pantallas de referencia en `/template-ejemplo-figma`)
sobre navegación, tema y datos mockeados. Los modos doctor y admin tienen la navegación
lista y pantallas placeholder — ver CLAUDE.md §13 para el detalle de qué falta.
