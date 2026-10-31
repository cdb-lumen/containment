import assert from 'node:assert/strict';
import {arsenalChoice} from './native-arsenal-policy.mjs';
const empty=()=>({pistol:{magazine:12,reserve:-1},rifle:{magazine:0,reserve:0},shotgun:{magazine:0,reserve:0},plasma:{magazine:0,reserve:0},rocket:{magazine:0,reserve:0}});
let ammo=empty();ammo.shotgun.reserve=1;ammo.plasma.magazine=8;
assert.equal(arsenalChoice('shotgun',ammo),null,'keep current weapon for normal reload');
ammo.shotgun.reserve=0;assert.equal(arsenalChoice('shotgun',ammo).key,'4');
ammo=empty();assert.equal(arsenalChoice('rifle',ammo).key,'1');assert.equal(arsenalChoice('pistol',ammo),null);
for(const [id,limit] of Object.entries({plasma:8,shotgun:3,rifle:12,rocket:2})){
 ammo=empty();ammo[id].reserve=limit-1;assert.equal(arsenalChoice('pistol',ammo),null);
 ammo[id].reserve=limit;const before=JSON.stringify(ammo);assert.equal(arsenalChoice('pistol',ammo).weapon,id);assert.equal(JSON.stringify(ammo),before);
 ammo[id].reserve=1;assert.equal(arsenalChoice('pistol',ammo),null);assert.equal(arsenalChoice(id,ammo),null,'selected finite weapon is retained below return threshold');
}
ammo=empty();ammo.rocket.magazine=1;assert.equal(arsenalChoice('rifle',ammo).key,'5');
console.log('Arsenal pilot choices passed: keep/reload, exhaustion, fixed priority, pistol thresholds, no mutation.');
