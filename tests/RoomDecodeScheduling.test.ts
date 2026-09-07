import {it,expect,vi} from 'vitest';
import {DepthRenderer} from '../src/render/DepthRenderer';

it.each(['sealedBank','releasedBerth'])('yields GPU frames while %s is decoding, then resumes on every terminal state',key=>{
 const renderer=Object.create(DepthRenderer.prototype);
 renderer.roomKey=1;renderer[key]={state:'loading'};
 const game={node:{id:1},get status(){throw Error('render proceeds');}};
 expect(()=>renderer.render(game,.016)).not.toThrow();
 for(const state of ['ready','fallback','disposed']){
  renderer[key].state=state;
  expect(()=>renderer.render(game,.016)).toThrow('render proceeds');
 }
});
it('loads the new room before deciding whether its decode needs GPU time',()=>{
 const renderer=Object.create(DepthRenderer.prototype);renderer.roomKey=0;
 renderer.loadRoom=vi.fn(()=>{renderer.sealedBank={state:'loading'};});
 expect(()=>renderer.render({node:{id:1}},.016)).not.toThrow();
 expect(renderer.loadRoom).toHaveBeenCalledWith({id:1});
});
