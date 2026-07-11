import type { SaveData } from '../persistence/saveData';
import { calculateScore } from '../scoring/score';
import { UPGRADES, type UpgradeId } from '../upgrades/catalog';

export const MAX_RUN_ELAPSED_MS = 86_400_000;
export const MAX_RUN_KILLS = 1_000_000;
export const MAX_RUN_WAVES_CLEARED = 10_000;
export const MAX_RUN_UNSPENT_CREDITS = 1_000_000_000;
const UPGRADE_IDS = Object.freeze(Object.keys(UPGRADES) as UpgradeId[]);

type RunRecords = SaveData['records'];

export type RunOutcome = 'active' | 'victory' | 'defeat';
export type RunEventId = string | number;
export type UpgradeLevelsInput = Readonly<Record<string, number>>;

export type SelectedUpgrade = Readonly<{
  id: UpgradeId;
  label: string;
  level: number;
}>;

export type RunResult = Readonly<{
  started: boolean;
  ended: boolean;
  outcome: RunOutcome;
  score: number;
  kills: number;
  eliteKills: number;
  wavesCleared: number;
  elapsedMs: number;
  bossDefeated: boolean;
  creditsUnspent: number;
  selectedUpgrades: readonly SelectedUpgrade[];
}>;

export type RunRecordUpdate = Readonly<{
  previous: Readonly<RunRecords>;
  best: Readonly<RunRecords>;
  isNewBestScore: boolean;
  isNewBestTime: boolean;
}>;

const safeWhole = (value: unknown, maximum: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(Math.floor(value), maximum);
};

const isEventId = (value: unknown): value is RunEventId =>
  (typeof value === 'string' && value.length > 0 && value.length <= 1_024) ||
  (typeof value === 'number' && Number.isSafeInteger(value));

const cloneSelectedUpgrades = (
  upgrades: readonly SelectedUpgrade[],
): readonly SelectedUpgrade[] =>
  Object.freeze(
    upgrades.map((upgrade) =>
      Object.freeze({
        id: upgrade.id,
        label: upgrade.label,
        level: upgrade.level,
      }),
    ),
  );

const normalizeUpgrades = (
  levels: UpgradeLevelsInput | null | undefined,
): readonly SelectedUpgrade[] => {
  if (typeof levels !== 'object' || levels === null || Array.isArray(levels)) {
    return Object.freeze([]);
  }

  const selected: SelectedUpgrade[] = [];
  for (const id of UPGRADE_IDS) {
    const level = safeWhole(levels[id], UPGRADES[id].maxLevel);
    if (level > 0) {
      selected.push(
        Object.freeze({ id, label: UPGRADES[id].label, level }),
      );
    }
  }

  return Object.freeze(selected);
};

