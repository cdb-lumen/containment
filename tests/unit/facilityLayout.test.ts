import { describe, expect, it } from 'vitest';

import { WORLD_HEIGHT, WORLD_WIDTH } from '../../src/game/constants';
import {
  FACILITY_LAYOUT,
  type FacilityLayout,
  type FacilityPoint,
  type FacilityRect,
} from '../../src/game/world/facilityLayout';

const isFinitePoint = (point: FacilityPoint): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y);

const isPointInBounds = (point: FacilityPoint): boolean =>
  isFinitePoint(point) &&
  point.x >= 0 &&
  point.x <= WORLD_WIDTH &&
  point.y >= 0 &&
  point.y <= WORLD_HEIGHT;

const isValidRect = (rect: FacilityRect): boolean =>
  Number.isFinite(rect.x) &&
  Number.isFinite(rect.y) &&
  Number.isFinite(rect.width) &&
  Number.isFinite(rect.height) &&
  rect.width > 0 &&
  rect.height > 0 &&
  rect.x >= 0 &&
  rect.y >= 0 &&
  rect.x + rect.width <= WORLD_WIDTH &&
  rect.y + rect.height <= WORLD_HEIGHT;

const containsPoint = (rect: FacilityRect, point: FacilityPoint): boolean =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

const overlapsRect = (left: FacilityRect, right: FacilityRect): boolean =>
  left.x < right.x + right.width &&
  left.x + left.width > right.x &&
  left.y < right.y + right.height &&
  left.y + left.height > right.y;

const allIds = (layout: FacilityLayout): string[] => [
  ...layout.rooms.map(({ id }) => id),
  ...layout.walls.map(({ id }) => id),
  ...layout.doors.map(({ id }) => id),
  ...layout.props.map(({ id }) => id),
  ...layout.breaches.map(({ id }) => id),
];

const expectDeepFrozen = (value: unknown): void => {
  if (typeof value !== 'object' || value === null) return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeepFrozen(child);
};

