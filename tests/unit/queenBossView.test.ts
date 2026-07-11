import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: { Clamp: (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value)) },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}));

import { CHARACTER_SKINS } from '../../src/game/art/characterSkins';
import { TEXTURE_KEYS } from '../../src/game/art/createTextures';
import { BossRuntime, routeQueenBossEventPresentation } from '../../src/game/enemies/BossRuntime';
import type { BossRuntimeOptions } from '../../src/game/enemies/BossRuntime';
import type { QueenBossEvent, QueenBossSnapshot } from '../../src/game/enemies/QueenBossSystem';
import { QueenBossSystem } from '../../src/game/enemies/QueenBossSystem';
import { QueenBossView } from '../../src/game/enemies/QueenBossView';

const snapshot = (overrides: Partial<QueenBossSnapshot> = {}): QueenBossSnapshot => ({
  active: true, defeated: false, phase: 'armored', stage: 1, x: 400, y: 300,
  rotation: 0.25, health: 5_000, maxHealth: 5_000, vulnerable: false,
  phaseRemainingMs: 1_000, nests: [], pendingTelegraph: null, ...overrides,
});

const createImage = (physics: boolean) => {
  const image = {
    x: 0, y: 0, width: 160, scaleX: 1, scaleY: 1, displayWidth: 0, displayHeight: 0,
    rotation: 0, alpha: 1, depth: 0, active: true, visible: true, texture: '', frame: 0,
    tint: undefined as number | undefined,
    body: physics ? {
      enable: true, isCircle: false, radius: 0, offset: { x: 0, y: 0 },
      position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 },
      setAllowGravity() { return this; }, setImmovable() { return this; },
      setVelocity(x: number, y: number) { this.velocity = { x, y }; return this; },
      reset(x: number, y: number) { image.x = x; image.y = y; this.position = { x, y }; return this; },
    } : undefined,
    setTexture(v: string) { image.texture = v; return image; },
    setDisplaySize(w: number, h: number) { image.displayWidth = w; image.displayHeight = h; image.scaleX = w / image.width; image.scaleY = h / image.width; return image; },
    setPosition(x: number, y: number) { image.x = x; image.y = y; return image; },
    setRotation(v: number) { image.rotation = v; return image; }, setAlpha(v: number) { image.alpha = v; return image; },
    setScale(v: number) { image.scaleX = v; image.scaleY = v; return image; }, setDepth(v: number) { image.depth = v; return image; },
    setActive(v: boolean) { image.active = v; return image; }, setVisible(v: boolean) { image.visible = v; return image; },
    setFrame(v: number) { image.frame = v; return image; }, setTint(v: number) { image.tint = v; return image; },
    clearTint() { image.tint = undefined; return image; },
    setCircle(radius: number, offsetX = 0, offsetY = 0) {
      if (image.body) { image.body.isCircle = true; image.body.radius = radius; image.body.offset = { x: offsetX, y: offsetY }; }
      return image;
    },
    destroy: vi.fn(),
  };
  return image;
};

type FakeImage = ReturnType<typeof createImage>;
const bodyInvariant = (image: FakeImage) => ({
  x: image.x, y: image.y, texture: image.texture, active: image.active,
  body: image.body && {
    enable: image.body.enable, isCircle: image.body.isCircle, radius: image.body.radius,
    offset: { ...image.body.offset }, position: { ...image.body.position }, velocity: { ...image.body.velocity },
  },
});

