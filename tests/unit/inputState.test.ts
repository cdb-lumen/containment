import { describe, expect, it } from 'vitest';

import {
  TouchInputState,
  shouldEnableTouchControls,
} from '../../src/game/input/TouchInput';

const VIEWPORT = Object.freeze({ width: 1_280, height: 720 });
const ORIGIN = Object.freeze({ x: 640, y: 360 });

describe('TouchInputState', () => {
  it('applies a dead zone and returns normalized, clamped movement', () => {
    const input = new TouchInputState(VIEWPORT, { radius: 80, deadZone: 0.2 });

    expect(input.pointerDown(1, 160, 560)).toBe(true);
    input.pointerMove(1, 168, 560);
    expect(input.read(ORIGIN)).toMatchObject({ movementX: 0, movementY: 0 });

    input.pointerMove(1, 200, 600);
    const diagonal = input.read(ORIGIN);
    const expectedMagnitude = (Math.SQRT1_2 - 0.2) / 0.8;
    expect(diagonal.movementX).toBeCloseTo(
      expectedMagnitude * Math.SQRT1_2,
      5,
    );
    expect(diagonal.movementY).toBeCloseTo(
      expectedMagnitude * Math.SQRT1_2,
      5,
    );
    expect(Math.hypot(diagonal.movementX, diagonal.movementY)).toBeCloseTo(
      expectedMagnitude,
      5,
    );

    input.pointerMove(1, 400, 800);
    const clamped = input.read(ORIGIN);
    expect(Math.hypot(clamped.movementX, clamped.movementY)).toBeCloseTo(1, 5);
    const visual = input.visualState.left;
    expect(
      Math.hypot(
        visual.currentX - visual.originX,
        visual.currentY - visual.originY,
      ),
    ).toBeCloseTo(80, 5);
  });

  it('uses right-stick direction for aim and auto-fire above the dead zone', () => {
    const input = new TouchInputState(VIEWPORT, { radius: 80, deadZone: 0.2 });

    input.pointerDown(7, 1_000, 520);
    input.pointerMove(7, 1_010, 520);
    expect(input.read(ORIGIN)).toMatchObject({
      aimWorldX: ORIGIN.x,
      aimWorldY: ORIGIN.y,
      fireHeld: false,
    });

    input.pointerMove(7, 1_080, 520);
    expect(input.read(ORIGIN)).toMatchObject({
      aimWorldX: ORIGIN.x + 1_000,
      aimWorldY: ORIGIN.y,
      fireHeld: true,
    });
  });

  it('owns left and right pointers independently and ignores competing claims', () => {
    const input = new TouchInputState(VIEWPORT);

    expect(input.pointerDown(11, 100, 500)).toBe(true);
    expect(input.pointerDown(12, 200, 500)).toBe(false);
    expect(input.pointerDown(21, 1_100, 500)).toBe(true);
    input.pointerMove(11, 20, 500);
    input.pointerMove(21, 1_180, 500);

    const simultaneous = input.read(ORIGIN);
    expect(simultaneous.movementX).toBeLessThan(0);
    expect(simultaneous.fireHeld).toBe(true);

    input.pointerUp(11);
    expect(input.read(ORIGIN)).toMatchObject({ movementX: 0, fireHeld: true });
    input.pointerCancel(21);
    expect(input.read(ORIGIN)).toMatchObject({ movementX: 0, fireHeld: false });
  });

  it('emits action edges once and suspension clears held pointers and edges', () => {
    const input = new TouchInputState(VIEWPORT);
    input.pointerDown(1, 100, 500);
    input.pointerMove(1, 20, 500);
    input.press('grenade');
    input.press('pause');

    expect(input.read(ORIGIN)).toMatchObject({
      movementX: -1,
      grenadePressed: true,
      pausePressed: true,
    });
    expect(input.read(ORIGIN)).toMatchObject({
      movementX: -1,
      grenadePressed: false,
      pausePressed: false,
    });

    input.press('medkit');
    input.suspend();
    expect(input.read(ORIGIN)).toMatchObject({
      movementX: 0,
      movementY: 0,
      fireHeld: false,
      medkitPressed: false,
    });
  });

  it('prevents movement, aiming, firing, and action edges while blocked', () => {
    const input = new TouchInputState(VIEWPORT);
    input.pointerDown(1, 100, 500);
    input.pointerMove(1, 20, 500);
    input.pointerDown(2, 1_100, 500);
    input.pointerMove(2, 1_180, 500);
    input.press('grenade');

    input.setBlocked(true);
    expect(input.read(ORIGIN)).toEqual({
      movementX: 0,
      movementY: 0,
      aimWorldX: ORIGIN.x,
      aimWorldY: ORIGIN.y,
      fireHeld: false,
      reloadPressed: false,
      grenadePressed: false,
      interactPressed: false,
      medkitPressed: false,
      pausePressed: false,
      weaponPressed: null,
    });

    input.setBlocked(false);
    expect(input.read(ORIGIN)).toMatchObject({ movementX: 0, fireHeld: false });
  });
});

describe('shouldEnableTouchControls', () => {
  it('supports coarse pointers, observed touch, and explicit overrides', () => {
    expect(
      shouldEnableTouchControls({ coarsePointer: false, maxTouchPoints: 0 }),
    ).toBe(false);
    expect(
      shouldEnableTouchControls({ coarsePointer: true, maxTouchPoints: 0 }),
    ).toBe(true);
    expect(
      shouldEnableTouchControls({ coarsePointer: false, maxTouchPoints: 5 }),
    ).toBe(false);
    expect(
      shouldEnableTouchControls({
        coarsePointer: false,
        maxTouchPoints: 0,
        observedTouch: true,
      }),
    ).toBe(true);
    expect(
      shouldEnableTouchControls({
        coarsePointer: true,
        maxTouchPoints: 5,
        override: false,
      }),
    ).toBe(false);
    expect(
      shouldEnableTouchControls({
        coarsePointer: false,
        maxTouchPoints: 0,
        override: true,
      }),
    ).toBe(true);
  });
});
