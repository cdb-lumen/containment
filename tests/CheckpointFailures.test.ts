import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {CHECKPOINT_STORAGE_KEY,type StorageLike} from '../src/game/roguelike/checkpoints';

function fixture(){
 const values=new Map<string,string>();
 const failures={write:false,remove:false};
 const storage:StorageLike={
  getItem:key=>values.get(key)??null,
  setItem(key,value){if(failures.write)throw new Error('quota');values.set(key,value);},
  removeItem(key){if(failures.remove)throw new Error('security');values.delete(key);},
 };
 const game=new DepthGame(()=>{},storage);
 game.newRun(137);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
 return {game,storage,values,failures};
}
// Invoke the production room-clear boundary without simulating an entire encounter.
const clear=(game:DepthGame)=>game['clearRoom']();

describe('checkpoint failure feedback',()=>{
 it('does not promise a checkpoint before the first room is cleared',()=>{
  const {game}=fixture();
  expect(game.checkpointStatus).toBe('none');
  expect(game.checkpointNote).toContain('No checkpoint saved yet');
 });
 it('warns about failed writes, keeps gameplay usable, and recovers after a later successful boundary',()=>{
  const {game,failures,storage}=fixture();failures.write=true;clear(game);
  expect(game.status).toBe('reward');expect(game.checkpointStatus).toBe('save-failed');
  expect(game.checkpointWarning).toContain('could not be saved');expect(game.canContinue).toBe(false);
  failures.write=false;game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  expect(game.status).toBe('route');expect(game.checkpointStatus).toBe('saved');
  expect(game.checkpointWarning).toBe('');expect(game.canContinue).toBe(true);
  const restored=new DepthGame(()=>{},storage);expect(restored.continueRun()).toBe(true);
  expect(restored.checkpointStatus).toBe('saved');
 });
 it('distinguishes an older checkpoint from the latest failed save',()=>{
  const {game,failures,values}=fixture();clear(game);const saved=values.get(CHECKPOINT_STORAGE_KEY);
  failures.write=true;game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  expect(game.checkpointWarning).toContain('older checkpoint');expect(game.canContinue).toBe(true);
  expect(values.get(CHECKPOINT_STORAGE_KEY)).toBe(saved);
 });
 it('reports failed deletion on a new run and suppresses stale Continue until a successful save',()=>{
  const {game,failures,values}=fixture();clear(game);failures.remove=true;game.newRun(42);
  expect(game.checkpointStatus).toBe('clear-failed');expect(game.checkpointWarning).toContain('old run');
  expect(values.has(CHECKPOINT_STORAGE_KEY)).toBe(true);expect(game.canContinue).toBe(false);
  game.menu();expect(game.continueRun()).toBe(false);
  game.newRun(42);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);clear(game);
  expect(game.checkpointStatus).toBe('saved');expect(game.canContinue).toBe(true);
 });
 it('reports failed deletion on death, including after returning to title',()=>{
  const {game,failures,values}=fixture();clear(game);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);game.route(game.node.next[0]);
  failures.remove=true;game.hurt(10000);
  expect(game.status).toBe('dead');expect(game.checkpointStatus).toBe('clear-failed');
  expect(game.canContinue).toBe(false);expect(values.has(CHECKPOINT_STORAGE_KEY)).toBe(true);
  game.menu();expect(game.checkpointWarning).toContain('Reloading may restore');
 });
 it('does not claim deletion succeeded on completion',()=>{
  const {game,failures}=fixture();clear(game);
  // Restore the last-room reward through the real route flow, clearing encounters at each boundary.
  for(let depth=0;depth<19;depth++){
   const offers=expeditionRewardOffers(game.expedition);
   if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();
   if(depth===18){failures.remove=true;game.authorizeDestruction();}else game.route(game.node.next[0]);
   clear(game);
  }
  expect(game.status).toBe('complete');expect(game.checkpointStatus).toBe('clear-failed');
  expect(game.canContinue).toBe(false);
 });
 it('warns when no storage is available without interrupting the run',()=>{
  const game=new DepthGame();expect(game.checkpointStatus).toBe('unavailable');game.newRun(137);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);clear(game);
  expect(game.status).toBe('reward');expect(game.checkpointNote).toContain('Saving is unavailable');
 });
 it('renders warnings on every noncombat screen and invalidates the cached screen on persistence changes',()=>{
  const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  expect(main).toContain('${game.checkpointStatus}');expect(main).toContain('${game.checkpointNote}');
  expect(main).toContain("if(game.checkpointWarning&&status!=='paused')");
  expect(main).not.toContain('Progress saves between rooms. Leaving a fight returns to the last cleared room.');
 });
});
