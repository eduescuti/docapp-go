/**
 * Simula la latencia de una API real. Los services de hoy leen mocks; el día
 * que haya backend, solo cambia la implementación interna de cada service,
 * nunca su firma (CLAUDE.md §4).
 */
export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
