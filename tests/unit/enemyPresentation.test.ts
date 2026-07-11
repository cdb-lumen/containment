import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: { Clamp: (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value)) },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}));

import { CHARACTER_SKINS } from '../../src/game/art/characterSkins';
import { EnemyPresentationState } from '../../src/game/enemies/EnemyPresentationState';
import type { EnemySnapshot } from '../../src/game/enemies/EnemySystem';
import { EnemyView } from '../../src/game/enemies/EnemyView';
import type { StandardEnemyId } from '../../src/game/enemies/types';

const snapshot = (id: number, type: StandardEnemyId, overrides: Partial<EnemySnapshot> = {}): EnemySnapshot => ({
  id, type, elite: false, x: 100, y: 200, velocityX: 0, velocityY: 0,
  targetX: 100, targetY: 200, health: 100, maxHealth: 100, armor: 0, maxArmor: 0,
  radius: 20, speed: 100, contactDamage: 10, creditReward: 1, dropChance: 0,
  contactCooldownRemainingMs: 0, rangedCooldownRemainingMs: 0, decisionIntervalMs: 50,
  decisionCooldownRemainingMs: 0, decisionVersion: 0, camouflageState: 'none',
  camouflageRemainingMs: 0, alpha: 1, reservedChildren: 0, ...overrides,
});

describe('EnemyPresentationState', () => {
  it('flashes only a same-active-ID health decrease and fully resets on pooled reuse', () => {
    const state = new EnemyPresentationState();
    state.acquire(snapshot(7, 'crawler'));
    expect(state.update(snapshot(7, 'crawler'), 1_000, 'high', false, false).frame).not.toBe('hit');
    expect(state.update(snapshot(7, 'crawler', { health: 90 }), 1_010, 'high', false, false).frame).toBe('hit');
    state.release();
    state.acquire(snapshot(99, 'brute', { health: 40, maxHealth: 100 }));
    const reused = state.update(snapshot(99, 'brute', { health: 40, maxHealth: 100 }), 1_020, 'high', false, false);
    expect(reused).toMatchObject({ frame: 'idleA', offsetX: 0, offsetY: 0, rotationOffset: 0 });
    expect(state.snapshot).toMatchObject({ enemyId: 99, previousHealth: 40, hitUntilMs: 0, attackUntilMs: 0 });
  });

  it('uses explicit attack signals and derives deterministic animation phase from the new ID', () => {
    const a = new EnemyPresentationState();
    const b = new EnemyPresentationState();
    a.acquire(snapshot(3, 'carrier'));
    b.acquire(snapshot(4, 'carrier'));
    a.triggerAttack(50);
    expect(a.update(snapshot(3, 'carrier'), 50, 'high', false, false).frame).toBe('attack');
    expect(a.update(snapshot(3, 'carrier'), 500, 'high', false, false).frame).not.toBe('attack');
    expect(a.update(snapshot(3, 'carrier'), 125, 'high', false, false).offsetY)
      .not.toBe(b.update(snapshot(4, 'carrier'), 125, 'high', false, false).offsetY);
  });
});

const createImage = (physics: boolean) => {
  const image = {
    x: 0, y: 0, width: 96, scaleX: 1, scaleY: 1, displayWidth: 0, displayHeight: 0,
    rotation: 0, alpha: 1, depth: 0, active: true, visible: true, texture: '',
    frame: undefined as number | undefined, tint: undefined as number | undefined,
    body: physics ? {
      enable: true,
      setAllowGravity() { return this; }, setImmovable() { return this; },
      reset(x: number, y: number) { image.x = x; image.y = y; },
    } : undefined,
    setTexture(texture: string) { image.texture = texture; return image; },
    setDisplaySize(w: number, h: number) { image.displayWidth = w; image.displayHeight = h; image.scaleX = w / image.width; image.scaleY = h / image.width; return image; },
    setPosition(x: number, y: number) { image.x = x; image.y = y; return image; },
    setRotation(v: number) { image.rotation = v; return image; }, setAlpha(v: number) { image.alpha = v; return image; },
    setScale(v: number) { image.scaleX = v; image.scaleY = v; return image; },
    setDepth(v: number) { image.depth = v; return image; }, setActive(v: boolean) { image.active = v; return image; },
    setVisible(v: boolean) { image.visible = v; return image; }, setFrame(v: number) { image.frame = v; return image; },
    setFlipX() { return image; }, setTint(v: number) { image.tint = v; return image; }, clearTint() { image.tint = undefined; return image; },
    setCircle() { return image; },
  };
  return image;
};

