import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('selection, viewport and expected modes are explicit and reject mistakes', async () => {
  const {evidenceOptions, selectRooms, captureModes} = await import('./room-evidence-options.mjs');
  const rooms = Array.from({length:20}, (_,index)=>({index,roomId:`room-${index}`,templateId:`template-${index}`}));
  const options = evidenceOptions(['--rooms=template-1,template-7,template-19','--gameplay-all','--viewport=phone']);
  assert.deepEqual(options.viewport,{width:390,height:844});
  assert.deepEqual(selectRooms(rooms,options).selected.map(r=>r.index),[1,7,19]);
  assert.deepEqual(captureModes(rooms[1],20,options),['overview','gameplay']);
  assert.deepEqual(captureModes(rooms[1],20,evidenceOptions([])),['overview']);
  assert.deepEqual(evidenceOptions(['--viewport=1280x900']).viewport,{width:1280,height:900});
  for(const args of [['--rooms='],['--viewport=oops'],['--limit=0'],['--gameplay-al'],['--width=0']]) assert.throws(()=>evidenceOptions(args));
  assert.throws(()=>selectRooms(rooms,evidenceOptions(['--rooms=missing'])));
  assert.throws(()=>evidenceOptions(['--rooms=a,a']));
});

test('three rooms: production update traverses spawn to exit and fires into live enemies legally', async () => {
  const server = await createServer({configFile:false,server:{middlewareMode:true},logLevel:'error'});
  try {
    const {stageEvidenceGame, traverseEvidenceRoom, fightEvidenceGame} = await server.ssrLoadModule('/scripts/room-evidence-scene.mjs');
    const {generateRun} = await server.ssrLoadModule('/src/game/roguelike/run.ts');
    for(const templateId of ['passenger-vault','breached-loading-bay','overload-floor']) {
      const node = {...generateRun(1729).nodes.find(n=>n.templateId===templateId),id:`evidence-${templateId}`};
      const traversal = traverseEvidenceRoom(node);
      assert.ok(traversal.steps>0 && traversal.distance>500);
      assert.ok(traversal.exitDistance<2);
      const a = stageEvidenceGame(node), b = stageEvidenceGame(node);
      const first = fightEvidenceGame(a), second = fightEvidenceGame(b);
      assert.deepEqual(first,second,'fixed-step capture must reproduce simulation state');
      assert.ok(first.shots>0 && first.damage>0 && first.enemyDistance>0);
      assert.ok(first.playerDistance>0 && first.legalChecks>0 && first.activeEnemies>0);
      assert.ok(first.bullets>0,'capture an active projectile, not idle aftermath');
    }
  } finally {await server.close();}
});
