import type { StandardEnemyId } from '../enemies/types';
import type { RunNode } from '../roguelike/types';
import { generateRun } from '../roguelike/run';

export type EncounterPhase = 'idle' | 'combat' | 'boss' | 'complete' | 'dead';
export type EncounterSpawn = Readonly<{
  type: 'spawn-request'; spawnId: string; atMs: number; wave: number;
  enemyId: StandardEnemyId; elite: boolean; breachId: string;
}>;
export type EncounterEvent = EncounterSpawn
  | Readonly<{ type: 'room-start'; nodeId: string; depth: number; wave: number }>
  | Readonly<{ type: 'boss-start' }>
  | Readonly<{ type: 'room-clear'; nodeId: string; wave: number }>
  | Readonly<{ type: 'defeat' }>;
export type EncounterOptions = Readonly<{ seed: number; node: RunNode; breachIds: readonly string[] }>;
export type EncounterPlan = Readonly<{
  nodeId: string; kind: RunNode['kind']; wave: number; totalSpawns: number;
  concurrentCap: number; schedule: readonly EncounterSpawn[];
}>;
export type EncounterSnapshot = Readonly<{
  phase: EncounterPhase; elapsedMs: number; dispatched: number; remaining: number;
  totalSpawns: number; concurrentCap: number;
}>;