describe('FACILITY_LAYOUT', () => {
  it('uses the complete world bounds and exposes coherent mission zones', () => {
    expect(FACILITY_LAYOUT.bounds).toEqual({
      x: 0,
      y: 0,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
    });
    expect(isPointInBounds(FACILITY_LAYOUT.playerSpawn)).toBe(true);
    expect(isValidRect(FACILITY_LAYOUT.queenArena)).toBe(true);
    expect(isValidRect(FACILITY_LAYOUT.armoryZone)).toBe(true);
    expect(isValidRect(FACILITY_LAYOUT.turretZone)).toBe(true);
    expect(containsPoint(FACILITY_LAYOUT.bounds, FACILITY_LAYOUT.playerSpawn)).toBe(
      true,
    );
    expect(overlapsRect(FACILITY_LAYOUT.armoryZone, FACILITY_LAYOUT.queenArena)).toBe(
      false,
    );
    expect(overlapsRect(FACILITY_LAYOUT.turretZone, FACILITY_LAYOUT.queenArena)).toBe(
      false,
    );
  });

  it('defines at least seven distinct labeled industrial areas', () => {
    expect(FACILITY_LAYOUT.rooms.length).toBeGreaterThanOrEqual(7);
    expect(new Set(FACILITY_LAYOUT.rooms.map(({ label }) => label)).size).toBe(
      FACILITY_LAYOUT.rooms.length,
    );
    expect(FACILITY_LAYOUT.rooms.every(isValidRect)).toBe(true);

    const labels = FACILITY_LAYOUT.rooms.map(({ label }) => label.toLowerCase());
    for (const expected of [
      'loading',
      'processing',
      'medical',
      'storage',
      'generator',
      'armory',
      'queen containment',
    ]) {
      expect(labels.some((label) => label.includes(expected))).toBe(true);
    }
  });

  it('keeps every rectangle and point finite, positive, and inside the world', () => {
    const rectangles: FacilityRect[] = [
      FACILITY_LAYOUT.bounds,
      FACILITY_LAYOUT.queenArena,
      FACILITY_LAYOUT.armoryZone,
      FACILITY_LAYOUT.turretZone,
      ...FACILITY_LAYOUT.rooms,
      ...FACILITY_LAYOUT.walls,
      ...FACILITY_LAYOUT.doors,
      ...FACILITY_LAYOUT.props,
    ];

    expect(rectangles.every(isValidRect)).toBe(true);
    expect(FACILITY_LAYOUT.breaches.every(isPointInBounds)).toBe(true);
  });

  it('uses globally unique stable IDs for all addressable geometry', () => {
    const ids = allIds(FACILITY_LAYOUT);
    expect(ids.every((id) => id.trim().length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('supports staged traversal with valid door state and wave thresholds', () => {
    expect(FACILITY_LAYOUT.doors.length).toBeGreaterThanOrEqual(5);
    expect(
      FACILITY_LAYOUT.doors.every(
        (door) =>
          Number.isSafeInteger(door.unlockWave) &&
          door.unlockWave >= 0 &&
          (door.initialState === 'open' || door.initialState === 'closed'),
      ),
    ).toBe(true);
    expect(FACILITY_LAYOUT.doors.some(({ initialState }) => initialState === 'open')).toBe(
      true,
    );
    expect(
      FACILITY_LAYOUT.doors.some(
        ({ initialState, unlockWave }) => initialState === 'closed' && unlockWave > 0,
      ),
    ).toBe(true);
  });

  it('provides six or more reachable breach approaches without wall overlap', () => {
    expect(FACILITY_LAYOUT.breaches.length).toBeGreaterThanOrEqual(6);
    expect(
      FACILITY_LAYOUT.breaches.every((breach) =>
        FACILITY_LAYOUT.walls.every((wall) => !containsPoint(wall, breach)),
      ),
    ).toBe(true);
    expect(
      FACILITY_LAYOUT.breaches.every(
        ({ unlockWave }) => Number.isSafeInteger(unlockWave) && unlockWave >= 0,
      ),
    ).toBe(true);
  });

  it('places the spawn in walkable space', () => {
    expect(
      FACILITY_LAYOUT.walls.some((wall) =>
        containsPoint(wall, FACILITY_LAYOUT.playerSpawn),
      ),
    ).toBe(false);
    expect(
      FACILITY_LAYOUT.doors
        .filter(({ initialState }) => initialState === 'closed')
        .some((door) => containsPoint(door, FACILITY_LAYOUT.playerSpawn)),
    ).toBe(false);
  });

  it('gives the queen arena exceptional size and a clear safe center', () => {
    const ordinaryAreas = FACILITY_LAYOUT.rooms
      .filter(({ id }) => id !== FACILITY_LAYOUT.queenArena.roomId)
      .map(({ width, height }) => width * height);
    const queenArea = FACILITY_LAYOUT.queenArena.width * FACILITY_LAYOUT.queenArena.height;
    const center = FACILITY_LAYOUT.queenArena.safeCenter;
    const clearance = FACILITY_LAYOUT.queenArena.safeRadius;

    expect(queenArea).toBeGreaterThan(Math.max(...ordinaryAreas));
    expect(clearance).toBeGreaterThanOrEqual(160);
    expect(containsPoint(FACILITY_LAYOUT.queenArena, center)).toBe(true);
    expect(center.x - clearance).toBeGreaterThan(FACILITY_LAYOUT.queenArena.x);
    expect(center.x + clearance).toBeLessThan(
      FACILITY_LAYOUT.queenArena.x + FACILITY_LAYOUT.queenArena.width,
    );
    expect(center.y - clearance).toBeGreaterThan(FACILITY_LAYOUT.queenArena.y);
    expect(center.y + clearance).toBeLessThan(
      FACILITY_LAYOUT.queenArena.y + FACILITY_LAYOUT.queenArena.height,
    );

    const safeRect: FacilityRect = {
      x: center.x - clearance,
      y: center.y - clearance,
      width: clearance * 2,
      height: clearance * 2,
    };
    expect(FACILITY_LAYOUT.walls.some((wall) => overlapsRect(wall, safeRect))).toBe(
      false,
    );
    expect(FACILITY_LAYOUT.props.some((prop) => overlapsRect(prop, safeRect))).toBe(
      false,
    );
  });

  it('is deeply immutable at runtime', () => {
    expectDeepFrozen(FACILITY_LAYOUT);

    const mutable = FACILITY_LAYOUT as unknown as {
      rooms: Array<{ label: string }>;
      playerSpawn: { x: number };
    };
    expect(() => mutable.rooms.push({ label: 'Mutation Bay' })).toThrow(TypeError);
    expect(() => {
      mutable.rooms[0].label = 'Mutation Bay';
    }).toThrow(TypeError);
    expect(() => {
      mutable.playerSpawn.x = -1;
    }).toThrow(TypeError);
  });
});
