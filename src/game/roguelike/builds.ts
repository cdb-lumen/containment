import type { BuildState, MutationId } from './types';
import { MUTATION_CATALOG, MUTATION_IDS, type MutationDefinition } from './mutationCatalog';
import {BOON_PATHS,activePaths,prerequisitesMet} from './boonPaths';

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown, min = 0, max = 1_000_000): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value: unknown, min = 0, max = 1_000_000): value is number => finite(value, min, max) && Number.isInteger(value);
const id = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 128;
const ownedId = (value: unknown): value is MutationId => typeof value === 'string' && Object.hasOwn(MUTATION_CATALOG, value);
const dense = (value: readonly unknown[]): boolean => {
  for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
  return true;
};

export function isValidBuildState(value: unknown): value is BuildState {
  return record(value) && Object.keys(value).length === 1 && Array.isArray(value.mutations) && value.mutations.length <= MUTATION_IDS.length && dense(value.mutations) && value.mutations.every(ownedId) && new Set(value.mutations).size === value.mutations.length;
}
export const createBuild = (): BuildState => ({ mutations: [] });

export function addMutation(build: BuildState, mutation: MutationId): BuildState {
  if (!isValidBuildState(build) || !ownedId(mutation) || build.mutations.includes(mutation) || !(MUTATION_CATALOG[mutation].requires??[]).every(id=>build.mutations.includes(id)) || !!MUTATION_CATALOG[mutation].requiresAny?.length && !MUTATION_CATALOG[mutation].requiresAny!.some(id=>build.mutations.includes(id))) throw new Error('Invalid or already owned mutation');
  return { mutations: [...build.mutations, mutation] };
}

/** Seeded, build-aware sampling without replacement. Rerolls prefer unseen cards. */
export function draftMutationOffers(seed:number,build:BuildState,rare=false,exclude:readonly MutationId[]=[],depth=0):readonly MutationDefinition[]{
 if(!integer(seed,0,0xffffffff)||!isValidBuildState(build)||typeof rare!=='boolean')throw new Error('Invalid mutation draft');
 let state=seed>>>0;const next=()=>{state=(state+0x6d2b79f5)>>>0;let x=Math.imul(state^(state>>>15),1|state);x^=x+Math.imul(x^(x>>>7),61|x);return((x^(x>>>14))>>>0)/4294967296;};
 let pool=MUTATION_IDS.filter(id=>!build.mutations.includes(id)&&prerequisitesMet(MUTATION_CATALOG[id],build));
 const paths=activePaths(build),result:MutationDefinition[]=[];
 const pick=(candidates:MutationId[])=>{
  const fresh=candidates.filter(id=>!exclude.includes(id));if(fresh.length)candidates=fresh;
  let total=0;const weights=candidates.map(id=>{const m=MUTATION_CATALOG[id];
   const connected=paths.some(p=>(p.boons as readonly string[]).includes(id));
   const weight=(m.rarity==='rare'?.35+Math.max(0,Math.min(11,Number.isFinite(depth)?depth:0))*.045:1)*(connected?1.55:1)*(result.some(x=>x.family===m.family)?.65:1);
   total+=weight;return weight;
  });
  let roll=next()*total,index=0;for(;index<weights.length-1&&roll>=weights[index];index++)roll-=weights[index];
  const chosen=candidates[index];if(chosen){result.push(MUTATION_CATALOG[chosen]);pool=pool.filter(id=>id!==chosen);}
 };
 const starters=()=>pool.filter(id=>BOON_PATHS.some(p=>p.starter===id&&!paths.includes(p)));
 if(!build.mutations.length&&!rare){
  // Four paths, three choices. Reuse starters only when a reroll exhausts them.
  while(result.length<3&&starters().length)pick(starters());
 }else{
  const continuations=pool.filter(id=>paths.some(p=>(p.continuations as readonly string[]).includes(id)));
  const rareContinuations=continuations.filter(id=>MUTATION_CATALOG[id].rarity==='rare');
  if(continuations.length)pick(rare&&rareContinuations.length?rareContinuations:continuations);
  if(starters().length)pick(starters());
  if(rare&&!result.some(m=>m.rarity==='rare')){const rares=pool.filter(id=>MUTATION_CATALOG[id].rarity==='rare');if(rares.length)pick(rares);}
 }
 while(result.length<3&&pool.length)pick(pool);
 return Object.freeze(result);
}

