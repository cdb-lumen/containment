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

export type MutableCharacterAnimationInput = {
  -readonly [Key in keyof CharacterAnimationInput]: CharacterAnimationInput[Key];
};

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

export type MutableCharacterAnimationOutput = {
  -readonly [Key in keyof CharacterAnimationOutput]: CharacterAnimationOutput[Key];
};

export const createCharacterAnimationOutput = (): MutableCharacterAnimationOutput => ({
  frame: 'idleA', offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1,
  rotationOffset: 0, emissiveAlpha: 0, hitBrightness: 0,
});

const finite = (value: number): number => (Number.isFinite(value) ? value : 0);
const TAU = Math.PI * 2;

type FamilyAnimationProfile = Readonly<{
  cadence: Readonly<{ idleMs: number; moveMs: number }>;
  motion: Readonly<{
    bobAmplitude: number;
    movingBobAmplitude: number;
    lateralAmplitude: number;
    baseScaleX: number;
    baseScaleY: number;
    scaleAmplitude: number;
    scaleWeightX: number;
    scaleWeightY: number;
    rotationAmplitude: number;
  }>;
  secondary: Readonly<{
    wavePeriodMs: number;
    emissiveBase: number;
    emissiveAmplitude: number;
    shimmerPeriodMs: number;
  }>;
}>;

const profile = (
  moveMs: number,
  motion: FamilyAnimationProfile['motion'],
  secondary: FamilyAnimationProfile['secondary'],
): FamilyAnimationProfile => Object.freeze({
  cadence: Object.freeze({ idleMs: 400, moveMs }),
  motion: Object.freeze(motion),
  secondary: Object.freeze(secondary),
});

const noSecondary = Object.freeze({
  wavePeriodMs: 1_000, emissiveBase: 0, emissiveAmplitude: 0, shimmerPeriodMs: 0,
});

/** Public for policy verification; all profile levels are immutable at runtime. */
export const CHARACTER_ANIMATION_PROFILES: Readonly<Record<CharacterSkinId, FamilyAnimationProfile>> =
  Object.freeze({
    marine: profile(360, {
      bobAmplitude: 0.12, movingBobAmplitude: -0.45, lateralAmplitude: 0,
      baseScaleX: 1, baseScaleY: 1, scaleAmplitude: 0,
      scaleWeightX: 0, scaleWeightY: 0, rotationAmplitude: 0.008,
    }, noSecondary),
    crawler: profile(200, {
      bobAmplitude: 0.35, movingBobAmplitude: -2.2, lateralAmplitude: 0,
      baseScaleX: 1, baseScaleY: 1, scaleAmplitude: 0.012,
      scaleWeightX: 0.035, scaleWeightY: -0.025, rotationAmplitude: 0.035,
    }, noSecondary),
    brute: profile(600, {
      bobAmplitude: 0, movingBobAmplitude: -0.8, lateralAmplitude: 0,
      baseScaleX: 1.06, baseScaleY: 0.92, scaleAmplitude: 1,
      scaleWeightX: -0.025, scaleWeightY: 0.025, rotationAmplitude: 0.012,
    }, noSecondary),
    spitter: profile(320, {
      bobAmplitude: 0.7, movingBobAmplitude: 0, lateralAmplitude: 0,
      baseScaleX: 1, baseScaleY: 1, scaleAmplitude: 1,
      scaleWeightX: 0.025, scaleWeightY: -0.025, rotationAmplitude: 0,
    }, {
      wavePeriodMs: 1_000, emissiveBase: 0.3, emissiveAmplitude: 0.1, shimmerPeriodMs: 0,
    }),
    stalker: profile(280, {
      bobAmplitude: 0.25, movingBobAmplitude: -0.8, lateralAmplitude: 0,
      baseScaleX: 1, baseScaleY: 1, scaleAmplitude: 0,
      scaleWeightX: 0, scaleWeightY: 0, rotationAmplitude: 0.018,
    }, {
      wavePeriodMs: 1_000, emissiveBase: 0.18, emissiveAmplitude: 0.14, shimmerPeriodMs: 190,
    }),
    carrier: profile(420, {
      bobAmplitude: 1.35, movingBobAmplitude: -0.5, lateralAmplitude: 0.45,
      baseScaleX: 1, baseScaleY: 1, scaleAmplitude: 0,
      scaleWeightX: 0, scaleWeightY: 0, rotationAmplitude: 0.018,
    }, noSecondary),
    queen: profile(500, {
      bobAmplitude: 0.45, movingBobAmplitude: 0, lateralAmplitude: 0,
      baseScaleX: 1, baseScaleY: 1, scaleAmplitude: 1,
      scaleWeightX: 0.009, scaleWeightY: -0.009, rotationAmplitude: 0,
    }, {
      wavePeriodMs: 4_000, emissiveBase: 0.12, emissiveAmplitude: 0.03, shimmerPeriodMs: 0,
    }),
  });

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

