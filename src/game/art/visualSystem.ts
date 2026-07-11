export const HUD_LAYOUT = Object.freeze({
  topBandHeight: 78,
  bottomBandHeight: 42,
  playfieldHeight: 600,
});

export const ACTOR_VISUAL_SCALE = Object.freeze({
  marine: 108,
  crawler: 58,
  stalker: 66,
  spitter: 68,
  carrier: 78,
  brute: 86,
});

export const AMBIENT_VISUAL_BUDGET = Object.freeze({
  maxLightPools: 10,
  maxDustMotes: 24,
  lowQualityDustMotes: 0,
});

export type FloorMaterial = 'plate' | 'grate' | 'reinforced';

export const MATERIAL_VARIANTS: Readonly<Record<FloorMaterial, readonly string[]>> = Object.freeze({
  plate: Object.freeze(['facility-floor-a', 'facility-floor-b', 'facility-floor-c']),
  grate: Object.freeze(['facility-grate-a', 'facility-grate-b', 'facility-grate-c']),
  reinforced: Object.freeze(['facility-floor-heavy-a', 'facility-floor-heavy-b', 'facility-floor-heavy-c']),
});

const stableHash = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const roomMaterialVariant = (roomId: string, material: FloorMaterial): string => {
  const variants = MATERIAL_VARIANTS[material];
  return variants[stableHash(`${roomId}:${material}`) % variants.length]!;
};
