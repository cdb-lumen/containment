export type ScoreInput = {
  kills: number;
  eliteKills: number;
  bossDefeated: boolean;
  wavesCleared: number;
  creditsUnspent: number;
  elapsedMs: number;
};

const KILL_POINTS = 100;
const ELITE_KILL_POINTS = 500;
const WAVE_POINTS = 1_000;
const BOSS_POINTS = 25_000;
const CREDIT_POINTS = 2;
const MAX_TIME_BONUS = 15_000;
const TIME_BONUS_WINDOW_MS = 1_500_000;
const MAX_KILLS = 1_000_000;
const MAX_ELITE_KILLS = 1_000_000;
const MAX_WAVES_CLEARED = 10_000;
const MAX_UNSPENT_CREDITS = 1_000_000_000;

const safeWhole = (value: number, maximum: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(Math.floor(value), maximum);
};

const completionTimeBonus = (elapsedMs: number): number => {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return 0;
  }

  const safeElapsedMs = Math.min(
    Math.max(Math.floor(elapsedMs), 0),
    TIME_BONUS_WINDOW_MS,
  );
  const remainingMs = TIME_BONUS_WINDOW_MS - safeElapsedMs;
  return Math.floor((remainingMs / TIME_BONUS_WINDOW_MS) * MAX_TIME_BONUS);
};

export const calculateScore = (input: ScoreInput): number => {
  const kills = safeWhole(input.kills, MAX_KILLS);
  const eliteKills = safeWhole(input.eliteKills, MAX_ELITE_KILLS);
  const wavesCleared = safeWhole(input.wavesCleared, MAX_WAVES_CLEARED);
  const creditsUnspent = safeWhole(input.creditsUnspent, MAX_UNSPENT_CREDITS);

  const score =
    kills * KILL_POINTS +
    eliteKills * ELITE_KILL_POINTS +
    wavesCleared * WAVE_POINTS +
    creditsUnspent * CREDIT_POINTS +
    (input.bossDefeated === true
      ? BOSS_POINTS + completionTimeBonus(input.elapsedMs)
      : 0);

  return Math.max(0, Math.floor(score));
};
