import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {afterEach,expect,it,vi} from 'vitest';
import {InputController} from '../src/InputController';
import {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';
class Element extends EventTarget {style:Record<string,string>={};classList={add:vi.fn(),remove:vi.fn()};setPointerCapture=vi.fn();matches(){return false;}}
afterEach(()=>vi.unstubAllGlobals());
it('lets Escape resume from a focused volume slider without consuming native range keys',()=>{
 const elements=new Map<string,Element>();for(const id of ['move-zone','stick','knob','fire','reload','grenade','heal'])elements.set(id,new Element());
 const doc=Object.assign(new EventTarget(),{querySelector:(q:string)=>elements.get(q.slice(1)),getElementById:(id:string)=>elements.get(id),hidden:false});vi.stubGlobal('document',doc);vi.stubGlobal('window',new EventTarget());
 const game=new DepthGame(),onPause=vi.fn(),canvas=new Element();
 const input=new InputController(game,{canvas,pointer:()=>null} as unknown as DepthRenderer,onPause);
 const key=(name:string)=>{const e=Object.assign(new Event('keydown',{cancelable:true}),{key:name,repeat:false});Object.defineProperty(e,'target',{value:{matches:()=>true}});doc.dispatchEvent(e);return e;};
 expect(key('ArrowRight').defaultPrevented).toBe(false);
 expect(key('Home').defaultPrevented).toBe(false);
 expect(key('End').defaultPrevented).toBe(false);
 expect(input.read().x).toBe(0);expect(onPause).not.toHaveBeenCalled();
 key('Escape');expect(onPause).toHaveBeenCalledExactlyOnceWith(true);
});
it('keeps keyboard movement while mouse fire releases and reloads',()=>{
 const doc=Object.assign(new EventTarget(),{hidden:false});vi.stubGlobal('document',doc);vi.stubGlobal('window',new EventTarget());
 const game=new DepthGame();game.newRun(9);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);const canvas=new Element();
 const input=new InputController(game,{canvas,pointer:()=>null} as unknown as DepthRenderer,()=>{});
 const key=(type:string,name:string)=>{const e=Object.assign(new Event(type,{cancelable:true}),{key:name,repeat:false});Object.defineProperty(e,'target',{value:{matches:()=>false}});doc.dispatchEvent(e);};
 const pointer=(type:string)=>canvas.dispatchEvent(Object.assign(new Event(type),{pointerType:'mouse',button:0,pointerId:1,clientX:300,clientY:200}));
 key('keydown','d');pointer('pointerdown');expect(input.read()).toMatchObject({x:1,fire:true});game.update(20,input.read());pointer('pointerup');key('keydown','r');expect(game.combat.snapshot.reloading).toBe(true);expect(input.read()).toMatchObject({x:1,fire:false});
 key('keydown',' ');expect(input.read()).toMatchObject({autoAim:true,fire:true});key('keyup',' ');key('keyup','d');expect(input.read()).toMatchObject({x:0,fire:false});
});
