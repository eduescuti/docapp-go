// React Native trae `requestIdleCallback` (ver Libraries/Core/Timers), pero sus tipos no lo declaran.
// Reemplaza a `InteractionManager.runAfterInteractions`, que quedó deprecado.
declare function requestIdleCallback(callback: () => void, options?: { timeout?: number }): number;
declare function cancelIdleCallback(handle: number): void;
