import type { CharacterFrameName, CharacterSkinId } from './characterSkins';

export type CharacterAnimationInput = Readonly<{
  skin: CharacterSkinId;
  entityId: number;
  nowMs: number;
  velocityX: number;
  velocityY: number;
  attackUntilMs: number;
  hitUntilMs: number;
  dead: boolean;
  quality: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  reducedFlash: boolean;
}>;

export type CharacterAnimationOutput = Readonly<{
  frame: CharacterFrameName;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  rotationOffset: number;
  emissiveAlpha: number;
  hitBrightness: number;
}>;

const finite = (value: number): number => (Number.isFinite(value) ? value : 0);
const TAU = Math.PI * 2;

/** Stable multiplicative hash, deliberately normalizing fractional and invalid ids. */
export const animationPhaseForId = (id: number): number => {
  const normalized = Number.isFinite(id) ? Math.trunc(id) : 0;
  const hash = Math.imul(normalized | 0, 0x9e3779b1) >>> 0;
  return hash / 0x1_0000_0000;
};

const alternatingFrame = (
  prefix: 'idle' | 'move',
  nowMs: number,
  cadenceMs: number,
): CharacterFrameName => `${prefix}${Math.floor(nowMs / cadenceMs) % 2 === 0 ? 'A' : 'B'}`;

const moveCadence = (skin: CharacterSkinId): number => {
  if (skin === 'crawler') return 200;
  if (skin === 'brute') return 600;
  if (skin === 'carrier') return 420;
  if (skin === 'queen') return 800;
  if (skin === 'marine') return 360;
  return 320;
};

export const characterAnimation = (input: CharacterAnimationInput): CharacterAnimationOutput => {
  const nowMs = Math.max(0, finite(input.nowMs));
  const velocityX = finite(input.velocityX);
  const velocityY = finite(input.velocityY);
  const moving = Math.abs(velocityX) + Math.abs(velocityY) > 0.001;
  const attackUntilMs = finite(input.attackUntilMs);
  const hitUntilMs = finite(input.hitUntilMs);

  if (input.dead) {
    return Object.freeze({
      frame: 'death', offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1,
      rotationOffset: 0, emissiveAlpha: 0, hitBrightness: 0,
    });
  }

  let frame: CharacterFrameName;
  if (hitUntilMs > nowMs) frame = 'hit';
  else if (attackUntilMs > nowMs) frame = 'attack';
  else if (moving) frame = alternatingFrame('move', nowMs, moveCadence(input.skin));
  else frame = alternatingFrame('idle', nowMs, 1_000);

  const phase = animationPhaseForId(input.entityId);
  const wave = Math.sin((nowMs / 1_000 + phase) * TAU);
  const step = Math.sin((nowMs / moveCadence(input.skin)) * Math.PI);
  let offsetX = 0;
  let offsetY = 0;
  let scaleX = 1;
  let scaleY = 1;
  let rotationOffset = 0;
  let emissiveAlpha = 0;

  switch (input.skin) {
    case 'crawler':
      offsetY = moving ? Math.abs(step) * -2.2 : wave * 0.35;
      scaleX = 1 + (moving ? step * 0.035 : wave * 0.012);
      scaleY = 1 - (moving ? step * 0.025 : wave * 0.012);
      rotationOffset = moving ? step * 0.035 : 0;
      break;
    case 'brute':
      offsetY = moving ? Math.abs(step) * -0.8 : 0;
      scaleX = 1.06 - step * 0.025;
      scaleY = 0.92 + step * 0.025;
      rotationOffset = moving ? step * 0.012 : 0;
      break;
    case 'spitter':
      offsetY = wave * 0.7;
      scaleX = 1 + wave * 0.025;
      scaleY = 1 - wave * 0.025;
      emissiveAlpha = 0.3 + wave * 0.1;
      break;
    case 'stalker':
      offsetY = moving ? step * -0.8 : wave * 0.25;
      rotationOffset = moving ? step * 0.018 : 0;
      emissiveAlpha = 0.18 + 0.14 * Math.sin(nowMs / 190 + phase * TAU);
      break;
    case 'carrier':
      offsetX = moving ? step * 0.45 : 0;
      offsetY = wave * 1.35 + (moving ? Math.abs(step) * -0.5 : 0);
      rotationOffset = wave * 0.018;
      break;
    case 'queen':
      {
        const breath = Math.sin((nowMs / 4_000 + phase) * TAU);
        offsetY = breath * 0.45;
        scaleX = 1 + breath * 0.009;
        scaleY = 1 - breath * 0.009;
        emissiveAlpha = 0.12 + breath * 0.03;
      }
      break;
    case 'marine':
      offsetY = moving ? Math.abs(step) * -0.45 : wave * 0.12;
      rotationOffset = moving ? step * 0.008 : 0;
      break;
  }

  // Quality only controls optional secondary effects; semantic frames remain intact.
  // The spitter's scale pulse is optional, while the queen's slow breathing is
  // required family communication and is disabled only by reduced motion.
  const qualityFactor = input.quality === 'high' ? 1 : input.quality === 'medium' ? 0.5 : 0;
  emissiveAlpha *= qualityFactor;
  if (input.quality === 'low' && input.skin === 'spitter') {
    scaleX = 1;
    scaleY = 1;
  }

  if (input.reducedMotion) {
    offsetX = 0;
    offsetY = 0;
    scaleX = 1;
    scaleY = 1;
    rotationOffset = 0;
  }

  return Object.freeze({
    frame,
    offsetX: finite(offsetX),
    offsetY: finite(offsetY),
    scaleX: finite(scaleX),
    scaleY: finite(scaleY),
    rotationOffset: finite(rotationOffset),
    emissiveAlpha: Math.max(0, finite(emissiveAlpha)),
    hitBrightness: frame === 'hit' && !input.reducedFlash ? 1 : 0,
  });
};
