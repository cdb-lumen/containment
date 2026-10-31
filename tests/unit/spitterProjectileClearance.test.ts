import {describe, expect, it} from 'vitest';
import {DepthGame} from '../../src/DepthGame';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';

// A grazing shot clears the center line but intersects the cabinet with its radius.
function scene(blocked: boolean, specials = true, elite = false) {
  const game = new DepthGame();
  if (!specials) game.node = {...game.node, id: 'legacy-test'};
  game.geometry = {...game.geometry, bounds: {x: 0, y: 0, width: 1200, height: 880},
    blockers: [{x: 620, y: blocked ? 445 : 460, width: 80, height: 80}],
    boundary: undefined, voids: undefined};
  game.navigation = new FacilityNavigation(game.geometry);
  game.enemies = game['makeEnemies']();
  Object.assign(game.player, {x: 800, y: 440});
  game.status = 'playing';
  const result = game.enemies.spawn('spitter', 500, 440, elite);
  if (!result.spawned) throw new Error('spawn failed');
  return {game, enemy: result.enemy};
}

describe('spitter projectile clearance', () => {
  it.each([[true, false], [true, true], [false, false], [false, true]])(
    'rejects a grazing hazard with specials=%s elite=%s', (specials, elite) => {
    const {game, enemy} = scene(true, specials, elite);
    expect(canOccupyExpedition(game.geometry, enemy, enemy.radius)).toBe(true);
    expect(canOccupyExpedition(game.geometry, game.player, 16)).toBe(true);
    expect(hasClearExpeditionShot(game.geometry, enemy, game.player)).toBe(true);
    expect(canTraverseExpedition(game.geometry, enemy, game.player, 9)).toBe(false);
    const events = game.enemies.update(0, game.player);
    expect(events.some(e => e.type === 'hazard-attack' || e.type === 'attack-warning')).toBe(false);
  });

  it('seeks a new shot rather than holding a center-line-only firing position', () => {
    const {game, enemy} = scene(true);
    game.navigation.prepare(game.player, 1);
    game.enemies.update(50, game.player);
    const next = game.enemies.getSnapshot(enemy.id)!;
    expect(Math.hypot(next.x - enemy.x, next.y - enemy.y)).toBeGreaterThan(0);
    expect(canOccupyExpedition(game.geometry, next, next.radius)).toBe(true);
    const before = game.combat.snapshot.health + game.combat.snapshot.armor;
    for (let i = 0; i < 900 && game.combat.snapshot.health + game.combat.snapshot.armor === before; i++) {
      game.navigation.prepare(game.player, 1);
      game['enemyEvents'](game.enemies.update(50, game.player));
      game['updateBullets'](0.05);
      const current = game.enemies.getSnapshot(enemy.id)!;
      expect(canOccupyExpedition(game.geometry, current, current.radius)).toBe(true);
    }
    expect(game.combat.snapshot.health + game.combat.snapshot.armor).toBeLessThan(before);
  });

  it('retains clear shots and their actual radius and damage', () => {
    const {game, enemy} = scene(false);
    expect(canTraverseExpedition(game.geometry, enemy, game.player, 9)).toBe(true);
    const events = [...game.enemies.update(0, game.player)];
    expect(events.some(e => e.type === 'attack-warning')).toBe(true);
    for (let i = 0; i < 10; i++) events.push(...game.enemies.update(50, game.player));
    expect(events.some(e => e.type === 'hazard-attack')).toBe(true);
    game['enemyEvents'](events);
    expect(game.bullets).toHaveLength(1);
    expect(game.bullets[0].request.radius).toBe(9);
    const before = game.combat.snapshot.health + game.combat.snapshot.armor;
    for (let i = 0; i < 30; i++) game['updateBullets'](0.05);
    expect(game.combat.snapshot.health + game.combat.snapshot.armor).toBeLessThan(before);
  });
});
