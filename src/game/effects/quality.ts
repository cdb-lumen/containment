export type QualityProfileName = 'low' | 'medium' | 'high';
export type QualitySelection = QualityProfileName | 'auto';

export interface EffectsQualityProfile {
  readonly dynamicLights: number;
  readonly particles: number;
  readonly decals: number;
  readonly remains: number;
  readonly shellCasings: number;
  readonly flash: number;
  readonly shake: number;
}

const profile = (value: EffectsQualityProfile): EffectsQualityProfile => Object.freeze(value);

export const QUALITY_PROFILES: Readonly<Record<QualityProfileName, EffectsQualityProfile>> = Object.freeze({
  low: profile({ dynamicLights: 4, particles: 64, decals: 32, remains: 8, shellCasings: 16, flash: 0.45, shake: 0.5 }),
  medium: profile({ dynamicLights: 8, particles: 128, decals: 64, remains: 16, shellCasings: 32, flash: 0.75, shake: 0.75 }),
  high: profile({ dynamicLights: 16, particles: 256, decals: 128, remains: 32, shellCasings: 64, flash: 1, shake: 1 }),
});

export interface AccessibilityEffectsSettings {
  readonly reducedFlash: boolean;
  readonly reducedShake: boolean;
}

export const resolveEffectsQuality = (
  name: QualityProfileName,
  settings: AccessibilityEffectsSettings,
): EffectsQualityProfile => {
  const base = QUALITY_PROFILES[name];
  if (!settings.reducedFlash && !settings.reducedShake) return base;
  return profile({
    ...base,
    flash: settings.reducedFlash ? Math.min(base.flash, 0.25) : base.flash,
    shake: settings.reducedShake ? 0 : base.shake,
  });
};

export interface QualityControllerOptions {
  readonly selection: QualitySelection;
  readonly initialAutoProfile?: QualityProfileName;
  readonly rollingWindowSize?: number;
  readonly slowFrameMs?: number;
}

const lowerProfile = (current: QualityProfileName): QualityProfileName =>
  current === 'high' ? 'medium' : 'low';

export class QualityController {
  private readonly automatic: boolean;
  private readonly windowSize: number;
  private readonly threshold: number;
  private samples: number[] = [];
  private current: QualityProfileName;

  constructor(options: QualityControllerOptions) {
    this.automatic = options.selection === 'auto';
    this.current = options.selection === 'auto' ? (options.initialAutoProfile ?? 'high') : options.selection;
    this.windowSize = options.rollingWindowSize ?? 120;
    this.threshold = options.slowFrameMs ?? 1000 / 50;
    if (!Number.isInteger(this.windowSize) || this.windowSize < 1) throw new RangeError('rollingWindowSize must be a positive integer');
    if (!Number.isFinite(this.threshold) || this.threshold <= 0) throw new RangeError('slowFrameMs must be positive');
  }

  get activeProfile(): QualityProfileName {
    return this.current;
  }

  recordFrame(frameMs: number): QualityProfileName {
    if (!this.automatic || this.current === 'low' || !Number.isFinite(frameMs) || frameMs < 0) return this.current;
    this.samples.push(frameMs);
    if (this.samples.length > this.windowSize) this.samples.shift();
    if (this.samples.length === this.windowSize && this.samples.every((sample) => sample > this.threshold)) {
      this.current = lowerProfile(this.current);
      this.samples = [];
    }
    return this.current;
  }
}
