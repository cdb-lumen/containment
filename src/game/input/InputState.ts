import type { WeaponId } from '../combat/types';

export type NormalizedMovement = Readonly<{
  x: number;
  y: number;
}>;

export type InputState = Readonly<{
  movementX: number;
  movementY: number;
  aimWorldX: number;
  aimWorldY: number;
  fireHeld: boolean;
  reloadPressed: boolean;
  grenadePressed: boolean;
  interactPressed: boolean;
  medkitPressed: boolean;
  pausePressed: boolean;
  weaponPressed: WeaponId | null;
}>;

/** Sanitizes, clamps, and length-normalizes a movement vector. */
export const normalizeMovement = (x: number, y: number): NormalizedMovement => {
  let normalizedX = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
  let normalizedY = Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0;
  const magnitudeSquared = normalizedX * normalizedX + normalizedY * normalizedY;

  if (magnitudeSquared > 1) {
    const inverseMagnitude = 1 / Math.sqrt(magnitudeSquared);
    normalizedX *= inverseMagnitude;
    normalizedY *= inverseMagnitude;
  }

  return Object.freeze({ x: normalizedX, y: normalizedY });
};

export const EMPTY_INPUT_STATE: InputState = Object.freeze({
  movementX: 0,
  movementY: 0,
  aimWorldX: 0,
  aimWorldY: 0,
  fireHeld: false,
  reloadPressed: false,
  grenadePressed: false,
  interactPressed: false,
  medkitPressed: false,
  pausePressed: false,
  weaponPressed: null,
});
