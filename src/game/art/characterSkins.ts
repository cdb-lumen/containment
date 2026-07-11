import { TEXTURE_KEYS, type TextureKey } from './createTextures';

export type CharacterSkinId =
  | 'marine'
  | 'crawler'
  | 'brute'
  | 'spitter'
  | 'stalker'
  | 'carrier'
  | 'queen';

export type CharacterFrameName =
  | 'idleA'
  | 'idleB'
  | 'moveA'
  | 'moveB'
  | 'attack'
  | 'hit'
  | 'death';

export type CharacterSkinDefinition = Readonly<{
  id: CharacterSkinId;
  texture: `skin-${CharacterSkinId}`;
  url: `assets/characters/${CharacterSkinId}-sheet.png`;
  frameWidth: number;
  frameHeight: number;
  frames: Readonly<Record<CharacterFrameName, number>>;
  fallbackTexture: TextureKey;
}>;

export const CHARACTER_FRAME_NAMES: readonly CharacterFrameName[] = Object.freeze([
  'idleA',
  'idleB',
  'moveA',
  'moveB',
  'attack',
  'hit',
  'death',
]);

const FRAMES: Readonly<Record<CharacterFrameName, number>> = Object.freeze({
  idleA: 0,
  idleB: 1,
  moveA: 2,
  moveB: 3,
  attack: 4,
  hit: 5,
  death: 6,
});

const defineSkin = (
  id: CharacterSkinId,
  fallbackTexture: TextureKey,
  cellSize = 96,
): CharacterSkinDefinition =>
  Object.freeze({
    id,
    texture: `skin-${id}`,
    url: `assets/characters/${id}-sheet.png`,
    frameWidth: cellSize,
    frameHeight: cellSize,
    frames: FRAMES,
    fallbackTexture,
  });

export const CHARACTER_SKINS: Readonly<Record<CharacterSkinId, CharacterSkinDefinition>> =
  Object.freeze({
    marine: defineSkin('marine', TEXTURE_KEYS.marine),
    crawler: defineSkin('crawler', TEXTURE_KEYS.alienRunner),
    brute: defineSkin('brute', TEXTURE_KEYS.alienBrute),
    spitter: defineSkin('spitter', TEXTURE_KEYS.alienSpitter),
    stalker: defineSkin('stalker', TEXTURE_KEYS.alienStalker),
    carrier: defineSkin('carrier', TEXTURE_KEYS.alienDrone),
    queen: defineSkin('queen', TEXTURE_KEYS.alienQueen, 160),
  });