const freezeResult = (
  result: Omit<RunResult, 'selectedUpgrades'> & {
    selectedUpgrades: readonly SelectedUpgrade[];
  },
): RunResult =>
  Object.freeze({
    ...result,
    selectedUpgrades: cloneSelectedUpgrades(result.selectedUpgrades),
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeSelectedUpgrades = (
  value: unknown,
): readonly SelectedUpgrade[] | null => {
  if (!Array.isArray(value) || value.length > UPGRADE_IDS.length) return null;
  const selected: SelectedUpgrade[] = [];
  const seen = new Set<UpgradeId>();
  for (const candidate of value) {
    if (!isRecord(candidate)) return null;
    const id = candidate.id;
    const level = candidate.level;
    if (
      typeof id !== 'string' ||
      !Object.hasOwn(UPGRADES, id) ||
      seen.has(id as UpgradeId) ||
      !Number.isSafeInteger(level) ||
      (level as number) <= 0 ||
      (level as number) > UPGRADES[id as UpgradeId].maxLevel
    ) {
      return null;
    }
    const upgradeId = id as UpgradeId;
    seen.add(upgradeId);
    selected.push(
      Object.freeze({
        id: upgradeId,
        label: UPGRADES[upgradeId].label,
        level: level as number,
      }),
    );
  }
  selected.sort(
    (left, right) => UPGRADE_IDS.indexOf(left.id) - UPGRADE_IDS.indexOf(right.id),
  );
  return Object.freeze(selected);
};

/** Canonicalizes an untrusted finished-run payload without trusting its score. */
export const sanitizeRunResult = (value: unknown): RunResult | null => {
  if (!isRecord(value)) return null;
  const upgrades = normalizeSelectedUpgrades(value.selectedUpgrades);
  const outcome = value.outcome;
  const kills = value.kills;
  const eliteKills = value.eliteKills;
  const wavesCleared = value.wavesCleared;
  const elapsedMs = value.elapsedMs;
  const creditsUnspent = value.creditsUnspent;
  const bossDefeated = value.bossDefeated;
  if (
    value.started !== true ||
    value.ended !== true ||
    (outcome !== 'victory' && outcome !== 'defeat') ||
    !Number.isSafeInteger(kills) ||
    (kills as number) < 0 ||
    (kills as number) > MAX_RUN_KILLS ||
    !Number.isSafeInteger(eliteKills) ||
    (eliteKills as number) < 0 ||
    (eliteKills as number) > (kills as number) ||
    !Number.isSafeInteger(wavesCleared) ||
    (wavesCleared as number) < 0 ||
    (wavesCleared as number) > MAX_RUN_WAVES_CLEARED ||
    !Number.isSafeInteger(elapsedMs) ||
    (elapsedMs as number) < 0 ||
    (elapsedMs as number) > MAX_RUN_ELAPSED_MS ||
    !Number.isSafeInteger(creditsUnspent) ||
    (creditsUnspent as number) < 0 ||
    (creditsUnspent as number) > MAX_RUN_UNSPENT_CREDITS ||
    typeof bossDefeated !== 'boolean' ||
    bossDefeated !== (outcome === 'victory') ||
    upgrades === null
  ) {
    return null;
  }

  const canonicalScore = calculateScore({
    kills: kills as number,
    eliteKills: eliteKills as number,
    bossDefeated,
    wavesCleared: wavesCleared as number,
    creditsUnspent: creditsUnspent as number,
    elapsedMs: elapsedMs as number,
  });
  return freezeResult({
    started: true,
    ended: true,
    outcome,
    score: canonicalScore,
    kills: kills as number,
    eliteKills: eliteKills as number,
    wavesCleared: wavesCleared as number,
    elapsedMs: elapsedMs as number,
    bossDefeated,
    creditsUnspent: creditsUnspent as number,
    selectedUpgrades: upgrades,
  });
};

export class RunState {
  private hasStarted = false;
  private hasEnded = false;
  private currentOutcome: RunOutcome = 'active';
  private elapsed = 0;
  private killCount = 0;
  private eliteKillCount = 0;
  private bossWasDefeated = false;
  private readonly defeatedEnemyIds = new Set<RunEventId>();
  private readonly clearedWaveIds = new Set<number>();
  private finalizedCredits = 0;
  private finalizedUpgrades: readonly SelectedUpgrade[] = Object.freeze([]);

  start(): void {
    if (this.hasStarted || this.hasEnded) {
      return;
    }

    this.hasStarted = true;
  }

  update(deltaMs: number): void {
    if (
      !this.hasStarted ||
      this.hasEnded ||
      !Number.isFinite(deltaMs) ||
      deltaMs <= 0
    ) {
      return;
    }

    this.elapsed = Math.min(this.elapsed + deltaMs, MAX_RUN_ELAPSED_MS);
  }

  recordEnemyDefeated(elite: boolean, enemyId?: RunEventId): void {
    if (!this.hasStarted || this.hasEnded || elite !== true && elite !== false) {
      return;
    }

    if (enemyId !== undefined) {
      if (!isEventId(enemyId) || this.defeatedEnemyIds.has(enemyId)) {
        return;
      }
      this.defeatedEnemyIds.add(enemyId);
    }

    if (this.killCount >= MAX_RUN_KILLS) {
      return;
    }

    this.killCount += 1;
    if (elite && this.eliteKillCount < MAX_RUN_KILLS) {
      this.eliteKillCount += 1;
    }
  }

  recordWaveCleared(wave: number): void {
    if (
      !this.hasStarted ||
      this.hasEnded ||
      !Number.isSafeInteger(wave) ||
      wave <= 0 ||
      wave > MAX_RUN_WAVES_CLEARED ||
      this.clearedWaveIds.has(wave) ||
      this.clearedWaveIds.size >= MAX_RUN_WAVES_CLEARED
    ) {
      return;
    }

    this.clearedWaveIds.add(wave);
  }

  finishVictory(
    upgradeLevels: UpgradeLevelsInput,
    creditsUnspent: number,
  ): RunResult {
    return this.finish('victory', upgradeLevels, creditsUnspent);
  }

  finishDefeat(
    upgradeLevels: UpgradeLevelsInput,
    creditsUnspent: number,
  ): RunResult {
    return this.finish('defeat', upgradeLevels, creditsUnspent);
  }

  snapshot(
    upgradeLevels: UpgradeLevelsInput = {},
    creditsUnspent = 0,
  ): RunResult {
    const selectedUpgrades = this.hasEnded
      ? this.finalizedUpgrades
      : normalizeUpgrades(upgradeLevels);
    const credits = this.hasEnded
      ? this.finalizedCredits
      : safeWhole(creditsUnspent, MAX_RUN_UNSPENT_CREDITS);
    const elapsedMs = Math.floor(this.elapsed);
    const wavesCleared = this.clearedWaveIds.size;
    const score = calculateScore({
      kills: this.killCount,
      eliteKills: this.eliteKillCount,
      bossDefeated: this.bossWasDefeated,
      wavesCleared,
      creditsUnspent: credits,
      elapsedMs,
    });

    return freezeResult({
      started: this.hasStarted,
      ended: this.hasEnded,
      outcome: this.currentOutcome,
      score,
      kills: this.killCount,
      eliteKills: this.eliteKillCount,
      wavesCleared,
      elapsedMs,
      bossDefeated: this.bossWasDefeated,
      creditsUnspent: credits,
      selectedUpgrades,
    });
  }

  reset(): void {
    this.hasStarted = false;
    this.hasEnded = false;
    this.currentOutcome = 'active';
    this.elapsed = 0;
    this.killCount = 0;
    this.eliteKillCount = 0;
    this.bossWasDefeated = false;
    this.defeatedEnemyIds.clear();
    this.clearedWaveIds.clear();
    this.finalizedCredits = 0;
    this.finalizedUpgrades = Object.freeze([]);
  }

  private finish(
    outcome: Exclude<RunOutcome, 'active'>,
    upgradeLevels: UpgradeLevelsInput,
    creditsUnspent: number,
  ): RunResult {
    if (!this.hasStarted || this.hasEnded) {
      return this.snapshot();
    }

    this.hasEnded = true;
    this.currentOutcome = outcome;
    this.bossWasDefeated = outcome === 'victory';
    this.finalizedCredits = safeWhole(creditsUnspent, MAX_RUN_UNSPENT_CREDITS);
    this.finalizedUpgrades = normalizeUpgrades(upgradeLevels);
    return this.snapshot();
  }
}

const normalizeCurrentRecords = (current: unknown): RunRecords => {
  if (typeof current !== 'object' || current === null || Array.isArray(current)) {
    return { bestScore: 0, bestTimeMs: null };
  }

  const candidate = current as Partial<Record<keyof RunRecords, unknown>>;
  const bestScore =
    typeof candidate.bestScore === 'number' &&
    Number.isSafeInteger(candidate.bestScore) &&
    candidate.bestScore >= 0
      ? candidate.bestScore
      : 0;
  const bestTimeMs =
    typeof candidate.bestTimeMs === 'number' &&
    Number.isSafeInteger(candidate.bestTimeMs) &&
    candidate.bestTimeMs >= 0
      ? candidate.bestTimeMs
      : null;

  return { bestScore, bestTimeMs };
};

export const updateRunRecords = (
  currentRecords: unknown,
  result: RunResult,
): RunRecordUpdate => {
  const normalized = normalizeCurrentRecords(currentRecords);
  const previous = Object.freeze({ ...normalized });
  const resultScore = safeWhole(result.score, Number.MAX_SAFE_INTEGER);
  const isNewBestScore = resultScore > normalized.bestScore;

  const victoryTime =
    result.outcome === 'victory' &&
    Number.isSafeInteger(result.elapsedMs) &&
    result.elapsedMs >= 0
      ? Math.min(result.elapsedMs, MAX_RUN_ELAPSED_MS)
      : null;
  const isNewBestTime =
    victoryTime !== null &&
    (normalized.bestTimeMs === null || victoryTime < normalized.bestTimeMs);

  const best = Object.freeze({
    bestScore: isNewBestScore ? resultScore : normalized.bestScore,
    bestTimeMs: isNewBestTime ? victoryTime : normalized.bestTimeMs,
  });

  return Object.freeze({
    previous,
    best,
    isNewBestScore,
    isNewBestTime,
  });
};
