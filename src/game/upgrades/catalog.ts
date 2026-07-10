export type UpgradeKind =
  | 'damage'
  | 'penetration'
  | 'spread'
  | 'reload'
  | 'magazine'
  | 'movement'
  | 'armor'
  | 'pickup';

export type UpgradeId = UpgradeKind;

export type UpgradeDefinition = {
  id: UpgradeId;
  label: string;
  description: string;
  cost: number;
  kind: UpgradeKind;
  value: number;
};

const upgrade = (
  definition: UpgradeDefinition,
): Readonly<UpgradeDefinition> => Object.freeze(definition);

export const UPGRADES: Readonly<
  Record<UpgradeId, Readonly<UpgradeDefinition>>
> = Object.freeze({
  damage: upgrade({
    id: 'damage',
    label: 'Overpressure rounds',
    description: 'Increase weapon damage by 15%.',
    cost: 120,
    kind: 'damage',
    value: 0.15,
  }),
  penetration: upgrade({
    id: 'penetration',
    label: 'Core penetrator',
    description: 'Allow projectiles to pierce one additional target.',
    cost: 160,
    kind: 'penetration',
    value: 1,
  }),
  spread: upgrade({
    id: 'spread',
    label: 'Stabilized barrel',
    description: 'Reduce projectile spread by 18%.',
    cost: 100,
    kind: 'spread',
    value: 0.18,
  }),
  reload: upgrade({
    id: 'reload',
    label: 'Quick-load mechanism',
    description: 'Reduce reload duration by 16%.',
    cost: 110,
    kind: 'reload',
    value: 0.16,
  }),
  magazine: upgrade({
    id: 'magazine',
    label: 'Extended magazine',
    description: 'Increase magazine capacity by 25%.',
    cost: 130,
    kind: 'magazine',
    value: 0.25,
  }),
  movement: upgrade({
    id: 'movement',
    label: 'Servo assist',
    description: 'Increase movement speed by 10%.',
    cost: 140,
    kind: 'movement',
    value: 0.1,
  }),
  armor: upgrade({
    id: 'armor',
    label: 'Reactive plating',
    description: 'Increase maximum armor by 20 points.',
    cost: 150,
    kind: 'armor',
    value: 20,
  }),
  pickup: upgrade({
    id: 'pickup',
    label: 'Field recycler',
    description: 'Increase the value of collected pickups by 20%.',
    cost: 125,
    kind: 'pickup',
    value: 0.2,
  }),
});
