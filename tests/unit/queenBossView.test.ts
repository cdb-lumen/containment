import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: { Clamp: (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value)) },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}));

import { CHARACTER_SKINS } from '../../src/game/art/characterSkins';
import { BossRuntime, didQueenDurabilityDecrease, routeQueenBossEventPresentation } from '../../src/game/enemies/BossRuntime';
import type { QueenBossEvent, QueenBossSnapshot } from '../../src/game/enemies/QueenBossSystem';
import { QueenBossSystem } from '../../src/game/enemies/QueenBossSystem';
import { QueenBossView } from '../../src/game/enemies/QueenBossView';

const snapshot = (overrides: Partial<QueenBossSnapshot> = {}): QueenBossSnapshot => ({
  active: true, defeated: false, phase: 'armored', stage: 1, x: 400, y: 300,
  rotation: 0.25, armor: 100, health: 5_000, maxHealth: 5_000, vulnerable: false,
  phaseRemainingMs: 1_000, nests: [], pendingTelegraph: null, ...overrides,
});

const createImage = (physics: boolean) => {
  const image = {
    x: 0, y: 0, width: 160, scaleX: 1, scaleY: 1, displayWidth: 0, displayHeight: 0,
    rotation: 0, alpha: 1, depth: 0, active: true, visible: true, texture: '', frame: 0,
    tint: undefined as number | undefined,
    body: physics ? {
      enable: true, isCircle: false, radius: 0, velocity: { x: 0, y: 0 },
      setAllowGravity() { return this; }, setImmovable() { return this; },
      setVelocity(x: number, y: number) { this.velocity = { x, y }; return this; },
      reset(x: number, y: number) { image.x = x; image.y = y; return this; },
    } : undefined,
    setTexture(v: string) { image.texture = v; return image; },
    setDisplaySize(w: number, h: number) { image.displayWidth = w; image.displayHeight = h; image.scaleX = w / image.width; image.scaleY = h / image.width; return image; },
    setPosition(x: number, y: number) { image.x = x; image.y = y; return image; },
    setRotation(v: number) { image.rotation = v; return image; }, setAlpha(v: number) { image.alpha = v; return image; },
    setScale(v: number) { image.scaleX = v; image.scaleY = v; return image; }, setDepth(v: number) { image.depth = v; return image; },
    setActive(v: boolean) { image.active = v; return image; }, setVisible(v: boolean) { image.visible = v; return image; },
    setFrame(v: number) { image.frame = v; return image; }, setTint(v: number) { image.tint = v; return image; },
    clearTint() { image.tint = undefined; return image; },
    setCircle(radius: number) { if (image.body) { image.body.isCircle = true; image.body.radius = radius; } return image; },
    destroy: vi.fn(),
  };
  return image;
};

const createScene = (sheetLoaded: boolean, registry: Record<string, unknown> = {}) => {
  const bodies: ReturnType<typeof createImage>[] = [];
  const art: ReturnType<typeof createImage>[] = [];
  const listeners = new Map<string, () => void>();
  const graphics = () => ({ active: true, alpha: 1, setDepth() { return this; }, clear() { return this; }, fillStyle() { return this; }, fillRect() { return this; }, strokeRect() { return this; }, lineStyle() { return this; }, beginPath() { return this; }, moveTo() { return this; }, lineTo() { return this; }, closePath() { return this; }, strokePath() { return this; }, fillCircle() { return this; }, strokeCircle() { return this; }, lineBetween() { return this; }, arc() { return this; }, setScale() { return this; }, destroy() { this.active = false; } });
  const group = { add() {}, destroy: vi.fn() };
  const scene = {
    time: { now: 250 }, textures: { exists: (key: string) => sheetLoaded && key === CHARACTER_SKINS.queen.texture },
    registry: { get: (key: string) => registry[key] },
    events: { once: (name: string, fn: () => void) => listeners.set(name, fn), off: vi.fn() },
    physics: { add: { group: () => group, image: () => { const value = createImage(true); bodies.push(value); return value; } } },
    add: { graphics: () => graphics(), image: (_x: number, _y: number, texture: string) => { const value = createImage(false); value.texture = texture; art.push(value); return value; } },
    tweens: { add: () => ({ stop() {} }), remove() {} },
  };
  return { scene, bodies, art, group, shutdown: () => listeners.get('shutdown')?.() };
};