export function createEncounterPlan(options: EncounterOptions): EncounterPlan {
  const canonical = generateRun(options.seed,options.node.id.includes(':v3-')?3:options.node.id.includes(':v2-')?2:1).nodes.find(node => node.id === options.node.id);
  if (!canonical || canonical.kind !== options.node.kind || canonical.depth !== options.node.depth
    || canonical.templateId !== options.node.templateId) throw new Error('Encounter node does not belong to this seed.');
  const { node, breachIds } = options;
  if (!Array.isArray(breachIds) || breachIds.length > 8
    || breachIds.some(id => typeof id !== 'string' || !id.trim() || id.length > 160)
    || new Set(breachIds).size !== breachIds.length) throw new Error('Invalid encounter breach IDs.');
  const combat = node.kind === 'combat' || node.kind === 'elite';
  if (combat && breachIds.length === 0) throw new Error('Combat encounters need at least one breach.');
  const story=node.id.includes(':v3-'),holdout=story&&(node.depth===9||node.depth===19);
  const totalSpawns = combat ? story ? holdout ? (node.depth===9?40:48) : 12+Math.round(node.depth*.7)+(node.kind==='elite'?5:0) : Math.round((12 + node.depth * 3 + (node.kind === 'elite' ? 5 : 0))*(node.id.includes(':v2-')?1.25:1)) : 0;
  const concurrentCap = combat ? Math.min(18, 7 + Math.floor(node.depth * .8) + (node.kind === 'elite' ? 2 : 0)) : 0;
  let randomState = (options.seed ^ Math.imul(node.depth + 1, 0x9e3779b9) ^ (node.kind === 'elite' ? 0xabc123 : 0)) >>> 0;
  const random = (): number => {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let value = Math.imul(randomState ^ (randomState >>> 15), randomState | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
  const pool: readonly StandardEnemyId[] = node.depth === 0 ? ['crawler', 'crawler', 'crawler', 'brute']
    : node.depth < 4 ? ['crawler', 'crawler', 'brute', 'spitter']
    : node.depth < 8 ? ['crawler','crawler','spitter','stalker','carrier']
    : ['crawler', 'crawler', 'brute', 'spitter', 'spitter', 'stalker', 'carrier'];
  const interval = Math.max(430,1050-node.depth*48-(node.kind==='elite'?120:0));
  const schedule = Array.from({ length: totalSpawns }, (_, index): EncounterSpawn => Object.freeze({
    type: 'spawn-request', spawnId: `${node.id}:spawn-${index}`, atMs: story ? 650+(holdout?index*900:Math.floor(index/6)*1100+(index%6)*100) : 650 + index * interval + Math.floor(index/8)*1800, wave: node.depth + 1,
    enemyId: node.kind === 'elite' && index === 0 ? (story?node.depth===15:node.id.includes(':v2-')&&node.depth===7)?'carrier':'brute' : pool[Math.floor(random() * pool.length)],
    elite: node.kind === 'elite' && (index === 0 || random() < 0.10+node.depth*.008),
    breachId: breachIds[Math.floor(random() * breachIds.length)],
  }));
  return Object.freeze({ nodeId: node.id, kind: node.kind, wave: node.depth + 1, totalSpawns, concurrentCap,
    schedule: Object.freeze(schedule) });
}

const EMPTY: readonly EncounterEvent[] = Object.freeze([]);
const events = (...values: EncounterEvent[]): readonly EncounterEvent[] => Object.freeze(values.map(value => Object.freeze(value)));

/** Pure deterministic domain director: no Phaser, timers, wall-clock, or callbacks.
 * Host occupiedCount MUST include active enemies, child reservations, and pending
 * spawn commands. Keep failed commands pending; dropping them can falsely clear a room.
 */
export class EncounterDirector {
  readonly plan: EncounterPlan;
  private currentPhase: EncounterPhase = 'idle';
  private elapsedMs = 0;
  private dispatched = 0;

  constructor(options: EncounterOptions) { this.plan = createEncounterPlan(options); }
  get phase(): EncounterPhase { return this.currentPhase; }
  get currentWave(): number { return this.plan.wave; }
  get snapshot(): EncounterSnapshot {
    return Object.freeze({ phase: this.currentPhase, elapsedMs: this.elapsedMs, dispatched: this.dispatched,
      remaining: this.plan.totalSpawns - this.dispatched, totalSpawns: this.plan.totalSpawns, concurrentCap: this.plan.concurrentCap });
  }

  start(): readonly EncounterEvent[] {
    if (this.currentPhase !== 'idle') return EMPTY;
    const start: EncounterEvent = { type: 'room-start', nodeId: this.plan.nodeId, depth: this.plan.wave - 1, wave: this.plan.wave };
    if (this.plan.kind === 'boss') {
      this.currentPhase = 'boss';
      return events(start, { type: 'boss-start' });
    }
    if (this.plan.kind === 'medical' || this.plan.kind === 'armory') {
      this.currentPhase = 'complete';
      return events(start, this.clearEvent());
    }
    this.currentPhase = 'combat';
    return events(start);
  }

  update(deltaMs: number, occupiedCount: number): readonly EncounterEvent[] {
    if (this.currentPhase !== 'combat' || !Number.isFinite(deltaMs) || deltaMs < 0
      || !Number.isSafeInteger(occupiedCount) || occupiedCount < 0) return EMPTY;
    this.elapsedMs = Math.min(Number.MAX_SAFE_INTEGER, this.elapsedMs + deltaMs);
    if (this.dispatched === this.plan.totalSpawns) {
      if (occupiedCount !== 0) return EMPTY;
      this.currentPhase = 'complete';
      return events(this.clearEvent());
    }
    const batch: EncounterEvent[] = [];
    let slots = Math.max(0, this.plan.concurrentCap - occupiedCount);
    while (slots>0 && this.dispatched < this.plan.totalSpawns) {
      const request = this.plan.schedule[this.dispatched];
      const cost=request.enemyId==='carrier'?4:1;
      if (request.atMs > this.elapsedMs||cost>slots) break;
      slots-=cost;batch.push(request);
      this.dispatched += 1;
    }
    // A final batch can only clear on a later update, after host occupancy settles.
    return batch.length ? Object.freeze(batch) : EMPTY;
  }

  reportBossDefeated(): readonly EncounterEvent[] {
    if (this.currentPhase !== 'boss') return EMPTY;
    this.currentPhase = 'complete';
    return events(this.clearEvent());
  }
  reportPlayerDefeated(): readonly EncounterEvent[] {
    if (this.currentPhase !== 'combat' && this.currentPhase !== 'boss') return EMPTY;
    this.currentPhase = 'dead';
    return events({ type: 'defeat' });
  }
  reset(): void { this.currentPhase = 'idle'; this.elapsedMs = 0; this.dispatched = 0; }
  private clearEvent(): EncounterEvent { return { type: 'room-clear', nodeId: this.plan.nodeId, wave: this.plan.wave }; }
}