export const familyCount=(build:BuildState,family:string)=>build.mutations.filter(id=>MUTATION_CATALOG[id].family===family).length;
export const familyBonuses=(build:BuildState)=>({kinetic:familyCount(build,'Kinetic')>=3,cryo:familyCount(build,'Cryo')>=3,reactor:familyCount(build,'Reactor')>=3,recovery:familyCount(build,'Recovery')>=3});

export type BuildWeapon = 'pistol' | 'rifle' | 'shotgun' | 'plasma' | 'rocket';
const weapons: readonly BuildWeapon[] = ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'];
const isWeapon = (value: unknown): value is BuildWeapon => typeof value === 'string' && weapons.includes(value as BuildWeapon);

/** Host applies these multipliers once when computing base combat values. */
export function deriveBuildStats(build: BuildState, weapon: BuildWeapon) {
  if (!isValidBuildState(build) || !isWeapon(weapon)) throw new Error('Invalid build stats input');
  const has = (mutation: MutationId) => build.mutations.includes(mutation);
  const family=familyBonuses(build);
  return {
    penetrationBonus:has('piercing-rounds')&&['pistol','rifle','plasma'].includes(weapon)?1:0,
    projectileDamageMultiplier: (family.kinetic?1.12:1) * (has('blood-price') ? 1.35 : 1) * (weapon === 'shotgun' && has('heavy-pellets') ? 1.35 : 1),
    shotIntervalMultiplier: (has('rapid-cycle')?.85:1),
    reloadDurationMultiplier: (family.reactor?.9:1)*(has('rapid-cycle')?.85:1),
    incomingDamageMultiplier: has('blood-price') ? 1.2 : 1,
  } as const;
}

export const BUILD_LIMITS = Object.freeze({ maxDepth: 3, maxEventsPerChain: 32, maxEncounterEvents: 2048, maxAreaTargets: 6 });
export type BuildCause = Readonly<{ chainId: string; depth: number }>;
export type ResourceSnapshot = Readonly<{
  weapon: BuildWeapon; health: number; maxHealth: number; armor: number; maxArmor: number;
  magazine: number; capacity: number; reserve: number; maxReserve: number;
}>;
type EventEnvelope = Readonly<{ id: string; cause: BuildCause }>;
export type BuildEvent = EventEnvelope & (
  | Readonly<{ type: 'shot'; weapon: BuildWeapon; magazineBefore: number }>
  | Readonly<{ type: 'hit'; weapon: BuildWeapon; targetId: string; direction: Readonly<{ x: number; y: number }>; chilledStacks: number }>
  | Readonly<{ type: 'wall-hit'; targetId: string; impulse: number }>
  | Readonly<{ type: 'body-collision'; targetId: string; impulse: number; direction: Readonly<{ x: number; y: number }> }>
  | Readonly<{ type: 'kill'; targetId: string; source: 'direct' | 'secondary'; resources: ResourceSnapshot }>
  | Readonly<{ type: 'reload'; weapon: BuildWeapon; roundsLoaded: number }>
  | Readonly<{ type: 'pickup'; kind: 'ammo' | 'other'; resources: ResourceSnapshot }>
  | Readonly<{ type: 'heal'; amount: number; resources: ResourceSnapshot }>
);

type CommandBody =
  | Readonly<{ type: 'shot-bonus'; damageMultiplier: number }>
  | Readonly<{ type: 'impulse'; targetId: string; x: number; y: number }>
  | Readonly<{ type: 'damage'; targetId: string; amount: number; source: 'secondary'; visual?: 'shatter' | 'wall-slam' }>
  | Readonly<{ type: 'explosion'; centerTargetId: string; damage: number; radius: number; maxTargets: number; source: 'secondary'; visual?: 'shatter' | 'wall-slam' }>
  | Readonly<{ type: 'chill'; targetId: string; stacks: number; durationMs: number; slowFraction: number }>
  | Readonly<{ type: 'resources'; weapon: BuildWeapon; healthDelta: number; armorDelta: number; magazineDelta: number; reserveDelta: number }>;
