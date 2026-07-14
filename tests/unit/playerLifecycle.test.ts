import { describe, expect, it } from 'vitest';

import { CHARACTER_SKINS } from '../../src/game/art/characterSkins';
import { ACTOR_PRESENTATION_SIZE } from '../../src/game/art/visualSystem';
import { EMPTY_INPUT_STATE } from '../../src/game/input/InputState';
import { Player } from '../../src/game/player/Player';

const createImage = (x = 0, y = 0) => {
  const image = {
    x,
    y,
    depth: y,
    active: true,
    visible: true,
    rotation: 0,
    frame: undefined as number | undefined,
    displaySize: [0, 0] as [number, number],
    displayWidth: 0,
    displayHeight: 0,
    circle: [] as number[],
    body: {
      velocity: { x: 0, y: 0 },
      reset(nextX: number, nextY: number) {
        image.x = nextX;
        image.y = nextY;
        image.body.velocity.x = 0;
        image.body.velocity.y = 0;
      },
    },
    setDisplaySize(width: number, height: number) {
      image.displaySize = [width, height];
      image.displayWidth = width;
      image.displayHeight = height;
      return image;
    },
    setCircle(...args: number[]) { image.circle = args; return image; },
    setCollideWorldBounds() { return image; },
    setDepth(depth: number) { image.depth = depth; return image; },
    setRotation(rotation: number) { image.rotation = rotation; return image; },
    setVelocity(vx: number, vy: number) { image.body.velocity = { x: vx, y: vy }; return image; },
    setVisible(visible: boolean) { image.visible = visible; return image; },
    setPosition(nextX: number, nextY: number) { image.x = nextX; image.y = nextY; return image; },
    setActive(active: boolean) { image.active = active; return image; },
    setFrame(frame: number) { image.frame = frame; return image; },
    setTint() { return image; },
    clearTint() { return image; },
    destroy() { image.active = false; },
  };
  return image;
};

const createPlayer = (framed: boolean) => {
  const sprite = createImage();
  const art = createImage();
  const scene = {
    textures: { exists: () => framed },
    physics: { add: { image: () => sprite } },
    add: { image: () => art },
  };
  return { player: new Player(scene as never, { x: 0, y: 0 }), sprite, art };
};

describe('Player presentation lifecycle', () => {
  it('keeps real player presentation hidden across updates and stop until reset', () => {
    const { player, sprite, art } = createPlayer(true);
    player.hidePresentation();
    player.updatePresentation(100, { dead: true, quality: 'high', reducedMotion: false, reducedFlash: false });
    player.stop();
    player.updatePresentation(200, { dead: true, quality: 'high', reducedMotion: false, reducedFlash: false });
    expect(sprite.visible).toBe(false);
    expect(art).toMatchObject({ visible: false, active: false });

    player.reset({ x: 4, y: 5 });
    expect(sprite.visible).toBe(false);
    expect(art).toMatchObject({ visible: true, active: true, x: 4, y: 5 });
  });
  it('renders loaded follower art larger than the unchanged authoritative body and collision circle', () => {
    const { player, sprite, art } = createPlayer(true);

    expect(sprite.displaySize).toEqual([54, 54]);
    expect(sprite.circle).toEqual([24, 8, 8]);
    expect(art.displaySize).toEqual([
      ACTOR_PRESENTATION_SIZE.marine.width,
      ACTOR_PRESENTATION_SIZE.marine.height,
    ]);
    expect(art.displaySize[0]).toBeGreaterThan(sprite.displaySize[0]);

    player.updatePresentation(100, {
      dead: false, quality: 'high', reducedMotion: false, reducedFlash: false,
    });
    expect(player.visualSnapshot()).toMatchObject({ scaleX: 1, scaleY: 1 });
  });

  it('uses authored follower art only when the external marine sheet is available', () => {
    const authored = createPlayer(true);
    const fallback = createPlayer(false);

    expect(authored.player.skinKey).toBe(CHARACTER_SKINS.marine.texture);
    expect(authored.sprite.visible).toBe(false);
    expect(authored.art.frame).toBeUndefined();
    expect(fallback.player.skinKey).toBe(CHARACTER_SKINS.marine.fallbackTexture);
    expect(fallback.sprite.visible).toBe(true);
  });

  it('stop immediately idles the follower without losing authoritative aim', () => {
    const { player, sprite, art } = createPlayer(true);
    player.applyInput({ ...EMPTY_INPUT_STATE, movementX: 1, movementY: 0, aimWorldX: 0, aimWorldY: 100 });
    player.triggerRecoil(100);
    player.updatePresentation(100, { dead: false, quality: 'high', reducedMotion: false, reducedFlash: false });
    expect(art.frame).toBe(CHARACTER_SKINS.marine.frames.attack);

    player.stop();

    expect(sprite.body.velocity).toEqual({ x: 0, y: 0 });
    expect(sprite.rotation).toBeCloseTo(Math.PI / 2);
    expect(art.rotation).toBeCloseTo(Math.PI / 2);
    expect(art.frame).toBe(CHARACTER_SKINS.marine.frames.idleA);
    expect(art.x).toBe(sprite.x);
    expect(art.y).toBe(sprite.y);
    expect(art.displaySize).toEqual([
      ACTOR_PRESENTATION_SIZE.marine.width,
      ACTOR_PRESENTATION_SIZE.marine.height,
    ]);
    expect(player.presentationSnapshot(100)).toEqual({ frame: 'idleA', animating: false, recoil: false, hit: false });
  });

  it('reset restores the actual follower frame, transforms, and transient impulses', () => {
    const { player, art } = createPlayer(true);
    player.applyInput({ ...EMPTY_INPUT_STATE, movementX: 1, movementY: 0, aimWorldX: 100, aimWorldY: 100 });
    player.triggerHit(100);
    player.updatePresentation(100, { dead: false, quality: 'high', reducedMotion: false, reducedFlash: false });

    player.reset({ x: 12, y: 34 });

    expect(art).toMatchObject({ x: 12, y: 34, rotation: 0, frame: CHARACTER_SKINS.marine.frames.idleA, displaySize: [
      ACTOR_PRESENTATION_SIZE.marine.width,
      ACTOR_PRESENTATION_SIZE.marine.height,
    ] });
    expect(player.presentationSnapshot(100)).toEqual({ frame: 'idleA', animating: false, recoil: false, hit: false });
  });
});
