import { CHARACTER_SKINS, type CharacterSkinId } from './characterSkins';
import { TEXTURE_KEYS, type TextureKey } from './createTextures';

export type BloodGroup = 'human' | 'alien' | 'acid';
export type BloodDecalFamily = 'small' | 'medium' | 'large' | 'streak' | 'scorch';
export type BloodDecalFamilyFor<Group extends BloodGroup> = Group extends 'acid'
  ? Exclude<BloodDecalFamily, 'streak'>
  : Exclude<BloodDecalFamily, 'scorch'>;
export type BloodDecalFrameName =
  | `${Exclude<BloodGroup, 'acid'>}-${BloodDecalFamilyFor<'human'>}`
  | `acid-${BloodDecalFamilyFor<'acid'>}`;

export type CorpseFamily = Readonly<{
  character: CharacterSkinId;
  texture: `skin-${CharacterSkinId}`;
  fallbackTexture: TextureKey;
  frame: number;
  bloodGroup: BloodGroup;
  displaySize: Readonly<{ width: number; height: number }>;
  major: boolean;
}>;

const defineCorpse = (
  character: CharacterSkinId,
  bloodGroup: BloodGroup,
  displaySize: number,
  major = false,
): CorpseFamily => {
  const skin = CHARACTER_SKINS[character];
  return Object.freeze({
    character,
    texture: skin.texture,
    fallbackTexture: skin.fallbackTexture,
    frame: skin.frames.death,
    bloodGroup,
    displaySize: Object.freeze({ width: displaySize, height: displaySize }),
    major,
  });
};

export const CORPSE_FAMILIES: Readonly<Record<CharacterSkinId, CorpseFamily>> = Object.freeze({
  marine: defineCorpse('marine', 'human', 64),
  crawler: defineCorpse('crawler', 'alien', 64),
  brute: defineCorpse('brute', 'alien', 64),
  spitter: defineCorpse('spitter', 'acid', 64),
  stalker: defineCorpse('stalker', 'alien', 64),
  carrier: defineCorpse('carrier', 'alien', 64),
  queen: defineCorpse('queen', 'acid', 128, true),
});

export type ResolvedCorpseSource = Readonly<{
  texture: CorpseFamily['texture'] | TextureKey;
  framed: boolean;
  frame: number | undefined;
  bloodGroup: BloodGroup;
  displaySize: CorpseFamily['displaySize'];
  major: boolean;
}>;

export const resolveCorpseSource = (
  hasTexture: (key: string) => boolean,
  character: CharacterSkinId,
  elite = false,
): ResolvedCorpseSource => {
  const family = CORPSE_FAMILIES[character];
  const framed = hasTexture(family.texture);
  return Object.freeze({
    texture: framed ? family.texture : family.fallbackTexture,
    framed,
    frame: framed ? family.frame : undefined,
    bloodGroup: family.bloodGroup,
    displaySize: family.displaySize,
    major: family.major || elite,
  });
};

export const BLOOD_DECAL_FRAME_NAMES: readonly BloodDecalFrameName[] = Object.freeze([
  'human-small', 'human-medium', 'human-large', 'human-streak',
  'alien-small', 'alien-medium', 'alien-large', 'alien-streak',
  'acid-small', 'acid-medium', 'acid-large', 'acid-scorch',
]);

const bloodFrames = Object.freeze(Object.fromEntries(
  BLOOD_DECAL_FRAME_NAMES.map((name, frame) => [name, frame]),
) as Record<BloodDecalFrameName, number>);

export const BLOOD_DECALS = Object.freeze({
  texture: 'blood-decals' as const,
  url: 'assets/effects/blood-decals-sheet.png' as const,
  frameWidth: 64,
  frameHeight: 64,
  frames: bloodFrames,
  fallbackTexture: TEXTURE_KEYS.splatter,
});

export type BloodDecalLoadDescriptor = Readonly<{
  key: typeof BLOOD_DECALS.texture;
  url: typeof BLOOD_DECALS.url;
  frameWidth: number;
  frameHeight: number;
}>;

export const bloodDecalLoadDescriptor = (): BloodDecalLoadDescriptor => ({
  key: BLOOD_DECALS.texture,
  url: BLOOD_DECALS.url,
  frameWidth: BLOOD_DECALS.frameWidth,
  frameHeight: BLOOD_DECALS.frameHeight,
});

export const bloodDecalFrameName = <Group extends BloodGroup>(
  group: Group,
  family: BloodDecalFamilyFor<Group>,
): BloodDecalFrameName => `${group}-${family}` as BloodDecalFrameName;

export const resolveBloodDecal = <Group extends BloodGroup>(
  hasTexture: (key: string) => boolean,
  group: Group,
  family: BloodDecalFamilyFor<Group>,
): Readonly<{ texture: typeof BLOOD_DECALS.texture | TextureKey; framed: boolean; frame: number | undefined }> => {
  const framed = hasTexture(BLOOD_DECALS.texture);
  return Object.freeze({
    texture: framed ? BLOOD_DECALS.texture : BLOOD_DECALS.fallbackTexture,
    framed,
    frame: framed ? BLOOD_DECALS.frames[bloodDecalFrameName(group, family)] : undefined,
  });
};

export const applyToAvailableBloodDecals = (
  hasTexture: (key: string) => boolean,
  apply: (key: typeof BLOOD_DECALS.texture) => void,
): void => {
  if (hasTexture(BLOOD_DECALS.texture)) apply(BLOOD_DECALS.texture);
};
