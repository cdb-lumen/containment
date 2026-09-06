import {ELEMENTAL_BOONS} from './elementalCatalog';
import type { MutationId } from './types';

export type BoonFamily='Kinetic'|'Cryo'|'Reactor'|'Recovery';
export type MutationDefinition = Readonly<{
  id: MutationId;
  family:BoonFamily;
  name: string;
  description: string;
  tradeoff: string;
  rarity: 'common' | 'rare';
  requires?: readonly MutationId[];
}>;

export const MUTATION_CATALOG: Readonly<Record<MutationId, MutationDefinition>> = Object.freeze({
  breacher: Object.freeze({ id: 'breacher', family:'Kinetic', name: 'Breacher', description: 'Shotgun hits launch bodies. Wall slams deal up to 36 extra damage.', tradeoff: 'Shotgun projectile damage −10%.', rarity: 'common' }),
  'heavy-pellets': Object.freeze({ id: 'heavy-pellets', family:'Kinetic', name: 'Heavy Pellets', description: 'Shotgun projectile damage +35%; with Breacher, launch impulse also increases by 50%.', tradeoff: 'Shotgun time between shots +20%.', rarity: 'common' }),
  'chain-reaction': Object.freeze({ id: 'chain-reaction', family:'Kinetic', name: 'Chain Reaction', description: 'Launched bodies damage and launch another enemy with decaying force.', tradeoff: 'Requires Breacher. Each launch can chain three times.', rarity: 'rare', requires: Object.freeze(['breacher'] as const) }),
  'volatile-remains': Object.freeze({ id: 'volatile-remains', family:'Reactor', name: 'Volatile Remains', description: 'Kills explode for 22 damage, hitting up to six nearby enemies.', tradeoff: 'Incoming damage +10%.', rarity: 'rare' }),
  cryogenic: Object.freeze({ id: 'cryogenic', family:'Cryo', name: 'Cryogenic', description: 'Hits stack chill, slowing enemies up to 45% for 2 seconds.', tradeoff: 'Projectile damage −10%. Bosses resist movement slow.', rarity: 'common' }),
  shattershot: Object.freeze({ id: 'shattershot', family:'Cryo', name: 'Shattershot', description: 'Shotgun hits consume two or more chill stacks for 24 direct and 16 area damage.', tradeoff: 'Requires Cryogenic; consumes the enemy’s slow.', rarity: 'rare', requires: Object.freeze(['cryogenic'] as const) }),
  scavenger: Object.freeze({ id: 'scavenger', family:'Recovery', name: 'Scavenger', description: 'Direct kills return one round to your weapon reserve.', tradeoff: 'Explosion and collision kills do not recover ammo.', rarity: 'common' }),
  'blood-price': Object.freeze({ id: 'blood-price', family:'Recovery', name: 'Blood Price', description: 'Direct kills trade up to 2 health for three reserve rounds.', tradeoff: 'Never spends the last health point; no trade when reserve is full.', rarity: 'rare' }),
  'hot-reload': Object.freeze({ id: 'hot-reload', family:'Reactor', name: 'Hot Reload', description: 'Reloading primes your next shot for 50% extra damage.', tradeoff: 'Reload duration +15%. Priming lasts until you fire or leave the room.', rarity: 'common' }),
  'last-shell': Object.freeze({ id: 'last-shell', family:'Reactor', name: 'Last Shell', description: 'The last shotgun shell deals +60% projectile damage.', tradeoff: 'Shotgun reload duration +10%.', rarity: 'common' }),
  'magnetic-feed': Object.freeze({ id: 'magnetic-feed', family:'Recovery', name: 'Magnetic Feed', description: 'Ammo pickups feed up to 2 extra rounds directly into the magazine.', tradeoff: 'Only ammo pickups trigger it; full magazines waste the bonus.', rarity: 'common' }),
  'field-medic': Object.freeze({ id: 'field-medic', family:'Recovery', name: 'Field Medic', description: 'Healing adds up to 25% extra health and converts unused bonus into armor.', tradeoff: 'Adds no healing when the original heal amount is zero; armor bonus capped at 10.', rarity: 'common' }),
  'piercing-rounds': Object.freeze({id:'piercing-rounds',name:'Piercing Rounds',family:'Kinetic',description:"Rifle, pistol and plasma rounds pierce one additional enemy.",tradeoff:"No effect on shotguns or explosives.",rarity:'common'}),
  'pressure-point': Object.freeze({id:'pressure-point',name:'Pressure Point',family:'Kinetic',description:"Every fifth hit deals 24 extra damage.",tradeoff:"Shotgun pellets count as a single hit.",rarity:'common'}),
  'seismic-impact': Object.freeze({id:'seismic-impact',name:'Seismic Impact',family:'Kinetic',description:"Wall slams send a 24-damage shockwave through nearby enemies.",tradeoff:"Requires Breacher. Up to four targets.",rarity:'rare',requires:Object.freeze(['breacher'] as const)}),
  'permafrost': Object.freeze({id:'permafrost',name:'Permafrost',family:'Cryo',description:"Chill lasts 3.5 seconds, giving you more time to set up a shatter.",tradeoff:"Requires Cryogenic.",rarity:'common',requires:Object.freeze(['cryogenic'] as const)}),
  'cold-snap': Object.freeze({id:'cold-snap',name:'Cold Snap',family:'Cryo',description:"Completing a reload chills the three closest visible enemies.",tradeoff:"Nearby enemies only. Reload must add rounds.",rarity:'common'}),
  'frost-armor': Object.freeze({id:'frost-armor',name:'Frost Armor',family:'Cryo',description:"Killing a chilled enemy restores 3 armor.",tradeoff:"Requires Cryogenic. Cannot exceed maximum armor.",rarity:'rare',requires:Object.freeze(['cryogenic'] as const)}),
  'arc-filament': Object.freeze({id:'arc-filament',name:'Arc Filament',family:'Reactor',description:"Every fourth hit arcs to a nearby enemy for 16 damage.",tradeoff:"Arcs need a clear path.",rarity:'common'}),
  'conductive-shell': Object.freeze({id:'conductive-shell',name:'Conductive Shell',family:'Reactor',description:"Arcs hit two targets and deal 40% more damage.",tradeoff:"Requires Arc Filament.",rarity:'rare',requires:Object.freeze(['arc-filament'] as const)}),
  'incendiary': Object.freeze({id:'incendiary',name:'Incendiary',family:'Reactor',description:"Hits ignite enemies for 24 damage over 1.5 seconds.",tradeoff:"Repeated hits refresh the burn; damage does not stack.",rarity:'common'}),
  'rapid-cycle': Object.freeze({id:'rapid-cycle',name:'Rapid Cycle',family:'Reactor',description:"Fire and reload 15% faster.",tradeoff:"Increases ammunition use.",rarity:'common'}),
  'leech-rounds': Object.freeze({id:'leech-rounds',name:'Leech Rounds',family:'Recovery',description:"Every fourth direct kill restores 4 health.",tradeoff:"Up to six heals per room.",rarity:'common'}),
  'emergency-plating': Object.freeze({id:'emergency-plating',name:'Emergency Plating',family:'Recovery',description:"Surviving a hit below 30 health grants 20 armor.",tradeoff:"Once per room. Cannot prevent a lethal hit.",rarity:'rare'}),
  ...ELEMENTAL_BOONS,
});

export const MUTATION_IDS = Object.freeze(Object.keys(MUTATION_CATALOG) as MutationId[]);
