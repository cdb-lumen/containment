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

export type ActorPresentationSize = Readonly<{
  width: number;
  height: number;
}>;

/**
 * Authored sheets use padded square cells even though their painted silhouettes
 * are wider than they are tall. These follower-only sizes preserve readable
 * painted occupancy while the authoritative physics bodies stay unchanged.
 */
export const ACTOR_PRESENTATION_SIZE = Object.freeze({
  marine: Object.freeze({ width: 150, height: 120 }),
  crawler: Object.freeze({ width: 84, height: 72 }),
  stalker: Object.freeze({ width: 92, height: 78 }),
  spitter: Object.freeze({ width: 96, height: 82 }),
  carrier: Object.freeze({ width: 114, height: 98 }),
  brute: Object.freeze({ width: 122, height: 104 }),
} satisfies Readonly<Record<keyof typeof ACTOR_VISUAL_SCALE, ActorPresentationSize>>);

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
