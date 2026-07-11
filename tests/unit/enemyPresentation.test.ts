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
import { routeEnemyAttackPresentation } from '../../src/game/waves/HordeRuntime';

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

  it('reuses one mutable animation output across repeated updates', () => {
    const state = new EnemyPresentationState();
    const enemy = snapshot(7, 'crawler');
    const first = state.update(enemy, 100, 'high', false, false);
    const second = state.update(enemy, 200, 'high', false, false);
    expect(second).toBe(first);
    expect(Object.isFrozen(second)).toBe(false);
  });
});

const createImage = (physics: boolean) => {
  const image = {
    x: 0, y: 0, width: 96, scaleX: 1, scaleY: 1, displayWidth: 0, displayHeight: 0,
    rotation: 0, alpha: 1, depth: 0, active: true, visible: true, texture: '',
    frame: undefined as number | undefined, tint: undefined as number | undefined,
    flipX: false, flipY: false,
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
    setFlipX(v: boolean) { image.flipX = v; return image; }, setFlipY(v: boolean) { image.flipY = v; return image; },
    setTint(v: number) { image.tint = v; return image; }, clearTint() { image.tint = undefined; return image; },
    setCircle() { return image; },
  };
  return image;
};

const createScene = (loaded: Set<string>, registryValues: Record<string, unknown> = {}) => {
  const bodies: ReturnType<typeof createImage>[] = [];
  const art: ReturnType<typeof createImage>[] = [];
  const graphics = { setDepth() { return this; }, clear() { return this; }, fillStyle() { return this; }, fillRect() { return this; }, lineStyle() { return this; }, beginPath() { return this; }, moveTo() { return this; }, lineTo() { return this; }, closePath() { return this; }, strokePath() { return this; }, setVisible() { return this; } };
  const textureExists = vi.fn((key: string) => loaded.has(key));
  const requestedArtTextures: string[] = [];
  const scene = {
    time: { now: 250 }, textures: { exists: textureExists },
    registry: { get: (key: string) => registryValues[key] }, events: { once() {}, off() {} },
    physics: { add: { group: () => ({ add() {} }), image: () => { const value = createImage(true); bodies.push(value); return value; } } },
    add: { graphics: () => graphics, image: (_x: number, _y: number, texture: string) => {
      requestedArtTextures.push(texture);
      const value = createImage(false); value.texture = texture; art.push(value); return value;
    } },
  };
  return { scene, bodies, art, textureExists, requestedArtTextures };
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

  it('initializes a partial-load follower pool from an available authored sheet and caches resolutions', () => {
    const loaded = new Set<string>([CHARACTER_SKINS.spitter.texture]);
    const { scene, requestedArtTextures, textureExists } = createScene(loaded);
    const view = new EnemyView(scene as never);
    expect(requestedArtTextures.length).toBeGreaterThan(0);
    expect(requestedArtTextures.every((key) => loaded.has(key))).toBe(true);
    expect(new Set(requestedArtTextures)).toEqual(loaded);
    const resolutionChecks = textureExists.mock.calls.length;
    const enemy = snapshot(5, 'spitter');
    view.sync([enemy]);
    view.sync([enemy]);
    view.sync([enemy]);
    expect(textureExists).toHaveBeenCalledTimes(resolutionChecks);
  });

  it('fully resets a released body+follower slot before elite-to-normal reuse', () => {
    const { scene, bodies, art } = createScene(new Set([CHARACTER_SKINS.crawler.texture, CHARACTER_SKINS.brute.texture]));
    const view = new EnemyView(scene as never);
    view.sync([snapshot(1, 'crawler', { elite: true, health: 50, velocityX: 10, alpha: 0.4 })]);
    const body = bodies.find(({ active }) => active)!;
    const follower = art.find(({ active }) => active)!;
    body.frame = 4; body.flipX = true; body.flipY = true;
    follower.flipX = true; follower.flipY = true;
    view.triggerAttack(1);
    view.sync([]);
    expect(body).toMatchObject({ active: false, visible: false, x: 0, y: 0, scaleX: 1, scaleY: 1,
      flipX: false, flipY: false, frame: 0, tint: undefined, alpha: 1, rotation: 0 });
    expect(follower).toMatchObject({ active: false, visible: false, x: 0, y: 0, scaleX: 1, scaleY: 1,
      flipX: false, flipY: false, frame: 0, tint: undefined, alpha: 1, rotation: 0 });
    expect(view.enemyIdFor(body)).toBeNull();
    view.sync([snapshot(999, 'brute')]);
    expect(view.count).toBe(1);
    expect(view.enemyIdFor(body)).toBe(999);
    expect(body).toMatchObject({ displayWidth: 68, displayHeight: 68 });
    expect(follower).toMatchObject({ frame: CHARACTER_SKINS.brute.frames.idleA, tint: undefined, alpha: 1, rotation: 0,
      flipX: false, flipY: false });
    expect(follower.displayWidth).toBeLessThan(68 * 1.14);
  });

  it('propagates active quality and accessibility registry values through actual follower sync', () => {
    const loaded = new Set([CHARACTER_SKINS.spitter.texture]);
    const high = createScene(loaded, { reducedMotion: false, settings: { reducedFlash: false } });
    high.scene.time.now = 137;
    const highView = new EnemyView(high.scene as never);
    highView.sync([snapshot(5, 'spitter', { velocityX: 10 })]);
    highView.sync([snapshot(5, 'spitter', { velocityX: 10, health: 90 })]);
    const highFollower = high.art.find(({ active }) => active)!;
    expect(highFollower).toMatchObject({ frame: CHARACTER_SKINS.spitter.frames.hit, tint: 0xffffff });
    expect(highFollower.scaleX).not.toBeCloseTo(52 / 96);

    const accessible = createScene(loaded, { reducedMotion: true, settings: { reducedFlash: true } });
    accessible.scene.time.now = 137;
    const accessibleView = new EnemyView(accessible.scene as never);
    accessibleView.sync([snapshot(5, 'spitter', { velocityX: 10 })]);
    accessibleView.sync([snapshot(5, 'spitter', { velocityX: 10, health: 90 })]);
    expect(accessible.art.find(({ active }) => active)).toMatchObject({ frame: CHARACTER_SKINS.spitter.frames.hit, tint: undefined,
      x: 100, y: 200, rotation: 0, displayWidth: 52, displayHeight: 52 });

    const low = createScene(loaded);
    low.scene.time.now = 137;
    const lowView = new EnemyView(low.scene as never);
    lowView.setQuality('low');
    lowView.sync([snapshot(5, 'spitter', { velocityX: 10 })]);
    expect(low.art.find(({ active }) => active)).toMatchObject({ frame: CHARACTER_SKINS.spitter.frames.moveA,
      displayWidth: 52, displayHeight: 52 });
  });
});