export type BuildCommand = CommandBody & Readonly<{ id: string; cause: BuildCause }>;
export type BuildResolutionState = Readonly<{
  seenEventIds: readonly string[];
  chains: readonly Readonly<{ id: string; events: number }>[];
  hotWeapons: readonly BuildWeapon[];
}>;
export type BuildResolution = Readonly<{
  state: BuildResolutionState; commands: readonly BuildCommand[];
  rejected?: 'invalid-build' | 'invalid-state' | 'invalid-event' | 'duplicate' | 'depth-limit' | 'chain-limit' | 'encounter-limit';
}>;
export const createBuildResolutionState = (): BuildResolutionState => ({ seenEventIds: [], chains: [], hotWeapons: [] });

function validResources(value: unknown): value is ResourceSnapshot {
  if (!record(value) || !isWeapon(value.weapon)) return false;
  if (!finite(value.maxHealth, 1, 10000) || !finite(value.health, 0, value.maxHealth) || !finite(value.maxArmor, 0, 10000) || !finite(value.armor, 0, value.maxArmor)) return false;
  if (!integer(value.capacity, 1, 10000) || !integer(value.magazine, 0, value.capacity) || !integer(value.maxReserve, 0, 100000)) return false;
  return value.weapon === 'pistol' && value.reserve === -1 || integer(value.reserve, 0, value.maxReserve);
}
function validDirection(value: unknown): boolean {
  return record(value) && finite(value.x, -10000, 10000) && finite(value.y, -10000, 10000);
}
export function isValidBuildEvent(value: unknown): value is BuildEvent {
  if (!record(value) || !id(value.id) || !record(value.cause) || !id(value.cause.chainId) || !integer(value.cause.depth, 0, 1000)) return false;
  switch (value.type) {
    case 'shot': return isWeapon(value.weapon) && integer(value.magazineBefore, 1, 10000);
    case 'hit': return isWeapon(value.weapon) && id(value.targetId) && validDirection(value.direction) && integer(value.chilledStacks, 0, 3);
    case 'wall-hit': return id(value.targetId) && finite(value.impulse, 0, 10000);
    case 'body-collision': return id(value.targetId) && finite(value.impulse, 0, 10000) && validDirection(value.direction);
    case 'kill': return id(value.targetId) && (value.source === 'direct' || value.source === 'secondary') && validResources(value.resources);
    case 'reload': return isWeapon(value.weapon) && integer(value.roundsLoaded, 0, 10000);
    case 'pickup': return (value.kind === 'ammo' || value.kind === 'other') && validResources(value.resources);
    case 'heal': return finite(value.amount, 0, 10000) && validResources(value.resources);
    default: return false;
  }
}
export function isValidBuildResolutionState(value: unknown): value is BuildResolutionState {
  if (!record(value) || !Array.isArray(value.seenEventIds) || value.seenEventIds.length > BUILD_LIMITS.maxEncounterEvents || !dense(value.seenEventIds) || !value.seenEventIds.every(id) || new Set(value.seenEventIds).size !== value.seenEventIds.length) return false;
  if (!Array.isArray(value.chains) || value.chains.length > BUILD_LIMITS.maxEncounterEvents || !dense(value.chains) || !value.chains.every((chain: unknown) => record(chain) && id(chain.id) && integer(chain.events, 1, BUILD_LIMITS.maxEventsPerChain))) return false;
  if (new Set(value.chains.map((chain) => chain.id)).size !== value.chains.length || value.chains.reduce((sum, chain) => sum + chain.events, 0) !== value.seenEventIds.length) return false;
  return Array.isArray(value.hotWeapons) && value.hotWeapons.length <= weapons.length && dense(value.hotWeapons) && value.hotWeapons.every(isWeapon) && new Set(value.hotWeapons).size === value.hotWeapons.length;
}

