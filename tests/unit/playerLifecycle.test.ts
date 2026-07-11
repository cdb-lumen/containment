import { describe, expect, it } from 'vitest';

import { CHARACTER_SKINS } from '../../src/game/art/characterSkins';
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
    body: {
      velocity: { x: 0, y: 0 },
      reset(nextX: number, nextY: number) {
        image.x = nextX;
        image.y = nextY;
        image.body.velocity.x = 0;
        image.body.velocity.y = 0;
      },
    },
    setDisplaySize(width: number, height: number) { image.displaySize = [width, height]; return image; },
    setCircle() { return image; },
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
    expect(art.displaySize).toEqual([54, 54]);
    expect(player.presentationSnapshot(100)).toEqual({ frame: 'idleA', animating: false, recoil: false, hit: false });
  });

  it('reset restores the actual follower frame, transforms, and transient impulses', () => {
    const { player, art } = createPlayer(true);
    player.applyInput({ ...EMPTY_INPUT_STATE, movementX: 1, movementY: 0, aimWorldX: 100, aimWorldY: 100 });
    player.triggerHit(100);
    player.updatePresentation(100, { dead: false, quality: 'high', reducedMotion: false, reducedFlash: false });

    player.reset({ x: 12, y: 34 });

    expect(art).toMatchObject({ x: 12, y: 34, rotation: 0, frame: CHARACTER_SKINS.marine.frames.idleA, displaySize: [54, 54] });
    expect(player.presentationSnapshot(100)).toEqual({ frame: 'idleA', animating: false, recoil: false, hit: false });
  });
});
