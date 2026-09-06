import {MUTATION_IDS} from './mutationCatalog';
import { isValidBuildState } from './builds';
import { isValidRunState } from './run';
import type { RunCheckpoint, RunResources, RunState } from './types';

/** Inject storage explicitly; this module never reads window or localStorage. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const CHECKPOINT_STORAGE_KEY = 'containment-depth:run:v1';
/** UTF-16 code units; the valid schema contains only bounded, known identifiers. */
export const MAX_CHECKPOINT_LENGTH = 16_384;
/** Persistence format limits, not gameplay balance or inventory capacity rules. */
export const CHECKPOINT_RESOURCE_LIMITS = Object.freeze({
  health: 10_000,
  armor: 10_000,
  credits: 1_000_000_000,
  grenades: 999,
  medkits: 999,
  magazine: 100_000,
  reserve: 100_000,
});

export type SaveCheckpointResult = Readonly<{
  /** skipped preserves the last completed-room save during combat. */
  status: 'saved' | 'skipped' | 'cleared' | 'invalid' | 'unavailable';
}>;

const WEAPONS = ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'] as const;
const RUN_KEYS = ['version', 'seed', 'currentNodeId', 'completedNodeIds', 'phase'] as const;

function exactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const actual = Reflect.ownKeys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function boundedNumber(value: unknown, min: number, max: number, integer = false): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max &&
    (!integer || Number.isSafeInteger(value));
}

function validRun(value: unknown): value is RunState {
  return (exactRecord(value, RUN_KEYS)||exactRecord(value,[...RUN_KEYS,'draftRoll'])) &&
    boundedNumber(value.seed, 0, 0xffff_ffff, true) &&
    Array.isArray(value.completedNodeIds) && value.completedNodeIds.length <= 12 &&
    isValidRunState(value);
}

function validCheckpoint(value: unknown): value is RunCheckpoint {
  if (!exactRecord(value, ['version', 'savedAt', 'run', 'build', 'resources']) ||
    value.version !== 1 || !boundedNumber(value.savedAt, 0, Number.MAX_SAFE_INTEGER, true) ||
    !validRun(value.run) ||
    (value.run.phase !== 'reward' && value.run.phase !== 'route') ||
    !exactRecord(value.build, ['mutations']) || !Array.isArray(value.build.mutations) ||
    value.build.mutations.length > MUTATION_IDS.length || !isValidBuildState(value.build) ||
    !isValidRunResources(value.resources) || value.resources.health <= 0) {
    return false;
  }
  return true;
}

function validResources(resources: unknown): resources is RunResources {
  if (!exactRecord(resources, ['health', 'armor', 'credits', 'grenades', 'medkits', 'weapon', 'ammo'])) return false;
  const limits = CHECKPOINT_RESOURCE_LIMITS;
  if (!boundedNumber(resources.health, 0, limits.health) ||
    !boundedNumber(resources.armor, 0, limits.armor) ||
    !boundedNumber(resources.credits, 0, limits.credits, true) ||
    !boundedNumber(resources.grenades, 0, limits.grenades, true) ||
    !boundedNumber(resources.medkits, 0, limits.medkits, true) ||
    !WEAPONS.some((weapon) => weapon === resources.weapon) ||
    !exactRecord(resources.ammo, WEAPONS)) return false;

  return WEAPONS.every((weapon) => {
    const ammo = (resources.ammo as Record<string, unknown>)[weapon];
    return exactRecord(ammo, ['magazine', 'reserve']) &&
      boundedNumber(ammo.magazine, 0, limits.magazine, true) &&
      ((weapon === 'pistol' && ammo.reserve === -1) || boundedNumber(ammo.reserve, 0, limits.reserve, true));
  });
}

/**
 * Validate an exact bounded resource snapshot. Zero health is valid here for
 * terminal/combat snapshots, but is rejected by resumable checkpoint validation.
 */
export function isValidRunResources(value: unknown): value is RunResources {
  try {
    return validResources(value);
  } catch {
    return false;
  }
}

/**
 * Serialize a complete version-1 checkpoint supplied with its savedAt timestamp.
 * Only reward/route boundaries with a living player are resumable. The caller must
 * encode infinite pistol reserve as -1; Infinity is rejected, never JSON-coerced.
 * Invalid input, cyclic objects and throwing getters return null without throwing.
 */
export function serializeCheckpoint(checkpoint: unknown): string | null {
  try {
    if (!validCheckpoint(checkpoint)) return null;
    const serialized = JSON.stringify(checkpoint);
    // Revalidate serialized output to reject inherited toJSON transformations.
    return typeof serialized === 'string' && parseCheckpoint(serialized) !== null ? serialized : null;
  } catch {
    return null;
  }
}

/**
 * Parse a bounded exact-schema save. No migrations, repairs, defaults, or phase
 * advancement: unresolved reward and route choices survive exactly as recorded.
 * Run validation checks the graph regenerated from the recorded seed.
 */
export function parseCheckpoint(serialized: unknown): RunCheckpoint | null {
  if (typeof serialized !== 'string' || serialized.length > MAX_CHECKPOINT_LENGTH) return null;
  try {
    const parsed: unknown = JSON.parse(serialized);
    return validCheckpoint(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Remove only this module's key; report disabled storage/removal failure. */
export function clearCheckpoint(storage: StorageLike | null | undefined): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(CHECKPOINT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Store a validated boundary in one setItem call. Invalid/combat input never
 * overwrites a previous save. A validated dead/complete run clears the previous
 * checkpoint even when its terminal resource/build snapshot is not resumable.
 * 'unavailable' includes quota/security errors and failed terminal removal; the
 * host must honor that result rather than claiming a terminal save was cleared.
 */
export function saveCheckpoint(
  storage: StorageLike | null | undefined,
  checkpoint: unknown,
): SaveCheckpointResult {
  try {
    if (typeof checkpoint !== 'object' || checkpoint === null || !('run' in checkpoint) ||
      !validRun(checkpoint.run)) return { status: 'invalid' };
    if (checkpoint.run.phase === 'dead' || checkpoint.run.phase === 'complete') {
      return { status: clearCheckpoint(storage) ? 'cleared' : 'unavailable' };
    }
    if (checkpoint.run.phase === 'combat') return { status: 'skipped' };
    const serialized = serializeCheckpoint(checkpoint);
    if (serialized === null) return { status: 'invalid' };
    if (!storage) return { status: 'unavailable' };
    storage.setItem(CHECKPOINT_STORAGE_KEY, serialized);
    return { status: 'saved' };
  } catch {
    return { status: 'unavailable' };
  }
}

/** Missing, malformed, unsupported, and unreadable saves all load as null. */
export function loadCheckpoint(storage: StorageLike | null | undefined): RunCheckpoint | null {
  try {
    return storage ? parseCheckpoint(storage.getItem(CHECKPOINT_STORAGE_KEY)) : null;
  } catch {
    return null;
  }
}
