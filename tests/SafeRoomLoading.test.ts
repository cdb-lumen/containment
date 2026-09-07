import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {DepthGame} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';

// Execute the actual main RAF body, with only GPU/DOM/audio adapters replaced.
function harness(){
 const game=new DepthGame();game.newRun(137);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
 const renderer={roomLoading:true,loadRoom:vi.fn(),render:vi.fn(),observeFrame:vi.fn()};
 let held=true;const input={read:()=>({x:held?1:0,y:0,fire:held,angle:0,autoAim:false}),reset:vi.fn(()=>{held=false;})};
 const node={hidden:true,setAttribute:vi.fn()};
 const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('function frame(now:number)'),source.indexOf('lastRoom=game.roomRevision;syncScreen(true)'));
 const factory=new Function('game','renderer','input','el',`let lastRoom=-1,lastStatus='',graphicsLost=false,roomRecovering=true,hudTime=0;const requestAnimationFrame=()=>{},document={hidden:false},pacer={sample:()=>.05,reset:()=>{}},confirmation={update:()=>{}},performance={now:()=>0},syncScreen=()=>{},hud=()=>{},audio={syncCombat:()=>{},setMusicIntensity:()=>{}},diagnostics={record:()=>{}};${ts.transpile(body)};return frame;`);
 return {game,renderer,input,node,frame:factory(game,renderer,input,()=>node)};
}
const snapshot=(g:DepthGame)=>JSON.stringify({player:g.player,combat:g.combat.snapshot,enemies:g.enemies.snapshot,bullets:g.bullets,pools:g.pools,elapsed:g.elapsed,remaining:g.encounterRemaining,expedition:g.expedition,story:g.storyPresentation});
it('actual RAF freezes all combat/progression while pending and discards held movement/fire',()=>{
 const h=harness(),before=snapshot(h.game);for(let i=0;i<160;i++)h.frame(i*50);
 expect(snapshot(h.game)).toBe(before);expect(h.input.reset).toHaveBeenCalled();expect(h.renderer.render).not.toHaveBeenCalled();
 expect(h.node.hidden).toBe(false);
 h.renderer.roomLoading=false;h.frame(9000);expect(snapshot(h.game)).toBe(before);expect(h.renderer.render).toHaveBeenCalled();
 h.frame(9050);expect(h.game.elapsed).toBeCloseTo(.05);expect(h.game.player.x).toBe(230);expect(h.game.bullets).toHaveLength(0);
});
it('ready/fallback recovery does not unpause a user pause and reentry gates before update',()=>{
 const h=harness();h.frame(0);h.game.pause();const paused=snapshot(h.game);h.renderer.roomLoading=false;h.frame(9000);h.frame(9050);
 expect(h.game.status).toBe('paused');expect(snapshot(h.game)).toBe(paused);
 h.game.resume();h.game.newRun(137);expect(h.game.status).toBe('reward');expect(h.game.expedition.build.mutations).toHaveLength(0);
 h.renderer.roomLoading=true;h.frame(9100);expect(h.game.status).toBe('reward');expect(h.game.storyPresentation).toBeTruthy();
 h.game.chooseMutation(expeditionRewardOffers(h.game.expedition)[0].id);const restarted=snapshot(h.game);h.frame(9150);expect(snapshot(h.game)).toBe(restarted);
});