/**
 * Pure encounter reducer. Snapshot resources are AFTER the host's base event.
 * `shot` runs before projectile construction; magazineBefore is pre-consumption.
 * Hit is one aggregate hit per shot/target (not one event per shotgun pellet).
 * Commands execute in array order. Host applies their IDs at most once, honors
 * maxTargets, and preserves cause when reporting resulting collision/kill events.
 * Secondary damage never emits `hit` and uses source:'secondary' for kills.
 * All children retain chainId and use command.cause.depth, never reset depth.
 * Terminal resource/chill/shot-bonus commands MUST NOT feed events back.
 * Keep this state until all encounter effects finish; never evict dedupe entries.
 */
export function resolveBuildEvent(build: BuildState, state: BuildResolutionState, event: BuildEvent): BuildResolution {
  const reject = (rejected: NonNullable<BuildResolution['rejected']>): BuildResolution => ({ state, commands: [], rejected });
  if (!isValidBuildState(build)) return reject('invalid-build');
  if (!isValidBuildResolutionState(state)) return reject('invalid-state');
  if (!isValidBuildEvent(event)) return reject('invalid-event');
  if (state.seenEventIds.includes(event.id)) return reject('duplicate');
  if (event.cause.depth > BUILD_LIMITS.maxDepth) return reject('depth-limit');
  if (state.seenEventIds.length >= BUILD_LIMITS.maxEncounterEvents) return reject('encounter-limit');
  const chain = state.chains.find((candidate) => candidate.id === event.cause.chainId);
  if (chain && chain.events >= BUILD_LIMITS.maxEventsPerChain) return reject('chain-limit');
  const chains = chain ? state.chains.map((candidate) => candidate === chain ? { ...candidate, events: candidate.events + 1 } : candidate) : [...state.chains, { id: event.cause.chainId, events: 1 }];
  const {commands,hotWeapons}=resolveCommands(build,state.hotWeapons,event);
  return { state: { seenEventIds: [...state.seenEventIds, event.id], chains, hotWeapons }, commands };
}

