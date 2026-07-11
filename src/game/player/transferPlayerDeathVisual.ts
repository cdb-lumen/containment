import type { DeathRequest } from '../effects/DeathVisualView';

type DeathVisualOwner = Readonly<{ spawnDeath(request: DeathRequest): boolean }>;
type PlayerPresentationOwner = Readonly<{ hidePresentation(): void }>;

export const transferPlayerDeathVisual = (
  deathVisuals: DeathVisualOwner | null,
  player: PlayerPresentationOwner,
  request: DeathRequest,
): boolean => {
  if (deathVisuals?.spawnDeath(request) !== true) return false;
  player.hidePresentation();
  return true;
};