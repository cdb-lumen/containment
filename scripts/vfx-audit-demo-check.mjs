import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CASES,options,verifyEvents} from './vfx-audit-demo.mjs';
const opt=id=>options([`--case=${id}`,'--provisional']);
// Deliberately fabricated validation fixtures below are unit data, never media.
const frame={damage:5,zoom:1,bullets:[{kind:'hazard'}],pools:[{life:1,radius:90}]};
const impact={type:'acid',angle:0};
const pool={type:'acid',radius:120};
const spit=[{type:'hazard-attack',enemyType:'spitter'}];
const queen=[{type:'area-attack'}];
test('catalog is scoped to separate untargeted acid effects',()=>assert.deepEqual(Object.keys(CASES),['acid-impact','acid-pool']));
test('options enforce exact arguments, SHA, quality and final length',()=>{
 assert.equal(opt('acid-impact').frames,40);
 assert.equal(options(['--case=acid-pool','--source-sha='+'a'.repeat(40),'--root=/tmp/immutable']).root,'/tmp/immutable');
 for(const args of [[],['--case=unknown','--provisional'],['--case=acid-pool'],['--case=acid-pool','--source-sha=bad'],['--case=acid-pool','--provisional','--quality=ultra'],['--case=acid-pool','--provisional','--seconds=1'],['--case=acid-pool','--case=acid-impact','--provisional'],['--case=acid-pool','--provisional','--fps=30'],['--case=acid-pool','--source-sha='+'a'.repeat(40),'--seconds=2']])assert.throws(()=>options(args));
});
test('event validators accept appropriate runtime-shaped records',()=>{
 assert.doesNotThrow(()=>verifyEvents([impact],[frame],opt('acid-impact'),spit));
 assert.doesNotThrow(()=>verifyEvents([pool],[frame],opt('acid-pool'),queen));
});
test('targeted weapon acid is never hazard evidence',()=>{
 for(const id of Object.keys(CASES))assert.throws(()=>verifyEvents([{...impact,targetId:42,contact:'damage'}],[frame],opt(id),[...spit,...queen]),/untargeted/);
});
test('impact requires spitter output, hazard projectile and real damage',()=>{
 assert.throws(()=>verifyEvents([impact],[frame],opt('acid-impact'),queen),/spitter/);
 assert.throws(()=>verifyEvents([impact],[{...frame,bullets:[{kind:'player'}]}],opt('acid-impact'),spit),/projectile/);
 assert.throws(()=>verifyEvents([impact],[{...frame,damage:0}],opt('acid-impact'),spit),/damage/);
 assert.throws(()=>verifyEvents([pool],[frame],opt('acid-impact'),spit),/impact/);
});
test('pool requires queen output, radius, pool lifetime and damage',()=>{
 assert.throws(()=>verifyEvents([pool],[frame],opt('acid-pool'),spit),/queen/);
 assert.throws(()=>verifyEvents([impact],[frame],opt('acid-pool'),queen),/radius/);
 assert.throws(()=>verifyEvents([pool],[{...frame,pools:[]}],opt('acid-pool'),queen),/pool/);
 assert.throws(()=>verifyEvents([pool],[{...frame,damage:0}],opt('acid-pool'),queen),/damage/);
 const final=options(['--case=acid-pool','--source-sha='+'a'.repeat(40)]);
 assert.throws(()=>verifyEvents([pool],[frame],final,queen),/settled/);
 assert.doesNotThrow(()=>verifyEvents([pool],Array.from({length:40},()=>frame),final,queen));
});
test('player firing and camera changes invalidate evidence',()=>{
 assert.throws(()=>verifyEvents([impact,{type:'shot'}],[frame],opt('acid-impact'),spit),/firing/);
 assert.throws(()=>verifyEvents([impact],[frame,{...frame,zoom:2}],opt('acid-impact'),spit),/zoom/);
});
test('recorder bytes retain numeric RNG and contain no redaction tokens',()=>{
 const source=readFileSync(new URL('./vfx-audit-demo.mjs',import.meta.url),'utf8');
 assert(!source.includes('****'));assert(source.includes(String(1013904223)));
});
