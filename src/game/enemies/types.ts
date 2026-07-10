export type StandardEnemyId =
  | 'crawler'
  | 'brute'
  | 'spitter'
  | 'stalker'
  | 'carrier';

export type EnemyId = StandardEnemyId | 'queen';

export type EnemyBehavior =
  | 'pursuit'
  | 'armored-charge'
  | 'ranged-hazard'
  | 'flank-camouflage'
  | 'spawn-on-death'
  | 'boss-phases';

export type EnemyDefinition = {
  id: EnemyId;
  label: string;
  maxHealth: number;
  speed: number;
  radius: number;
  contactDamage: number;
  attackCooldownMs: number;
  creditReward: number;
  dropChance: number;
  behavior: EnemyBehavior;
};
