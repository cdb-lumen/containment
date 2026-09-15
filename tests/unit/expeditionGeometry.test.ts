import { describe, expect, it } from 'vitest';
import { createExpeditionGeometry, canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot } from '../../src/game/world/expeditionGeometry';
import {DepthGame} from '../../src/DepthGame';
import type {RunNode} from '../../src/game/roguelike/types';
import { generateRun } from '../../src/game/roguelike/run';
import { ROOM_TEMPLATES } from '../../src/game/roguelike/roomTemplates';
import {
  MAX_QUEEN_NESTS, NEST_DISTANCE, QueenBossSystem, QUEEN_ARMORED_DURATION_MS,
  QUEEN_NEST_SPAWN_DURATION_MS, QUEEN_VULNERABLE_DURATION_MS,
} from '../../src/game/enemies/QueenBossSystem';
import type { Point } from '../../src/game/roguelike/types';

// Only the accepted water-adjacent south32 inward request requires the existing
// production placement search. Never treat its blocked request as an actual spawn.
function actualInwardSpawn(node:RunNode,point:Point):Point{
  const geometry=createExpeditionGeometry(node);
  if(node.templateId!=='communal-atrium'||canOccupyExpedition(geometry,point,28))return point;
  expect(point).toEqual({x:1044,y:500});
  const game=new DepthGame();game.node=node;game.geometry=geometry;Object.assign(game.player,geometry.playerSpawn);
  expect(game['spawn']('brute',point.x,point.y)).toBe(true);
  const enemy=game.enemies.snapshot.enemies[0];expect(enemy.radius).toBe(28);
  expect(canOccupyExpedition(geometry,enemy,enemy.radius)).toBe(true);return enemy;
}

describe('expedition local geometry', () => {
  it('uses authored rectangles verbatim and seals all four exact local boundaries', () => {
    for (const node of Array.from({length:24},(_,seed)=>generateRun(seed).nodes).flat()) {
      const geometry = createExpeditionGeometry(node);
      const template = ROOM_TEMPLATES[node.templateId];
      expect(geometry.bounds).toEqual({ x: 0, y: 0, width: template.width, height: template.height });
      expect(geometry.blockers.slice(4)).toEqual(template.obstacles);
      expect(geometry.boundaryWalls).toHaveLength(4);
      expect(Object.isFrozen(geometry)).toBe(true);
      expect(Object.isFrozen(geometry.blockers)).toBe(true);
      expect(Object.isFrozen(geometry.breaches)).toBe(true);
      for (const point of [template.spawn, template.exit, ...template.breaches]) expect(canOccupyExpedition(geometry, point, 28)).toBe(true);
      for (const point of [{ x: 27, y: 100 }, { x: 100, y: 27 }, { x: template.width - 27, y: 100 }, { x: 100, y: template.height - 27 }]) {
        expect(canOccupyExpedition(geometry, point, 28)).toBe(false);
      }
      for (const rect of template.obstacles) {
        expect(canOccupyExpedition(geometry, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }, 28)).toBe(false);
        expect(hasClearExpeditionShot(geometry, { x: rect.x - 40, y: rect.y + rect.height / 2 },
          { x: rect.x + rect.width + 40, y: rect.y + rect.height / 2 })).toBe(false);
      }
      for (const breach of geometry.breaches) {
        const point = { x: breach.x + (breach.facing === 'east' ? 56 : -56), y: breach.y };
        expect(canOccupyExpedition(geometry, actualInwardSpawn(node,point), 28)).toBe(true);
      }
      expect(hasClearExpeditionShot(geometry, { x: -10, y: -10 }, { x: -5, y: -5 })).toBe(false);
      expect(canOccupyExpedition(geometry, { x: NaN, y: 100 }, 28)).toBe(false);
      expect(canOccupyExpedition(geometry, template.spawn, -1)).toBe(false);
    }
  });

  it('connects all radius-28 anchors including actual runtime-offset breach spawns', () => {
    const seenTemplates = new Set<string>();
    for (const node of Array.from({length:24},(_,seed)=>generateRun(seed).nodes).flat()) {
      if (seenTemplates.has(node.templateId)) continue;
      seenTemplates.add(node.templateId);
      const geometry = createExpeditionGeometry(node);
      const key = (point: Point) => `${point.x},${point.y}`;
      const start = {x:Math.round(geometry.playerSpawn.x/10)*10,y:Math.round(geometry.playerSpawn.y/10)*10};
      expect(canTraverseExpedition(geometry,geometry.playerSpawn,start,28)).toBe(true);
      const queue: Point[] = [start];
      const visited = new Set([key(start)]);
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const point = queue[cursor];
        for (const [dx, dy] of [[10, 0], [-10, 0], [0, 10], [0, -10]]) {
          const next = { x: point.x + dx, y: point.y + dy };
          if (!visited.has(key(next)) && canOccupyExpedition(geometry, next, 30)) {
            visited.add(key(next));
            queue.push(next);
          }
        }
      }
      const connected=(point:Point)=>queue.some(p=>Math.hypot(p.x-point.x,p.y-point.y)<=15&&canTraverseExpedition(geometry,p,point,28));
      expect(node.templateId==='communal-atrium'?connected(geometry.exitPoint):visited.has(key(geometry.exitPoint))).toBe(true);
      for (const breach of geometry.breaches) {
        expect(node.templateId==='communal-atrium'?connected(breach):visited.has(key(breach))).toBe(true);
        const offset = { x: breach.x + (breach.facing === 'east' ? 56 : -56), y: breach.y };
        if(node.templateId==='communal-atrium')expect(connected(actualInwardSpawn(node,offset))).toBe(true);
        else expect(visited.has(key({x:Math.round(offset.x/10)*10,y:offset.y}))).toBe(true);
      }
    }
    expect(seenTemplates.size).toBe(20);
  });

  it('fits the real QueenBossSystem center and every stage-three nest with movement clearance', () => {
    const node = generateRun(2,2).nodes.find(node => node.kind === 'boss')!;
    const geometry = createExpeditionGeometry(node);
    const system = new QueenBossSystem();
    const center = geometry.bossSpawn;
    expect(canOccupyExpedition(geometry, center, 76 + 28)).toBe(true);
    expect(system.start(center.x, center.y)).toBe(true);
    const player = geometry.playerSpawn;
    system.update(QUEEN_ARMORED_DURATION_MS + QUEEN_NEST_SPAWN_DURATION_MS, player, 0);
    system.applyDamage({ type: 'queen' }, system.snapshot.maxHealth * 0.7);
    system.update(QUEEN_VULNERABLE_DURATION_MS + QUEEN_ARMORED_DURATION_MS, player, 0);
    expect(system.snapshot.stage).toBe(3);
    expect(system.snapshot.nests).toHaveLength(MAX_QUEEN_NESTS);
    for (const nest of system.snapshot.nests) {
      expect(Math.hypot(nest.x - center.x, nest.y - center.y)).toBeCloseTo(NEST_DISTANCE);
      expect(canOccupyExpedition(geometry, nest, 24 + 28)).toBe(true);
    }
  });
});
