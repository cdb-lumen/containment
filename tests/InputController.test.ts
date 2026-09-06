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
it('keeps the left thumb moving while the right thumb fires, reloads, or cancels',()=>{
 const elements=new Map<string,Element>();for(const id of ['move-zone','stick','knob','fire','reload','grenade','heal'])elements.set(id,new Element());
 const doc=Object.assign(new EventTarget(),{querySelector:(q:string)=>elements.get(q.slice(1)),getElementById:(id:string)=>elements.get(id),hidden:false});vi.stubGlobal('document',doc);vi.stubGlobal('window',new EventTarget());
 const game=new DepthGame();game.newRun(9);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);const canvas=new Element();const renderer={canvas,pointer:()=>null} as unknown as DepthRenderer;const input=new InputController(game,renderer,()=>{});
 const pointer=(id:string,type:string,pointerId:number,x:number,y:number)=>elements.get(id)!.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{pointerId,clientX:x,clientY:y,pointerType:'touch',button:0}));
 pointer('move-zone','pointerdown',1,80,400);pointer('move-zone','pointermove',1,128,400);pointer('fire','pointerdown',2,350,500);expect(input.read().x).toBe(1);expect(input.read().fire).toBe(true);game.update(20,input.read());pointer('fire','pointerup',2,350,500);pointer('reload','pointerdown',3,350,360);expect(game.combat.snapshot.reloading).toBe(true);expect(input.read().x).toBe(1);const x=game.player.x;game.update(50,input.read());expect(game.player.x).toBeGreaterThan(x);pointer('fire','pointerdown',4,350,500);pointer('fire','pointercancel',4,350,500);expect(input.read().fire).toBe(false);expect(input.read().x).toBe(1);pointer('move-zone','lostpointercapture',1,128,400);expect(input.read().x).toBe(0);
});
