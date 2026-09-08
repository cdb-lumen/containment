import {it,expect,vi} from 'vitest';
import {InputController} from '../src/InputController';
import {DepthGame} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import type {DepthRenderer} from '../src/render/DepthRenderer';
it('production input drops pending keys, repeats, pointer fire and consumables but preserves Escape',()=>{
 class Node extends EventTarget {style={};classList={add(){},remove(){}};matches(){return false;}setPointerCapture(){}}
 const nodes=new Map<string,Node>();const get=(id:string)=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)!;};
 const document=Object.assign(new Node(),{querySelector:get,getElementById:get,hidden:false});vi.stubGlobal('document',document);vi.stubGlobal('window',new Node());
 try{
 const game=new DepthGame();game.newRun(137);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
 let ready=false;const pause=vi.fn();const canvas=new Node();const input=new InputController(game,{canvas,pointer:()=>null} as unknown as DepthRenderer,pause,()=>ready);
 const key=(value:string,repeat=false)=>{const e=new Event('keydown');Object.assign(e,{key:value,repeat});document.dispatchEvent(e);};
 const before=JSON.stringify(game.combat.snapshot);for(const k of ['d',' ','g','e','r','1'])key(k);canvas.dispatchEvent(Object.assign(new Event('pointerdown'),{pointerType:'mouse',button:0,pointerId:1}));get('grenade').dispatchEvent(new Event('pointerdown'));
 expect(JSON.stringify(game.combat.snapshot)).toBe(before);expect(input.read()).toMatchObject({x:0,fire:false});key('Escape');expect(pause).toHaveBeenCalledWith(true);
 ready=true;key('d',true);key(' ',true);expect(input.read()).toMatchObject({x:0,fire:false});key('d');key(' ');expect(input.read()).toMatchObject({x:1,fire:true});ready=false;input.read();ready=true;expect(input.read()).toMatchObject({x:0,fire:false});
 }finally{vi.unstubAllGlobals();}
});
