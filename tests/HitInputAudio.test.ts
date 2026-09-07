import {expect,it,vi} from 'vitest';
import {InputController} from '../src/InputController';
import {DepthGame} from '../src/DepthGame';
import {EnemySystem} from '../src/game/enemies/EnemySystem';
import {AudioSystem} from '../src/game/audio/AudioSystem';
import {enemyShotRadius} from '../src/game/combat/enemyContact';

it('production InputController supplies visible body colliders and uses corrected aim',()=>{
 const game=new DepthGame();game.enemies=new EnemySystem();game.geometry={...game.geometry,bounds:{x:0,y:0,width:1000,height:1000},boundary:undefined,voids:[],blockers:[{x:400,y:0,width:10,height:1000}]};Object.assign(game.player,{x:100,y:100});game.enemies.spawn('crawler',200,200);game.enemies.spawn('brute',500,200);
 const pointer=vi.fn(()=>({x:200,y:200}));
 const input=Object.assign(Object.create(InputController.prototype),{game,gameplayReady:()=>true,view:{pointer},keys:new Set(),movement:{x:0,y:0},aim:null,mouse:{x:300,y:250,active:true},touchFire:false,shooting:true}) as InputController;
 expect(input.read()).toMatchObject({angle:Math.PI/4,fire:true,autoAim:false});
 expect(pointer.mock.calls[0]).toEqual([300,250,[expect.objectContaining({id:1,x:200,y:200,radius:enemyShotRadius('crawler')})]]);
});
it('armor uses a quieter metallic sample; rapid hits and paused audio are suppressed',()=>{
 const audio=new AudioSystem(),clock={state:'running',currentTime:0};Object.assign(audio,{context:clock,effectsGain:{}});
 const play=vi.spyOn(audio as unknown as {play:(...args:unknown[])=>null},'play').mockImplementation(()=>null);
 audio.playConfirmedHit(true);expect(play).toHaveBeenLastCalledWith('switch.wav',.10,{rate:1.4});
 audio.playConfirmedHit(false);expect(play).toHaveBeenCalledTimes(1);
 clock.currentTime=.06;audio.playConfirmedHit(false);expect(play).toHaveBeenLastCalledWith('alien-impact.wav',.20,{rate:1.65});
 audio.pauseAll();clock.currentTime=1;audio.playConfirmedHit(true);expect(play).toHaveBeenCalledTimes(2);
});
