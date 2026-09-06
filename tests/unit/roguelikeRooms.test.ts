import { describe, expect, it } from 'vitest';
import { ROOM_TEMPLATES } from '../../src/game/roguelike/roomTemplates';
import type { Point, RoomTemplate } from '../../src/game/roguelike/types';
import {clearPolygonTopology} from '../../src/game/world/polygonGeometry';

const RADIUS = 28;
const STEP = 10;

// Expanded AABBs conservatively admit a square enclosing the player's circle.
function clear(template: RoomTemplate, point: Point): boolean {
  return clearPolygonTopology(template,point,point,RADIUS) && point.x >= RADIUS && point.y >= RADIUS
    && point.x <= template.width - RADIUS && point.y <= template.height - RADIUS
    && template.obstacles.every(rect => point.x < rect.x - RADIUS || point.x > rect.x + rect.width + RADIUS
      || point.y < rect.y - RADIUS || point.y > rect.y + rect.height + RADIUS);
}

describe('roguelike room templates', () => {
  it('provides thirty-six distinct, deeply immutable industrial layouts with finite bounded footprints', () => {
    const templates = Object.values(ROOM_TEMPLATES);
    expect(templates).toHaveLength(36);
    expect(new Set(templates.map(template => template.name)).size).toBe(36);
    expect(new Set(templates.map(template => JSON.stringify(template.obstacles))).size).toBe(36);
    expect(Object.isFrozen(ROOM_TEMPLATES)).toBe(true);
    for (const template of templates) {
      expect(Object.isFrozen(template)).toBe(true);
      expect(Object.isFrozen(template.spawn)).toBe(true);
      expect(Object.isFrozen(template.exit)).toBe(true);
      expect(Object.isFrozen(template.obstacles)).toBe(true);
      expect(Object.isFrozen(template.breaches)).toBe(true);
      expect(template.width).toBeGreaterThan(2 * RADIUS);
      expect(template.height).toBeGreaterThan(2 * RADIUS);
      expect(Number.isFinite(template.width + template.height)).toBe(true);
      expect(template.obstacles.length + (template.voids?.length ?? 0)).toBeGreaterThanOrEqual(template.boundary ? 1 : 2);
      for(const polygon of [template.boundary,...template.voids??[]].filter(p=>p!==undefined)){
        expect(Object.isFrozen(polygon)).toBe(true);
        expect(polygon.length).toBeGreaterThanOrEqual(3);
        for(const point of polygon){expect(Object.isFrozen(point)).toBe(true);expect(Number.isFinite(point.x+point.y)).toBe(true);}
      }
      expect(template.breaches.length).toBeGreaterThanOrEqual(3);
      for (const rect of template.obstacles) {
        expect(Object.isFrozen(rect)).toBe(true);
        expect(Object.values(rect).every(Number.isFinite)).toBe(true);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.height).toBeGreaterThan(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(template.width);
        expect(rect.y + rect.height).toBeLessThanOrEqual(template.height);
      }
      for (const point of [template.spawn, template.exit, ...template.breaches]) {
        expect(Object.isFrozen(point)).toBe(true);
        expect(Number.isFinite(point.x + point.y)).toBe(true);
        expect(clear(template, point), `${template.id} anchor clearance`).toBe(true);
      }
    }
  });

  it.each(Object.values(ROOM_TEMPLATES))('$id connects every anchor and walkable region for a radius-28 player', template => {
    const columns = Math.floor(template.width / STEP) + 1;
    const key = (x: number, y: number): number => (y / STEP) * columns + x / STEP;
    const walkable = new Set<number>();
    for (let y = 0; y <= template.height; y += STEP) {
      for (let x = 0; x <= template.width; x += STEP) {
        if (clear(template, { x, y })) walkable.add(key(x, y));
      }
    }
    const queue = [template.spawn];
    const visited = new Set([key(template.spawn.x, template.spawn.y)]);
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const point = queue[cursor];
      for (const [dx, dy] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
        const next = { x: point.x + dx, y: point.y + dy };
        const id = key(next.x, next.y);
        if (walkable.has(id) && !visited.has(id)) {
          visited.add(id);
          queue.push(next);
        }
      }
    }
    for (const point of [template.exit, ...template.breaches]) expect(visited.has(key(point.x, point.y))).toBe(true);
    expect(visited.size).toBe(walkable.size);
  });

  it('reserves a larger boss arena and a clear radius-180 central fighting area', () => {
    const boss = ROOM_TEMPLATES['reactor-vault'];
    const others = Object.values(ROOM_TEMPLATES).filter(template => template !== boss);
    expect(boss.width * boss.height).toBeGreaterThan(Math.max(...others.map(template => template.width * template.height)));
    const center = { x: boss.width / 2, y: boss.height / 2 };
    for (const rect of boss.obstacles) {
      const dx = Math.max(rect.x - center.x, 0, center.x - rect.x - rect.width);
      const dy = Math.max(rect.y - center.y, 0, center.y - rect.y - rect.height);
      expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(180 + RADIUS);
    }
  });
});
