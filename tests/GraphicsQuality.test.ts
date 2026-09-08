import {afterEach,describe,expect,it,vi} from 'vitest';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {FrameBudget} from '../src/render/FrameBudget';

// Keep quality selection and frame observation real; replace only GPU resizing.
function renderer(){
 const instance=Object.create(DepthRenderer.prototype) as DepthRenderer;
 Object.assign(instance,{budget:new FrameBudget(),renderer:{shadowMap:{enabled:false}},resize:vi.fn()});
 return instance;
}
function slowFrames(instance:DepthRenderer){for(let i=0;i<180;i++)instance.observeFrame(1/30,25,true);}
afterEach(()=>vi.unstubAllGlobals());
describe.each([false,true])('graphics quality with coarse pointer %s',coarse=>{
 it.each([undefined,null,'','invalid',42])('defaults missing/invalid quality %s to fixed High',value=>{
  vi.stubGlobal('matchMedia',()=>({matches:coarse}));
  const instance=renderer();
  instance.setQuality(value as Parameters<DepthRenderer['setQuality']>[0]);
  expect(instance.qualityTier).toBe('high');
  expect(instance.renderer.shadowMap.enabled).toBe(true);
  slowFrames(instance);expect(instance.qualityTier).toBe('high');
 });
 it('keeps explicit High through sustained slow frames',()=>{
  vi.stubGlobal('matchMedia',()=>({matches:coarse}));
  const instance=renderer();instance.setQuality('high');slowFrames(instance);
  expect(instance.qualityTier).toBe('high');expect(instance.renderer.shadowMap.enabled).toBe(true);
 });
 it('preserves explicit Performance',()=>{
  vi.stubGlobal('matchMedia',()=>({matches:coarse}));
  const instance=renderer();instance.setQuality('low');slowFrames(instance);
  expect(instance.qualityTier).toBe('low');expect(instance.renderer.shadowMap.enabled).toBe(false);
 });
 it('only adapts when Automatic is selected and can return to fixed High',()=>{
  vi.stubGlobal('matchMedia',()=>({matches:coarse}));
  const instance=renderer();instance.setQuality('auto');
  expect(instance.qualityTier).toBe(coarse?'low':'balanced');
  slowFrames(instance);expect(instance.qualityTier).toBe('low');
  instance.setQuality('high');slowFrames(instance);expect(instance.qualityTier).toBe('high');
 });
});
