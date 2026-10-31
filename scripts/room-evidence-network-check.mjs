import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {isCompletedDuplicateModule} from './room-evidence-network.mjs';

const json='http://127.0.0.1:5173/src/render/garden-trees.json?import';
const accepts=(url, completed=[url])=>isCompletedDuplicateModule(url,new Set(completed));
test('accepts the exact completed Vite JSON import',()=>{
  assert.equal(accepts(json),true);
  assert.equal(accepts(json+'&t=123'),true);
});
test('retains JS and TS module extensions',()=>{
  for(const ext of ['js','mjs','cjs','jsx','ts','mts','cts','tsx'])
    assert.equal(accepts(`http://127.0.0.1:5173/src/module.${ext}?t=123`),true);
});
test('requires exact completed URL without query or port normalization',()=>{
  for(const completed of [[],[json.replace('5173','5174')],[json+'&t=123'],[json.replace('?import','')]])
    assert.equal(accepts(json,completed),false);
});
test('does not accept plain JSON or binary assets even when completed',()=>{
  for(const suffix of ['.json','.json?raw','.json?notimport','.json?x=import','.glb?import','.png?import','.ktx2?import','.json?x=file.js','.glb?x=file.ts'])
    assert.equal(accepts('http://127.0.0.1:5173/src/asset'+suffix),false);
});
test('rejects malformed URLs',()=>assert.equal(accepts('not a URL'),false));
test('capture keeps HTTP and non-abort failures fatal before duplicate classification',async()=>{
  const source=await readFile(new URL('./room-evidence.mjs',import.meta.url),'utf8');
  // Execute the actual installed event callbacks, not a copy of the policy.
  const errors=[],abortedRequests=[],loadedUrls=new Set(), handlers=new Map();
  const page={on:(name,handler)=>handlers.set(name,handler)};
  const registrations=source.slice(source.indexOf("      page.on('pageerror'"),source.indexOf('      try {',source.indexOf("      page.on('pageerror'")));
  Function('page','errors','abortedRequests','loadedUrls',registrations)(page,errors,abortedRequests,loadedUrls);
  handlers.get('requestfinished')({url:()=>json});
  handlers.get('requestfailed')({url:()=>json,failure:()=>({errorText:'net::ERR_ABORTED'})});
  assert.deepEqual(errors,[]);assert.deepEqual(abortedRequests,[json]);
  handlers.get('response')({status:()=>404,url:()=>json});
  handlers.get('requestfailed')({url:()=>json,failure:()=>({errorText:'net::ERR_FAILED'})});
  assert.deepEqual(errors,['404 '+json,json+': net::ERR_FAILED']);
  const start=source.indexOf('          assert.deepEqual(errors,[]);');
  const end=source.indexOf('          const row=',start);
  const check=Function('assert','errors','abortedRequests','loadedUrls','isCompletedDuplicateModule',source.slice(start,end));
  assert.throws(()=>check(assert,errors,abortedRequests,loadedUrls,isCompletedDuplicateModule));
});