export const writeCharacterAnimation = (
  target: MutableCharacterAnimationOutput,
  input: CharacterAnimationInput,
): MutableCharacterAnimationOutput => {
  const nowMs = Math.max(0, finite(input.nowMs));
  const velocityX = finite(input.velocityX);
  const velocityY = finite(input.velocityY);
  const moving = Math.abs(velocityX) + Math.abs(velocityY) > 0.001;
  const attackUntilMs = finite(input.attackUntilMs);
  const hitUntilMs = finite(input.hitUntilMs);
  const family = CHARACTER_ANIMATION_PROFILES[input.skin];

  if (input.dead) {
    target.frame = 'death'; target.offsetX = 0; target.offsetY = 0;
    target.scaleX = 1; target.scaleY = 1; target.rotationOffset = 0;
    target.emissiveAlpha = 0; target.hitBrightness = 0;
    return target;
  }

  let frame: CharacterFrameName;
  if (hitUntilMs > nowMs) frame = 'hit';
  else if (attackUntilMs > nowMs) frame = 'attack';
  else if (moving) frame = alternatingFrame('move', nowMs, family.cadence.moveMs);
  else frame = alternatingFrame('idle', nowMs, family.cadence.idleMs);

  const phase = animationPhaseForId(input.entityId);
  const wave = Math.sin((nowMs / family.secondary.wavePeriodMs + phase) * TAU);
  const step = Math.sin((nowMs / family.cadence.moveMs) * Math.PI);
  let offsetX = 0;
  let offsetY = 0;
  let scaleX = 1;
  let scaleY = 1;
  let rotationOffset = 0;
  let emissiveAlpha = 0;

  switch (input.skin) {
    case 'crawler':
      offsetY = moving ? Math.abs(step) * family.motion.movingBobAmplitude : wave * family.motion.bobAmplitude;
      scaleX = family.motion.baseScaleX + (moving
        ? step * family.motion.scaleWeightX
        : wave * family.motion.scaleAmplitude);
      scaleY = family.motion.baseScaleY + (moving
        ? step * family.motion.scaleWeightY
        : wave * -family.motion.scaleAmplitude);
      rotationOffset = moving ? step * family.motion.rotationAmplitude : 0;
      break;
    case 'brute':
      offsetY = moving ? Math.abs(step) * family.motion.movingBobAmplitude : 0;
      scaleX = family.motion.baseScaleX + step * family.motion.scaleWeightX;
      scaleY = family.motion.baseScaleY + step * family.motion.scaleWeightY;
      rotationOffset = moving ? step * family.motion.rotationAmplitude : 0;
      break;
    case 'spitter':
      offsetY = wave * family.motion.bobAmplitude;
      scaleX = family.motion.baseScaleX + wave * family.motion.scaleWeightX;
      scaleY = family.motion.baseScaleY + wave * family.motion.scaleWeightY;
      emissiveAlpha = family.secondary.emissiveBase + wave * family.secondary.emissiveAmplitude;
      break;
    case 'stalker':
      offsetY = moving ? step * family.motion.movingBobAmplitude : wave * family.motion.bobAmplitude;
      rotationOffset = moving ? step * family.motion.rotationAmplitude : 0;
      emissiveAlpha = family.secondary.emissiveBase + family.secondary.emissiveAmplitude
        * Math.sin((nowMs / family.secondary.shimmerPeriodMs + phase) * TAU);
      break;
    case 'carrier':
      offsetX = moving ? step * family.motion.lateralAmplitude : 0;
      offsetY = wave * family.motion.bobAmplitude
        + (moving ? Math.abs(step) * family.motion.movingBobAmplitude : 0);
      rotationOffset = wave * family.motion.rotationAmplitude;
      break;
    case 'queen':
      {
        const breath = wave;
        offsetY = breath * family.motion.bobAmplitude;
        scaleX = family.motion.baseScaleX + breath * family.motion.scaleWeightX;
        scaleY = family.motion.baseScaleY + breath * family.motion.scaleWeightY;
        emissiveAlpha = family.secondary.emissiveBase
          + breath * family.secondary.emissiveAmplitude;
      }
      break;
    case 'marine':
      offsetY = moving ? Math.abs(step) * family.motion.movingBobAmplitude : wave * family.motion.bobAmplitude;
      rotationOffset = moving ? step * family.motion.rotationAmplitude : 0;
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

  target.frame = frame;
  target.offsetX = finite(offsetX);
  target.offsetY = finite(offsetY);
  target.scaleX = finite(scaleX);
  target.scaleY = finite(scaleY);
  target.rotationOffset = finite(rotationOffset);
  target.emissiveAlpha = Math.max(0, finite(emissiveAlpha));
  target.hitBrightness = frame === 'hit' && !input.reducedFlash ? 1 : 0;
  return target;
};

export const characterAnimation = (input: CharacterAnimationInput): CharacterAnimationOutput =>
  Object.freeze(writeCharacterAnimation(createCharacterAnimationOutput(), input));
