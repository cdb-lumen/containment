import { QUALITY_PROFILES, type QualityProfileName } from './quality';

export type EffectKind =
  | 'dynamicLights'
  | 'particles'
  | 'decals'
  | 'remains'
  | 'shellCasings';

export interface EffectInput {
  readonly label?: string;
  readonly essential?: boolean;
  readonly major?: boolean;
}

export interface EffectRecord {
  readonly id: number;
  readonly kind: EffectKind;
  readonly label?: string;
  readonly essential: boolean;
  readonly major: boolean;
}

export type EffectRequest = Readonly<{ kind: EffectKind; input?: EffectInput }>;
export type EffectLimits = Readonly<Record<EffectKind, number>>;
export type AtomicEffectPlan = Readonly<{
  added: readonly EffectRecord[];
  retiredIds: readonly number[];
}>;

type PlanState = Readonly<{
  revision: number;
  nextId: number;
  effects: Record<EffectKind, EffectRecord[]>;
}>;

export const EFFECT_KINDS: readonly EffectKind[] = Object.freeze([
  'dynamicLights',
  'particles',
  'decals',
  'remains',
  'shellCasings',
]);

const limitsFor = (profile: QualityProfileName): EffectLimits => {
  const source = QUALITY_PROFILES[profile];
  return Object.freeze(
    Object.fromEntries(EFFECT_KINDS.map((kind) => [kind, source[kind]])),
  ) as EffectLimits;
};

export class EffectsSystem {
  private currentProfile: QualityProfileName;
  private currentLimits: EffectLimits;
  private nextId = 1;
  private revision = 0;
  private readonly plans = new WeakMap<AtomicEffectPlan, PlanState>();
  private readonly effects: Record<EffectKind, EffectRecord[]> = {
    dynamicLights: [],
    particles: [],
    decals: [],
    remains: [],
    shellCasings: [],
  };

  constructor(profile: QualityProfileName) {
    this.currentProfile = profile;
    this.currentLimits = limitsFor(profile);
  }

  get profile(): QualityProfileName {
    return this.currentProfile;
  }

  get limits(): EffectLimits {
    return this.currentLimits;
  }

  setProfile(profile: QualityProfileName): void {
    if (profile === this.currentProfile) return;
    this.currentProfile = profile;
    this.currentLimits = limitsFor(profile);
    for (const kind of EFFECT_KINDS) {
      const collection = this.effects[kind];
      while (collection.length > this.currentLimits[kind]) {
        const retirement = this.retirementIndex(kind, collection);
        collection.splice(retirement >= 0 ? retirement : 0, 1);
      }
    }
    this.revision += 1;
  }

  add(kind: EffectKind, input: EffectInput = {}): EffectRecord | null {
    return this.addAtomic([{ kind, input }])?.[0] ?? null;
  }

  addAtomic(requests: readonly EffectRequest[]): readonly EffectRecord[] | null {
    const plan = this.planAtomic(requests);
    if (!plan || !this.commitAtomic(plan)) return null;
    return plan.added;
  }

  planAtomic(requests: readonly EffectRequest[]): AtomicEffectPlan | null {
    const simulated = Object.fromEntries(
      EFFECT_KINDS.map((kind) => [kind, [...this.effects[kind]]]),
    ) as Record<EffectKind, EffectRecord[]>;
    let simulatedNextId = this.nextId;
    const admitted: EffectRecord[] = [];
    const retiredIds: number[] = [];
    for (const { kind, input = {} } of requests) {
      const collection = simulated[kind];
      if (collection.length >= this.currentLimits[kind]) {
        const retireIndex = this.retirementIndex(kind, collection);
        if (retireIndex < 0) return null;
        retiredIds.push(collection.splice(retireIndex, 1)[0]!.id);
      }
      const effect: EffectRecord = Object.freeze({
        id: simulatedNextId++, kind, label: input.label,
        essential: input.essential === true,
        major: kind === 'remains' && input.major === true,
      });
      collection.push(effect);
      admitted.push(effect);
    }
    const plan: AtomicEffectPlan = Object.freeze({
      added: Object.freeze(admitted),
      retiredIds: Object.freeze(retiredIds),
    });
    this.plans.set(plan, {
      revision: this.revision,
      nextId: simulatedNextId,
      effects: simulated,
    });
    return plan;
  }

  commitAtomic(plan: AtomicEffectPlan): boolean {
    const state = this.plans.get(plan);
    if (!state || state.revision !== this.revision) return false;
    for (const kind of EFFECT_KINDS) {
      this.effects[kind].splice(0, this.effects[kind].length, ...state.effects[kind]);
    }
    this.nextId = state.nextId;
    this.revision += 1;
    this.plans.delete(plan);
    return true;
  }

  remove(id: number): boolean {
    if (!Number.isSafeInteger(id) || id < 1) return false;
    for (const kind of EFFECT_KINDS) {
      const collection = this.effects[kind];
      const index = collection.findIndex((effect) => effect.id === id);
      if (index < 0) continue;
      collection.splice(index, 1);
      this.revision += 1;
      return true;
    }
    return false;
  }

  clear(): void {
    for (const kind of EFFECT_KINDS) this.effects[kind].length = 0;
    this.nextId = 1;
    this.revision += 1;
  }

  count(kind: EffectKind): number {
    return this.effects[kind].length;
  }

  snapshot(kind: EffectKind): readonly EffectRecord[] {
    return Object.freeze([...this.effects[kind]]);
  }

  private retirementIndex(
    kind: EffectKind,
    effects: readonly EffectRecord[],
  ): number {
    if (kind === 'remains') {
      const transient = effects.findIndex(
        (effect) => !effect.essential && !effect.major,
      );
      if (transient >= 0) return transient;
    }
    return effects.findIndex((effect) => !effect.essential);
  }
}