const createScene = (loaded: Set<string>) => {
  const bodies: ReturnType<typeof createImage>[] = [];
  const art: ReturnType<typeof createImage>[] = [];
  const graphics = { setDepth() { return this; }, clear() { return this; }, fillStyle() { return this; }, fillRect() { return this; }, lineStyle() { return this; }, beginPath() { return this; }, moveTo() { return this; }, lineTo() { return this; }, closePath() { return this; }, strokePath() { return this; }, setVisible() { return this; } };
  const scene = {
    time: { now: 250 }, textures: { exists: (key: string) => loaded.has(key) },
    registry: { get: () => false }, events: { once() {}, off() {} },
    physics: { add: { group: () => ({ add() {} }), image: () => { const value = createImage(true); bodies.push(value); return value; } } },
    add: { graphics: () => graphics, image: () => { const value = createImage(false); art.push(value); return value; } },
  };
  return { scene, bodies, art };
};

describe('EnemyView pooled follower integration', () => {
  it('maps every loaded family to framed follower art while bodies stay authoritative and untransformed', () => {
    const loaded = new Set(Object.values(CHARACTER_SKINS).map(({ texture }) => texture));
    const { scene, bodies, art } = createScene(loaded);
    const view = new EnemyView(scene as never);
    const types: StandardEnemyId[] = ['crawler', 'brute', 'spitter', 'stalker', 'carrier'];
    view.sync(types.map((type, index) => snapshot(index + 1, type, { velocityX: 10 })));
    expect(art.filter(({ active }) => active)).toHaveLength(5);
    expect(new Set(art.filter(({ active }) => active).map(({ texture }) => texture)))
      .toEqual(new Set(types.map((type) => CHARACTER_SKINS[type].texture)));
    for (const body of bodies.filter(({ active }) => active)) expect(body).toMatchObject({ visible: false, rotation: 0, scaleX: expect.any(Number), alpha: 1 });
    expect(view.count).toBe(5);
    expect(view.visualCount).toBeLessThanOrEqual(150);
  });

  it('keeps procedural fallbacks visible and frameless without allocating follower art', () => {
    const { scene, bodies, art } = createScene(new Set());
    const view = new EnemyView(scene as never);
    const types: StandardEnemyId[] = ['crawler', 'brute', 'spitter', 'stalker', 'carrier'];
    view.sync(types.map((type, index) => snapshot(index + 1, type)));
    expect(art).toHaveLength(0);
    expect(bodies.filter(({ active }) => active)).toHaveLength(5);
    expect(bodies.filter(({ active }) => active).every(({ visible, frame }) => visible && frame === undefined)).toBe(true);
  });

  it('reuses bounded body+art slots without stale frame, tint, alpha, rotation, or scale', () => {
    const { scene, bodies, art } = createScene(new Set([CHARACTER_SKINS.crawler.texture, CHARACTER_SKINS.brute.texture]));
    const view = new EnemyView(scene as never);
    view.sync(Array.from({ length: 150 }, (_, i) => snapshot(i + 1, 'crawler', { elite: true, health: 50, velocityX: 10, alpha: 0.4 })));
    expect(bodies.filter(({ active }) => active)).toHaveLength(150);
    expect(art.filter(({ active }) => active)).toHaveLength(150);
    view.sync([snapshot(999, 'brute')]);
    expect(view.count).toBe(1);
    expect(art.filter(({ active }) => active)).toHaveLength(1);
    expect(art.find(({ active }) => active)).toMatchObject({ frame: CHARACTER_SKINS.brute.frames.idleA, tint: undefined, alpha: 1, rotation: 0 });
  });
});