describe('HordeRuntime attack-event presentation routing', () => {
  it('signals only active IDs for explicit contact/hazard attacks and ignores all other events', () => {
    const active = new Set([7, 8]);
    const signaled: number[] = [];
    const signal = (id: number) => active.has(id) ? (signaled.push(id), true) : false;
    expect(routeEnemyAttackPresentation({ type: 'contact-attack', enemyId: 7, enemyType: 'crawler', damage: 1 }, signal)).toBe(true);
    expect(routeEnemyAttackPresentation({ type: 'hazard-attack', enemyId: 8, enemyType: 'spitter', sourceX: 0, sourceY: 0,
      targetX: 1, targetY: 1, damage: 1 }, signal)).toBe(true);
    expect(routeEnemyAttackPresentation({ type: 'contact-attack', enemyId: 99, enemyType: 'crawler', damage: 1 }, signal)).toBe(false);
    expect(routeEnemyAttackPresentation({ type: 'contact-attack', enemyId: Number.NaN,
      enemyType: 'crawler', damage: 1 }, signal)).toBe(false);
    expect(routeEnemyAttackPresentation({ type: 'death', enemyId: 7, enemyType: 'crawler', elite: false,
      x: 0, y: 0, reward: 1, dropChance: 0 }, signal)).toBe(false);
    active.delete(7);
    expect(routeEnemyAttackPresentation({ type: 'contact-attack', enemyId: 7, enemyType: 'crawler', damage: 1 }, signal)).toBe(false);
    expect(signaled).toEqual([7, 8]);
  });
});