const createScene = (sheetLoaded: boolean, registry: Record<string, unknown> = {}) => {
  const bodies: FakeImage[] = [];
  const art: FakeImage[] = [];
  const listeners = new Map<string, Array<() => void>>();
  const graphics = () => ({ active: true, alpha: 1, setDepth() { return this; }, clear() { return this; }, fillStyle() { return this; }, fillRect() { return this; }, strokeRect() { return this; }, lineStyle() { return this; }, beginPath() { return this; }, moveTo() { return this; }, lineTo() { return this; }, closePath() { return this; }, strokePath() { return this; }, fillCircle() { return this; }, strokeCircle() { return this; }, lineBetween() { return this; }, arc() { return this; }, setScale() { return this; }, destroy() { this.active = false; } });
  const group = { add() {}, destroy: vi.fn() };
  const scene = {
    time: { now: 250 }, textures: { exists: (key: string) => sheetLoaded && key === CHARACTER_SKINS.queen.texture },
    registry: { get: (key: string) => registry[key] },
    events: {
      once: (name: string, fn: () => void) => listeners.set(name, [...(listeners.get(name) ?? []), fn]),
      off: vi.fn(),
    },
    physics: { add: { group: () => group, image: () => { const value = createImage(true); bodies.push(value); return value; } } },
    add: { graphics: () => graphics(), image: (_x: number, _y: number, texture: string) => { const value = createImage(false); value.texture = texture; art.push(value); return value; } },
    tweens: { add: () => ({ stop() {} }), remove() {} },
  };
  return { scene, bodies, art, group, shutdown: () => listeners.get('shutdown')?.forEach((listener) => listener()) };
};

const runtimeFor = (
  scene: ReturnType<typeof createScene>['scene'],
  player = { x: 10_000, y: 10_000 },
  onQueenDefeated: BossRuntimeOptions['onQueenDefeated'] = () => {},
) => new BossRuntime({
  scene: scene as never, combat: { applyDamage: vi.fn() } as never,
  player: { sprite: { ...player, body: { isCircle: true, halfWidth: 24 } } } as never,
  getOccupiedEnemyCapacity: () => 50, spawnMinion: () => false, onQueenDefeated,
});

describe('queen damage-result presentation routing', () => {
  it('routes real system attack event types but not unrelated nest events', () => {
    const system = new QueenBossSystem();
    system.start(100, 100);
    const telegraph = system.update(0, { x: 100, y: 100 }, 0)[0];
    const routed: QueenBossEvent[] = [];
    expect(routeQueenBossEventPresentation(telegraph, (event) => routed.push(event))).toBe(true);
    expect(routeQueenBossEventPresentation({ type: 'nest-destroyed', eventId: 99, nestId: 1, x: 0, y: 0 }, (event) => routed.push(event))).toBe(false);
    expect(routed).toEqual([telegraph]);
  });

  it('signals blocked and applied queen hits, but not no-op or nest-only damage', () => {
    const { scene } = createScene(true);
    const signals: Array<[unknown, boolean]> = [];
    const spy = vi.spyOn(QueenBossView.prototype, 'handleAppliedDamage')
      .mockImplementation((target, decreased) => { signals.push([target, decreased]); });
    const runtime = runtimeFor(scene);
    runtime.start(100, 100);

    runtime.applyAreaDamage(100, 100, 10, 50);
    expect(signals).toEqual([[{ type: 'queen' }, true]]);
    signals.length = 0;
    runtime.applyAreaDamage(10_000, 10_000, 10, 50);
    runtime.applyAreaDamage(100, 100, 0, 50);
    expect(signals).toEqual([]);

    runtime.update(2_000); runtime.update(1_000);
    runtime.applyAreaDamage(100, 100, 10, 50);
    expect(signals).toEqual([[{ type: 'queen' }, true]]);
    signals.length = 0;

    const nest = runtime.snapshot.nests[0];
    runtime.applyAreaDamage(nest.x, nest.y, 10, 25);
    expect(signals).toEqual([]);
    signals.length = 0;

    runtime.update(4_000);
    runtime.applyAreaDamage(100, 100, 10, 50);
    expect(signals).toEqual([[{ type: 'queen' }, true]]);
    spy.mockRestore();
  });

  it('routes production runtime attack and defeat events into attack/death presentation', () => {
    const { scene, art } = createScene(true);
    const routed: QueenBossEvent[] = [];
    const original = QueenBossView.prototype.handleEvent;
    const spy = vi.spyOn(QueenBossView.prototype, 'handleEvent').mockImplementation(function (this: QueenBossView, event) {
      routed.push(event); original.call(this, event);
    });
    const runtime = runtimeFor(scene, { x: 100, y: 100 });
    runtime.start(100, 100);
    runtime.update(0);
    routed.length = 0;
    runtime.update(900);
    expect(routed.map(({ type }) => type)).toContain('area-attack');
    expect(art[0].frame).toBe(CHARACTER_SKINS.queen.frames.attack);

    routed.length = 0;
    expect(runtime.forceDefeatForDiagnostics()).toBe(true);
    expect(routed.map(({ type }) => type)).toContain('queen-defeated');
    expect(art[0]).toMatchObject({ frame: CHARACTER_SKINS.queen.frames.death, active: true, visible: true });
    spy.mockRestore();
  });

  it('releases the authoritative queen body after death presentation and before the victory callback', () => {
    const { scene, bodies, art } = createScene(true);
    const callbackStates: unknown[] = [];
    const runtime = runtimeFor(scene, { x: 100, y: 100 }, () => {
      const queen = bodies.find(({ texture }) => texture === TEXTURE_KEYS.alienQueen)!;
      callbackStates.push({
        bodyActive: queen.active,
        bodyEnabled: queen.body?.enable,
        target: runtime.targetFor(queen),
        deathArt: {
          active: art[0].active,
          visible: art[0].visible,
          frame: art[0].frame,
        },
      });
    });
    runtime.start(100, 100);
    runtime.update(2_000);
    runtime.update(1_000);

    const result = runtime.applyAreaDamage(100, 100, runtime.snapshot.maxHealth, 50);
    expect(result).toMatchObject({ appliedCount: 1, destroyedCount: 1, defeated: true });
    expect(callbackStates).toEqual([{
      bodyActive: false,
      bodyEnabled: false,
      target: null,
      deathArt: {
        active: true,
        visible: true,
        frame: CHARACTER_SKINS.queen.frames.death,
      },
    }]);
  });
});

