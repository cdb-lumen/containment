export type WeaponId =
  | 'pistol'
  | 'rifle'
  | 'shotgun'
  | 'plasma'
  | 'rocket';

export type WeaponDefinition = {
  id: WeaponId;
  label: string;
  damage: number;
  roundsPerSecond: number;
  magazine: number;
  reserve: number;
  reloadMs: number;
  pellets: number;
  spreadRadians: number;
  projectileSpeed: number;
  projectileRadius: number;
  penetration: number;
  splashRadius: number;
  knockback: number;
};
