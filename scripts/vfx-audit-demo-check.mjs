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
test('catalog keeps each effect in a separate clip',()=>assert.deepEqual(Object.keys(CASES),['acid-impact','acid-pool','ricochet','ice-lance','ball-lightning','fragmentation','frost-field','hot-reload']));
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
 for(const id of ['acid-impact','acid-pool'])assert.throws(()=>verifyEvents([{...impact,targetId:42,contact:'damage'}],[frame],opt(id),[...spit,...queen]),/untargeted/);
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
test('links require real shots, secondary damage and chilled lance targets',()=>{
 for(const id of ['ricochet','ice-lance']){
  const o=opt(id),boon=id==='ricochet'?'impact':'frost',amount=id==='ricochet'?18:14;
  const events=[{type:'shot'},{type:'boon',boon,targetX:100,targetY:100}],frames=[{zoom:1,secondaryDamage:amount,secondaryStatuses:{chilled:true}}],damage=[{owner:'damage',amount,applied:true,secondary:true}];
  assert.doesNotThrow(()=>verifyEvents(events,frames,o,damage));
  assert.throws(()=>verifyEvents(events,frames,o,[]),/secondary damage/);
  assert.throws(()=>verifyEvents(events.slice(1),frames,o,damage),/shot/);
  assert.throws(()=>verifyEvents(events,[{...frames[0],secondaryDamage:0}],o,damage),/secondary health/);
  if(id==='ice-lance')assert.throws(()=>verifyEvents(events,[{...frames[0],secondaryStatuses:{}}],o,damage),/chill/);
 }
});
test('radial demos reject links, missing kills and missing delayed discharges',()=>{
 for(const id of ['ball-lightning','fragmentation']){
  const o=opt(id),ball=id==='ball-lightning',boon=ball?'arc':'impact',amount=ball?22:16;
  const events=[{type:'shot'},{type:'boon',boon,radius:ball?100:115,frame:20},...(ball?[{type:'boon',boon:'charge',durationMs:500,frame:10}]:[{type:'corpse'}])];
  const frames=[{zoom:1,secondaryDamage:amount}],damage=[{owner:'damage',amount,applied:true,secondary:true}];
  assert.doesNotThrow(()=>verifyEvents(events,frames,o,damage));
  assert.throws(()=>verifyEvents(events.slice(0,2),frames,o,damage),ball?/charge/:/kill/);
  assert.throws(()=>verifyEvents(events.map(e=>e.boon===boon?{...e,targetX:50,targetY:50}:e),frames,o,damage),/radial/);
  assert.throws(()=>verifyEvents(events,frames,o,[]),/secondary damage/);
 }
});
test('final Ball Lightning evidence rejects an end-of-clip discharge',()=>{
 const o=options(['--case=ball-lightning','--source-sha='+'a'.repeat(40)]);
 const events=[{type:'shot'},{type:'boon',boon:'charge',durationMs:500,frame:100},{type:'boon',boon:'arc',radius:100,frame:110}];
 assert.throws(()=>verifyEvents(events,[{zoom:1,secondaryDamage:22}],o,[{owner:'damage',amount:22,applied:true,secondary:true}]),/aftermath/);
});
test('reload evidence rejects a damaging cascade, missing reload completion or player damage',()=>{
 const o=opt('hot-reload'),events=[{type:'boon',boon:'overload'}],frames=[{zoom:1,damage:0,reloading:true,magazine:9},{zoom:1,damage:0,reloading:false,magazine:10}];
 assert.doesNotThrow(()=>verifyEvents(events,frames,o));
 assert.throws(()=>verifyEvents([{...events[0],radius:115}],frames,o),/prime/);
 assert.throws(()=>verifyEvents(events,[frames[0]],o),/reload/);
 assert.throws(()=>verifyEvents(events,frames.map(f=>({...f,damage:1})),o),/damage/);
 assert.throws(()=>verifyEvents([...events,{type:'shot'}],frames,o),/firing/);
});
test('recorder bytes retain numeric RNG and contain no redaction tokens',()=>{
 const source=readFileSync(new URL('./vfx-audit-demo.mjs',import.meta.url),'utf8');
 assert(!source.includes('****'));assert(source.includes(String(1013904223)));
});