describe('QueenBossView integration', () => {
  it('keeps complete queen/nest body state authoritative through follower animation and feedback', () => {
    const { scene, bodies, art } = createScene(true);
    const view = new QueenBossView(scene as never);
    const state = snapshot({ nests: [{ id: 1, x: 50, y: 60, health: 100, maxHealth: 100, spawnCooldownRemainingMs: 0 }] });
    view.sync(state);
    const queen = bodies.find(({ texture }) => texture === TEXTURE_KEYS.alienQueen)!;
    const nest = bodies.find(({ texture }) => texture === TEXTURE_KEYS.alienDrone)!;
    const before = [bodyInvariant(queen), bodyInvariant(nest)];

    view.handleEvent({ type: 'area-telegraph', eventId: 1, telegraphId: 1, x: 400, y: 300, radius: 120, delayMs: 900, damage: 10 });
    view.handleEvent({ type: 'area-attack', eventId: 2, telegraphId: 1, x: 400, y: 300, radius: 120, damage: 10 });
    view.handleAppliedDamage({ type: 'queen' }, true);
    view.sync(state);

    expect([bodyInvariant(queen), bodyInvariant(nest)]).toEqual(before);
    expect(queen.body?.velocity).toEqual({ x: 0, y: 0 });
    expect(nest.body?.velocity).toEqual({ x: 0, y: 0 });
    expect(art).toHaveLength(1);
    expect(nest.texture).toBe(TEXTURE_KEYS.alienDrone);
    expect(art[0].texture).toBe(CHARACTER_SKINS.queen.texture);
  });

  it('keeps procedural body visible with no follower when the sheet is unavailable', () => {
    const { scene, bodies, art } = createScene(false);
    const view = new QueenBossView(scene as never);
    view.sync(snapshot());
    expect(art).toHaveLength(0);
    expect(bodies.find(({ active }) => active)).toMatchObject({ visible: true, body: { enable: true } });
  });

  it('reacquires cleanly after retained death and scene shutdown only drops bookkeeping', () => {
    const { scene, bodies, art, group, shutdown } = createScene(true, { reducedMotion: true, settings: { reducedFlash: true } });
    const view = new QueenBossView(scene as never);
    view.sync(snapshot({ x: 321, y: 654 }));
    view.handleEvent({ type: 'queen-defeated', eventId: 7, x: 321, y: 654, reward: 1 });
    view.sync(snapshot({ active: false, defeated: true, phase: 'defeated', health: 0, x: 321, y: 654 }));
    expect(bodies.every(({ body }) => body?.enable === false)).toBe(true);
    expect(art[0]).toMatchObject({ active: true, visible: true, frame: CHARACTER_SKINS.queen.frames.death });

    const active = snapshot({ x: 10, y: 20, rotation: 0, phase: 'vulnerable', vulnerable: true });
    const baselineScene = createScene(true, { reducedMotion: true, settings: { reducedFlash: true } });
    new QueenBossView(baselineScene.scene as never).sync(active);
    const baselineArt = baselineScene.art[0];
    view.sync(active);
    expect(art).toHaveLength(1);
    expect(art[0]).toMatchObject({
      active: true, visible: true, x: baselineArt.x, y: baselineArt.y,
      rotation: baselineArt.rotation, alpha: baselineArt.alpha,
      frame: CHARACTER_SKINS.queen.frames.idleA, tint: undefined,
    });
    expect(bodies.filter(({ active }) => active)).toHaveLength(1);

    view.handleEvent({ type: 'queen-defeated', eventId: 8, x: 10, y: 20, reward: 1 });
    const queen = bodies.find(({ texture }) => texture === TEXTURE_KEYS.alienQueen)!;
    const bodySetters = [
      'setTexture', 'setDisplaySize', 'setPosition', 'setRotation', 'setAlpha', 'setScale',
      'setDepth', 'setActive', 'setVisible', 'setFrame', 'setTint', 'clearTint', 'setCircle',
    ] as const;
    const artSetters = bodySetters.filter((name) => name !== 'setCircle');
    const bodySpies = bodySetters.map((name) => vi.spyOn(queen, name));
    const artSpies = artSetters.map((name) => vi.spyOn(art[0], name));
    shutdown();
    expect(bodySpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    expect(artSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    expect(group.destroy).not.toHaveBeenCalled();
    expect(art[0].destroy).not.toHaveBeenCalled();
    expect(view.activeCount).toBe(0);
    expect(view.radarPositions).toEqual([]);
    expect(view.targetFor(queen)).toBeNull();

    view.sync(active);
    view.handleEvent({ type: 'queen-defeated', eventId: 9, x: 10, y: 20, reward: 1 });
    view.handleAppliedDamage({ type: 'queen' }, true);
    view.handleShieldBlocked({ type: 'queen' });
    view.clear();
    view.destroy();
    expect(bodySpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    expect(artSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    expect(group.destroy).not.toHaveBeenCalled();
    expect(art[0].destroy).not.toHaveBeenCalled();
  });

  it('honors reduced policies and keeps nests procedural', () => {
    const { scene, bodies, art } = createScene(true, { reducedMotion: true, settings: { reducedFlash: true } });
    const view = new QueenBossView(scene as never);
    view.setQuality('low');
    view.sync(snapshot({ nests: [{ id: 1, x: 50, y: 60, health: 100, maxHealth: 100, spawnCooldownRemainingMs: 0 }] }));
    view.handleAppliedDamage({ type: 'queen' }, true);
    view.sync(snapshot({ health: 4_999, nests: [{ id: 1, x: 50, y: 60, health: 100, maxHealth: 100, spawnCooldownRemainingMs: 0 }] }));
    expect(art).toHaveLength(1);
    expect(art[0]).toMatchObject({ tint: undefined, x: 400, y: 300, rotation: 0.25 });
    expect(bodies.filter(({ active }) => active)).toHaveLength(2);
  });
});