describe('queen durability presentation routing', () => {
  it('detects strict armor or health decreases and rejects no-op/malformed values', () => {
    expect(didQueenDurabilityDecrease({ armor: 10, health: 50 }, { armor: 9, health: 50 })).toBe(true);
    expect(didQueenDurabilityDecrease({ armor: 0, health: 50 }, { armor: 0, health: 49 })).toBe(true);
    expect(didQueenDurabilityDecrease({ armor: 10, health: 50 }, { armor: 10, health: 50 })).toBe(false);
    expect(didQueenDurabilityDecrease({ armor: 10, health: 50 }, { armor: 11, health: 51 })).toBe(false);
  });

  it('routes real system attack event types but not unrelated nest events', () => {
    const system = new QueenBossSystem();
    system.start(100, 100);
    const telegraph = system.update(0, { x: 100, y: 100 }, 0)[0];
    const routed: QueenBossEvent[] = [];
    expect(routeQueenBossEventPresentation(telegraph, (event) => routed.push(event))).toBe(true);
    expect(routeQueenBossEventPresentation({ type: 'nest-destroyed', eventId: 99, nestId: 1, x: 0, y: 0 }, (event) => routed.push(event))).toBe(false);
    expect(routed).toEqual([telegraph]);
  });

  it('uses the runtime signal seam for armor and core decreases, but not no-ops or nests', () => {
    const { scene } = createScene(true);
    const hitSignals: Array<[unknown, boolean]> = [];
    const signal = vi.spyOn(QueenBossView.prototype, 'handleAppliedDamage')
      .mockImplementation((target, decreased) => { hitSignals.push([target, decreased]); });
    const runtime = new BossRuntime({
      scene: scene as never,
      combat: { applyDamage: vi.fn() } as never,
      player: { sprite: { x: 10_000, y: 10_000, body: { isCircle: true, halfWidth: 24 } } } as never,
      getOccupiedEnemyCapacity: () => 0, spawnMinion: () => true, onQueenDefeated: () => {},
    });
    runtime.start(100, 100);
    const request = { damage: 10 } as never;
    runtime.handleProjectileHit({ type: 'queen' }, request, { hit: () => ({ applied: true, exhausted: false }) } as never);
    expect(hitSignals.at(-1)).toEqual([{ type: 'queen' }, true]);
    runtime.handleProjectileHit({ type: 'queen' }, request, { hit: () => ({ applied: false, exhausted: false }) } as never);
    expect(hitSignals).toHaveLength(1);
    runtime.update(2_000); runtime.update(1_000);
    runtime.handleProjectileHit({ type: 'queen' }, request, { hit: () => ({ applied: true, exhausted: false }) } as never);
    expect(hitSignals.at(-1)).toEqual([{ type: 'queen' }, true]);
    const nestId = runtime.snapshot.nests[0].id;
    runtime.handleProjectileHit({ type: 'nest', id: nestId }, request, { hit: () => ({ applied: true, exhausted: false }) } as never);
    expect(hitSignals.at(-1)).toEqual([{ type: 'nest', id: nestId }, false]);
    signal.mockRestore();
  });
});

describe('QueenBossView integration', () => {
  it('uses one framed follower while the authoritative circular body stays invisible and untransformed', () => {
    const { scene, bodies, art } = createScene(true);
    const view = new QueenBossView(scene as never);
    view.sync(snapshot()); view.sync(snapshot({ x: 410 }));
    expect(art).toHaveLength(1);
    expect(art[0]).toMatchObject({ active: true, visible: true, texture: CHARACTER_SKINS.queen.texture });
    expect(art[0].frame).toBe(CHARACTER_SKINS.queen.frames.idleA);
    expect(bodies.find(({ active }) => active)).toMatchObject({ visible: false, rotation: 0.25, alpha: 1 });
    expect(bodies.find(({ active }) => active)!.body).toMatchObject({ enable: true, isCircle: true });
  });

  it('keeps procedural body visible with no follower when the sheet is unavailable', () => {
    const { scene, bodies, art } = createScene(false);
    const view = new QueenBossView(scene as never);
    view.sync(snapshot());
    expect(art).toHaveLength(0);
    expect(bodies.find(({ active }) => active)).toMatchObject({ visible: true, body: { enable: true } });
  });

  it('retains death art after the inactive snapshot, disables overlap immediately, then resets and reacquires cleanly', () => {
    const { scene, bodies, art } = createScene(true);
    const view = new QueenBossView(scene as never);
    view.sync(snapshot({ x: 321, y: 654 }));
    view.handleEvent({ type: 'queen-defeated', eventId: 7, x: 321, y: 654, reward: 1 });
    view.sync(snapshot({ active: false, defeated: true, phase: 'defeated', health: 0, armor: 0, x: 321, y: 654 }));
    expect(bodies.every(({ body }) => body?.enable === false)).toBe(true);
    expect(art[0]).toMatchObject({ active: true, visible: true, x: 321, y: 654, frame: CHARACTER_SKINS.queen.frames.death });
    view.clear();
    expect(art[0]).toMatchObject({ active: false, visible: false, x: 0, y: 0, frame: 0 });
    view.sync(snapshot({ x: 10, y: 20, rotation: 0 }));
    expect(art).toHaveLength(1);
    expect(art[0]).toMatchObject({ active: true, visible: true, frame: CHARACTER_SKINS.queen.frames.idleA, tint: undefined });
  });

  it('honors reduced policies, keeps nests procedural, and does not destroy scene groups on shutdown', () => {
    const { scene, bodies, art, group, shutdown } = createScene(true, { reducedMotion: true, settings: { reducedFlash: true } });
    const view = new QueenBossView(scene as never);
    view.setQuality('low');
    view.sync(snapshot({ nests: [{ id: 1, x: 50, y: 60, health: 100, maxHealth: 100, spawnCooldownRemainingMs: 0 }] }));
    view.handleAppliedDamage({ type: 'queen' }, true);
    view.sync(snapshot({ health: 4_999, nests: [{ id: 1, x: 50, y: 60, health: 100, maxHealth: 100, spawnCooldownRemainingMs: 0 }] }));
    expect(art).toHaveLength(1);
    expect(art[0]).toMatchObject({ frame: CHARACTER_SKINS.queen.frames.hit, tint: undefined, x: 400, y: 300, rotation: 0.25 });
    expect(bodies.filter(({ active }) => active)).toHaveLength(2);
    shutdown();
    expect(group.destroy).not.toHaveBeenCalled();
    expect(art[0].destroy).not.toHaveBeenCalled();
  });
});
