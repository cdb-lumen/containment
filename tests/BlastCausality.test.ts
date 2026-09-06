import {it,expect} from 'vitest';
import {DepthGame,type Bullet,type GameEffect} from '../src/DepthGame';
import type {MutationRuntime} from '../src/game/roguelike/MutationRuntime';
import type {MutationId} from '../src/game/roguelike/types';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
function fixture(ids:MutationId[]){
 const events:GameEffect[]=[],g=new DepthGame(e=>events.push(e));g.newRun(1729);g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);
 g.combat.setBuild({mutations:ids});
 const seam=g as unknown as {makeMutations():MutationRuntime;mutations:MutationRuntime;blast(b:Bullet):void};seam.mutations=seam.makeMutations();
 g.enemies.spawn('brute',g.player.x,g.player.y,false);
 const t=g.targets()[0];
 const blast=(x=t.x,y=t.y)=>{g.switchWeapon('rocket');const request=g.combat.fire(0)[0];expect(request).toBeDefined();seam.blast({x,y,request:{...request,damage:100000}} as Bullet);return events.find(e=>e.type==='explosion')!;};
 return {g,seam,t,blast};
}
it('snapshots actual ice and poison before lethal splash clears statuses',()=>{
 const w=fixture(['cryogenic','caustic-rounds']);w.seam.mutations.hit('prime','pistol',w.t,{x:1,y:0});
 expect(w.seam.mutations.statuses(w.t.id)).toMatchObject({chilled:true,poisoned:true});
 expect(w.blast().elements).toEqual(['ice','poison']);expect(w.g.targets()).toHaveLength(0);
});
it('does not tint from owned boons without active local status',()=>{
 const w=fixture(['cryogenic','caustic-rounds','incendiary']);expect(w.blast().elements).toEqual([]);
});
it('ignores a status outside the affected blast radius',()=>{
 const w=fixture(['cryogenic']);w.seam.mutations.hit('prime','pistol',w.t,{x:1,y:0});expect(w.blast(w.t.x+1000,w.t.y).elements).toEqual([]);
});
it('does not reuse expired target statuses',()=>{
 const w=fixture(['cryogenic']);w.seam.mutations.hit('prime','pistol',w.t,{x:1,y:0});w.seam.mutations.update(10000);expect(w.blast().elements).toEqual([]);
});
