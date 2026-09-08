import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {DepthRenderer} from '../src/render/DepthRenderer';

// Keep quality selection real; replace only GPU resizing.
function renderer(){
 const instance=Object.create(DepthRenderer.prototype) as DepthRenderer;
 Object.assign(instance,{renderer:{shadowMap:{enabled:false}},resize:vi.fn()});
 return instance;
}
afterEach(()=>vi.unstubAllGlobals());
describe.each([false,true])('graphics quality with coarse pointer %s',coarse=>{
 it.each([undefined,null,'','invalid','auto','balanced',42])('defaults missing/invalid quality %s to High',value=>{
  vi.stubGlobal('matchMedia',()=>({matches:coarse}));
  const instance=renderer();
  instance.setQuality(value as Parameters<DepthRenderer['setQuality']>[0]);
  expect(instance.qualityTier).toBe('high');expect(instance.renderer.shadowMap.enabled).toBe(true);
 });
 it('supports only explicit High and Low without device overrides',()=>{
  vi.stubGlobal('matchMedia',()=>({matches:coarse}));
  const instance=renderer();instance.setQuality('low');
  expect(instance.qualityTier).toBe('low');expect(instance.renderer.shadowMap.enabled).toBe(false);
  instance.setQuality('high');
  expect(instance.qualityTier).toBe('high');expect(instance.renderer.shadowMap.enabled).toBe(true);
 });
});
it.each(['high','low'])('restores the selected %s quality after WebGL recovery',quality=>{
 const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 const body=source.match(/webglcontextrestored',\(\)=>\{([^}]+)\}/)![1];
 const target={setQuality:vi.fn()},syncScreen=vi.fn();
 const restored=new Function('renderer','quality','syncScreen',`let graphicsLost=true;${body};return graphicsLost;`);
 expect(restored(target,quality,syncScreen)).toBe(false);
 expect(target.setQuality).toHaveBeenCalledWith(quality);expect(syncScreen).toHaveBeenCalledWith(true);
});
it('removes the automatic downgrade path while retaining frame pacing and diagnostics',()=>{
 const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 expect(DepthRenderer.prototype).not.toHaveProperty('observeFrame');
 expect(source).not.toContain('renderer.observeFrame(');
 expect(source).toContain('pacer.sample(now)');expect(source).toContain('diagnostics.record(');
});
