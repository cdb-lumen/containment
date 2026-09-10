import {expect,it} from 'vitest';
// @ts-expect-error The Node recorder is JavaScript; Vitest imports its real catalog.
import {CASES} from '../scripts/vfx-audit-demo.mjs';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';

it('stages queen evidence in a supported legacy boss room, not the boss-less story route',()=>{
 const version=CASES['acid-pool'].runVersion;
 const node=generateRun(1729,version).nodes.find(n=>n.kind==='boss');
 expect(node).toBeDefined();
 expect(version).toBe(2);
 const geometry=createExpeditionGeometry(node!);
 expect(canOccupyExpedition(geometry,geometry.bossSpawn,76)).toBe(true);
 expect(generateRun(1729,3).nodes.some(n=>n.kind==='boss')).toBe(false);
});
