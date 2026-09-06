import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const path=new URL('./room-demo.mjs',import.meta.url);
test('reusable room recorder exists',()=>assert.ok(existsSync(path),'Missing room-demo.mjs'));
if(existsSync(path)) {
 const {demoOptions,verifyProbe,decodedMotion,verifyRuntime}=await import(path);
 test('combat requires repeated live shots, damage and legal movement',()=>{
  const options=demoOptions(['--provisional','--seconds=2']);
  const runtime={elapsed:2,travel:100,legalChecks:160,damage:20,events:[...Array.from({length:4},()=>({type:'shot'})),{type:'acid'}]};
  verifyRuntime(runtime,[{bullets:1}],options);
  assert.throws(()=>verifyRuntime({...runtime,events:[{type:'shot'},{type:'shot'},{type:'acid'}]},[{bullets:1}],options),/shots/);
  assert.throws(()=>verifyRuntime({...runtime,damage:0},[{bullets:1}],options),/damage/);
  assert.throws(()=>verifyRuntime(runtime,[{bullets:0}],options),/projectiles/);
 });
 test('final capture requires exact SHA and 6–10 seconds',()=>{
  assert.throws(()=>demoOptions([]),/source-sha/);
  assert.throws(()=>demoOptions(['--source-sha='+ 'a'.repeat(40),'--seconds=2']),/seconds/);
  assert.throws(()=>demoOptions(['--provisional','--seconds=2','--fps=19']),/fps/);
  assert.throws(()=>demoOptions(['--provisional','--seconds=2','--viewport=tablet']),/viewport/);
  assert.throws(()=>demoOptions(['--provisional','--seconds=2','--room=../bad']),/room/);
  assert.throws(()=>demoOptions(['--provisional','--seconds=2','--unknown=yes']),/Unknown/);
  assert.equal(demoOptions(['--provisional','--seconds=2']).frames,40);
  assert.equal(demoOptions(['--source-sha='+ 'a'.repeat(40)]).frames,120);
 });
 test('probe rejects wrong codec, duration and actual decoded count',()=>{
  const options=demoOptions(['--provisional','--seconds=2']);
  const probe={streams:[{codec_name:'h264',pix_fmt:'yuv420p',width:1280,height:900,nb_read_frames:'40',avg_frame_rate:'20/1'}],format:{duration:'2'}};
  verifyProbe(probe,options);
  for(const [key,value] of [['codec_name','vp9'],['pix_fmt','yuv444p'],['nb_read_frames','39'],['avg_frame_rate','30/1']])assert.throws(()=>verifyProbe({...probe,streams:[{...probe.streams[0],[key]:value}]},options));
  assert.throws(()=>verifyProbe({...probe,format:{duration:'1.8'}},options));
 });
 test('motion validation rejects still or truncated decoded actor crops',()=>{
  assert.throws(()=>decodedMotion(Buffer.alloc(16*10),16,10),/motion/);
  assert.throws(()=>decodedMotion(Buffer.alloc(159),16,10),/length/);
  const raw=Buffer.concat(Array.from({length:10},(_,i)=>Buffer.alloc(16,i*10)));
  assert.equal(decodedMotion(raw,16,10).uniqueFrames,10);
 });
}
