export type DiagnosticsPhase = string;

export interface DiagnosticsReadOnlyFields {
  readonly phase: DiagnosticsPhase;
  readonly playerHealth: number;
  readonly bossHealth: number;
  readonly activeEnemies: number;
  readonly activeProjectiles: number;
  readonly activeEnemySkinKeys: readonly string[];
  readonly framedEnemyCount: number;
  readonly enemyVisualCount: number;
  readonly wave: number;
  readonly activeQuality: string;
  readonly presentationTimeMs: number;
  readonly reducedMotion: boolean;
  readonly reducedFlash: boolean;
  readonly touchControlsVisible: boolean;
  readonly playerSkinKey: string;
  readonly playerFrame: string;
  readonly playerAnimating: boolean;
  readonly playerRecoil: boolean;
  readonly playerHit: boolean;
  readonly playerVisualOffsetX: number;
  readonly playerVisualOffsetY: number;
  readonly playerVisualScaleX: number;
  readonly playerVisualScaleY: number;
  readonly playerVisualRotationOffset: number;
  readonly playerBodyRotation: number;
  readonly playerFallbackFramed: boolean;
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
    get activeEnemySkinKeys(): readonly string[] {
      return Object.freeze([...provider.activeEnemySkinKeys]);
    },
    get framedEnemyCount(): number {
      return normalizedCount(provider.framedEnemyCount);
    },
    get enemyVisualCount(): number {
      return normalizedCount(provider.enemyVisualCount);
    },
    get wave(): number {
      return normalizedCount(provider.wave);
    },
    get activeQuality(): string {
      return normalizedPhase(provider.activeQuality);
    },
    get presentationTimeMs(): number {
      return normalizedNumber(provider.presentationTimeMs);
    },
    get reducedMotion(): boolean { return provider.reducedMotion === true; },
    get reducedFlash(): boolean { return provider.reducedFlash === true; },
    get touchControlsVisible(): boolean {
      return provider.touchControlsVisible === true;
    },
    get playerSkinKey(): string {
      return normalizedPhase(provider.playerSkinKey);
    },
    get playerFrame(): string {
      return normalizedPhase(provider.playerFrame);
    },
    get playerAnimating(): boolean {
      return provider.playerAnimating === true;
    },
    get playerRecoil(): boolean {
      return provider.playerRecoil === true;
    },
    get playerHit(): boolean {
      return provider.playerHit === true;
    },
    get playerVisualOffsetX(): number { return provider.playerVisualOffsetX; },
    get playerVisualOffsetY(): number { return provider.playerVisualOffsetY; },
    get playerVisualScaleX(): number { return provider.playerVisualScaleX; },
    get playerVisualScaleY(): number { return provider.playerVisualScaleY; },
    get playerVisualRotationOffset(): number { return provider.playerVisualRotationOffset; },
    get playerBodyRotation(): number { return provider.playerBodyRotation; },
    get playerFallbackFramed(): boolean { return provider.playerFallbackFramed === true; },
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
