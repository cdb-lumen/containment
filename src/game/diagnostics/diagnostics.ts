export type DiagnosticsPhase = string;

export interface DiagnosticsReadOnlyFields {
  readonly phase: DiagnosticsPhase;
  readonly playerHealth: number;
  readonly bossHealth: number;
  readonly activeEnemies: number;
  readonly activeProjectiles: number;
  readonly wave: number;
  readonly activeQuality: string;
  readonly touchControlsVisible: boolean;
}

export interface DiagnosticsActions {
  readonly startRun: () => void;
  readonly damagePlayer: (amount?: number) => void;
  readonly completeWave: () => void;
  readonly spawnStressWave: () => void;
  readonly defeatBoss: () => void;
  readonly restart: () => void;
}

export type DiagnosticsProvider = Readonly<
  DiagnosticsReadOnlyFields & DiagnosticsActions
>;

export type AlienGameDiagnostics = Readonly<
  DiagnosticsReadOnlyFields & DiagnosticsActions
>;

export type DiagnosticsCleanup = () => void;

declare global {
  interface Window {
    __ALIEN_GAME__?: AlienGameDiagnostics;
  }
}

const installationTokens = new WeakMap<object, symbol>();
const noCleanup: DiagnosticsCleanup = () => undefined;

const normalizedNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;

const normalizedCount = (value: unknown): number =>
  Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(normalizedNumber(value)));

const normalizedPhase = (value: unknown): DiagnosticsPhase => {
  if (typeof value !== 'string') return 'unknown';
  const phase = value.trim();
  return phase || 'unknown';
};

/**
 * Installs a live diagnostics facade for development automation only.
 * The facade contains accessors and delegated actions, never provider internals.
 */
export function installDiagnostics(
  provider: DiagnosticsProvider,
): DiagnosticsCleanup {
  if (!import.meta.env.DEV || typeof window === 'undefined') return noCleanup;

  const targetWindow = window;
  const existingDescriptor = Object.getOwnPropertyDescriptor(
    targetWindow,
    '__ALIEN_GAME__',
  );
  if (existingDescriptor && !existingDescriptor.configurable) return noCleanup;

  const token = Symbol('alien-game-diagnostics-installation');
  const diagnostics: AlienGameDiagnostics = Object.freeze({
    get phase(): DiagnosticsPhase {
      return normalizedPhase(provider.phase);
    },
    get playerHealth(): number {
      return normalizedNumber(provider.playerHealth);
    },
    get bossHealth(): number {
      return normalizedNumber(provider.bossHealth);
    },
    get activeEnemies(): number {
      return normalizedCount(provider.activeEnemies);
    },
    get activeProjectiles(): number {
      return normalizedCount(provider.activeProjectiles);
    },
    get wave(): number {
      return normalizedCount(provider.wave);
    },
    get activeQuality(): string {
      return normalizedPhase(provider.activeQuality);
    },
    get touchControlsVisible(): boolean {
      return provider.touchControlsVisible === true;
    },
    startRun: (): void => provider.startRun(),
    damagePlayer: (amount?: number): void => provider.damagePlayer(amount),
    completeWave: (): void => provider.completeWave(),
    spawnStressWave: (): void => provider.spawnStressWave(),
    defeatBoss: (): void => provider.defeatBoss(),
    restart: (): void => provider.restart(),
  });

  installationTokens.set(diagnostics, token);
  Object.defineProperty(targetWindow, '__ALIEN_GAME__', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: diagnostics,
  });

  let cleaned = false;
  return (): void => {
    if (cleaned) return;
    cleaned = true;

    const descriptor = Object.getOwnPropertyDescriptor(
      targetWindow,
      '__ALIEN_GAME__',
    );
    const installedValue = descriptor && 'value' in descriptor ? descriptor.value : null;
    if (
      typeof installedValue === 'object' &&
      installedValue !== null &&
      installationTokens.get(installedValue) === token
    ) {
      Reflect.deleteProperty(targetWindow, '__ALIEN_GAME__');
    }
    installationTokens.delete(diagnostics);
  };
}