/** Shared effects keep the validating pure reducer and the live event ledger identical. */
function resolveCommands(build:BuildState,primedWeapons:readonly BuildWeapon[],event:BuildEvent){
  let hotWeapons = [...primedWeapons];
  const commands: BuildCommand[] = [];
  const has = (mutation: MutationId) => build.mutations.includes(mutation);
  const canChain = event.cause.depth < BUILD_LIMITS.maxDepth;
  const emit = (body: CommandBody) => commands.push({ ...body, id: `${event.id}:${commands.length}`, cause: { chainId: event.cause.chainId, depth: event.cause.depth + 1 } });
  const impulse = (targetId: string, direction: Readonly<{ x: number; y: number }>, power: number) => {
    const length = Math.hypot(direction.x, direction.y);
    if (length > 0 && power > 0) emit({ type: 'impulse', targetId, x: direction.x / length * power, y: direction.y / length * power });
  };
  const resource = (snapshot: ResourceSnapshot, healthDelta = 0, armorDelta = 0, magazineDelta = 0, reserveDelta = 0) => {
    if (healthDelta || armorDelta || magazineDelta || reserveDelta) emit({ type: 'resources', weapon: snapshot.weapon, healthDelta, armorDelta, magazineDelta, reserveDelta });
  };
  switch (event.type) {
    case 'shot': {
      let multiplier = 1;
      if (has('hot-reload') && hotWeapons.includes(event.weapon)) multiplier *= 1.5;
      hotWeapons = hotWeapons.filter((weapon) => weapon !== event.weapon);
      if (has('last-shell') && event.weapon === 'shotgun' && event.magazineBefore === 1) multiplier *= 1.6;
      if (multiplier !== 1) emit({ type: 'shot-bonus', damageMultiplier: multiplier });
      break;
    }
    case 'reload':
      if (has('hot-reload') && event.roundsLoaded > 0 && !hotWeapons.includes(event.weapon)) hotWeapons.push(event.weapon);
      break;
    case 'hit': {
      if (canChain && event.weapon === 'shotgun' && has('breacher')) impulse(event.targetId, event.direction, has('heavy-pellets') ? 270 : 180);
      const shattered = canChain && has('shattershot') && event.chilledStacks >= 3;
      if (shattered) {
        emit({ type: 'chill', targetId: event.targetId, stacks: 0, durationMs: 0, slowFraction: 0 });
        emit({ type: 'damage', targetId: event.targetId, amount: 24, source: 'secondary', visual: 'shatter' });
        emit({ type: 'explosion', centerTargetId: event.targetId, damage: 16, radius: 60, maxTargets: BUILD_LIMITS.maxAreaTargets, source: 'secondary', visual: 'shatter' });
      } else if (has('cryogenic')) {
        const stacks = Math.min(3, event.chilledStacks + 1);
        emit({ type: 'chill', targetId: event.targetId, stacks, durationMs: (has('permafrost')?3500:2000)+(familyBonuses(build).cryo?500:0), slowFraction: stacks * 0.15+(familyBonuses(build).cryo?.05:0) });
      }
      break;
    }
    case 'wall-hit':
      if(canChain&&has('seismic-impact')&&event.impulse>0)emit({type:'explosion',centerTargetId:event.targetId,damage:24,radius:100,maxTargets:4,source:'secondary',visual:'wall-slam'});
      if (canChain && has('breacher') && event.impulse > 0) emit({ type: 'damage', targetId: event.targetId, amount: Math.min(36, event.impulse * 0.12), source: 'secondary', visual: 'wall-slam' });
      break;
    case 'body-collision':
      if (canChain && has('chain-reaction') && event.impulse > 0) {
        emit({ type: 'damage', targetId: event.targetId, amount: Math.min(24, event.impulse * 0.08), source: 'secondary' });
        impulse(event.targetId, event.direction, Math.min(270, event.impulse) * 0.55);
      }
      break;
    case 'kill': {
      if (canChain && has('volatile-remains')) emit({ type: 'explosion', centerTargetId: event.targetId, damage: 22, radius: 72, maxTargets: BUILD_LIMITS.maxAreaTargets, source: 'secondary' });
      // Legacy resource IDs now select Kindling and the explicit Blood Price risk.
      break;
    }
    case 'pickup':
      // Cycle Capacitor charges from ordinary shots, not ammo pickups.
      break;
    case 'heal':
      if (has('field-medic') && event.amount > 0 && event.resources.health > 0) {
        const bonus = Math.min(25, event.amount * 0.25);
        const health = Math.min(bonus, event.resources.maxHealth - event.resources.health);
        const armor = Math.min(10, bonus - health, event.resources.maxArmor - event.resources.armor);
        resource(event.resources, health, armor);
      }
      break;
  }
  return {commands,hotWeapons};
}

/** Owns live encounter history. Never copies or revalidates the growing history on a hit. */
export class BuildEventResolver {
  private seen=new Set<string>();
  private chains=new Map<string,number>();
  private hot:BuildWeapon[]=[];
  isPrimed(weapon:BuildWeapon){return this.hot.includes(weapon);}
  reset(){this.seen.clear();this.chains.clear();this.hot=[];}
  get snapshot():BuildResolutionState{return {seenEventIds:[...this.seen],chains:[...this.chains].map(([id,events])=>({id,events})),hotWeapons:[...this.hot]};}
  resolve(build:BuildState,event:BuildEvent):Omit<BuildResolution,'state'>{
    const reject=(rejected:NonNullable<BuildResolution['rejected']>)=>({commands:[],rejected});
    if(!isValidBuildState(build))return reject('invalid-build');
    if(!isValidBuildEvent(event))return reject('invalid-event');
    if(this.seen.has(event.id))return reject('duplicate');
    if(event.cause.depth>BUILD_LIMITS.maxDepth)return reject('depth-limit');
    if(this.seen.size>=BUILD_LIMITS.maxEncounterEvents)return reject('encounter-limit');
    const count=this.chains.get(event.cause.chainId)??0;
    if(count>=BUILD_LIMITS.maxEventsPerChain)return reject('chain-limit');
    const result=resolveCommands(build,this.hot,event);
    this.seen.add(event.id);this.chains.set(event.cause.chainId,count+1);this.hot=result.hotWeapons;
    return {commands:result.commands};
  }
}
