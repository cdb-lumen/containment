export interface BootLifecycleReport {
  readonly preloadRuns: number;
  readonly createRuns: number;
  readonly loadedSheets: readonly string[];
  readonly fallbackSheets: readonly string[];
  readonly nearestFilteredSheets: readonly string[];
}

export interface BootLifecycleDiagnostics {
  readonly report: BootLifecycleReport;
  readonly restart: () => void;
}

declare global {
  interface Window {
    __ALIEN_BOOT__?: BootLifecycleDiagnostics;
  }
}

let preloadRuns = 0;
let createRuns = 0;
let loadedSheets: readonly string[] = [];
let fallbackSheets: readonly string[] = [];
let nearestFilteredSheets: readonly string[] = [];

const snapshot = (): BootLifecycleReport => Object.freeze({
  preloadRuns,
  createRuns,
  loadedSheets,
  fallbackSheets,
  nearestFilteredSheets,
});

export const noteBootPreload = (): void => {
  if (import.meta.env.DEV) preloadRuns += 1;
};

export const installBootLifecycleDiagnostics = (
  available: readonly string[],
  fallback: readonly string[],
  filtered: readonly string[],
  restart: () => void,
): void => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;

  createRuns += 1;
  loadedSheets = Object.freeze([...available]);
  fallbackSheets = Object.freeze([...fallback]);
  nearestFilteredSheets = Object.freeze([...filtered]);

  const diagnostics: BootLifecycleDiagnostics = Object.freeze({
    get report(): BootLifecycleReport {
      return snapshot();
    },
    restart,
  });

  Object.defineProperty(window, '__ALIEN_BOOT__', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: diagnostics,
  });
};
