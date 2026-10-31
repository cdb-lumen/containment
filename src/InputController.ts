import {hasClearExpeditionShot} from './game/world/expeditionGeometry';
import {enemyShotRadius} from './game/combat/enemyContact';
import type {DepthGame,GameInput} from './DepthGame';
import type {DepthRenderer} from './render/DepthRenderer';
const WEAPONS=['pistol','rifle','shotgun','plasma','rocket'] as const;
/** Desktop keyboard movement, mouse aiming and Space aim assist. */
export class InputController {
 private keys=new Set<string>();private mouse={x:0,y:0,active:false};private shooting=false;
 constructor(private game:DepthGame,private view:DepthRenderer,private onPause:(toggle?:boolean)=>void,private gameplayReady:()=>boolean=()=>true){
  const canvas=view.canvas;canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')this.mouse={x:e.clientX,y:e.clientY,active:true};});canvas.addEventListener('pointerdown',e=>{if(!this.gameplayReady()||e.pointerType!=='mouse'||e.button!==0||game.status!=='playing')return;this.shooting=true;this.mouse={x:e.clientX,y:e.clientY,active:true};canvas.setPointerCapture(e.pointerId);});['pointerup','pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,()=>{this.shooting=false;}));
  document.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(key!=='escape'&&(e.target as HTMLElement).matches('input,select'))return;if(game.status==='playing'&&[' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();if(key==='escape'){if(!e.repeat)this.onPause(true);return;}if(!this.gameplayReady()||game.status!=='playing')return;if(e.repeat)return;this.keys.add(key);if(key==='r')game.reload();if(key==='g')game.grenade();if(key==='e')game.heal();if('12345'.includes(key))game.switchWeapon(WEAPONS[Number(key)-1]);});document.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{this.reset();this.onPause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){this.reset();this.onPause();}});window.addEventListener('resize',()=>this.reset());document.addEventListener('contextmenu',e=>e.preventDefault());
 }
 reset(){this.keys.clear();this.shooting=false;}
 read():GameInput{if(!this.gameplayReady()){this.reset();return{x:0,y:0,fire:false,angle:null,autoAim:false};}const k=this.keys;let x=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0),y=(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0);y/=.81;let angle:number|null=null;if(!k.has(' ')&&this.mouse.active){const point=this.view.pointer(this.mouse.x,this.mouse.y,this.game.targets().filter(t=>hasClearExpeditionShot(this.game.geometry,this.game.player,t)).map(t=>{const e=t.id>0?this.game.enemies.getSnapshot(t.id):undefined;return {...t,radius:e?enemyShotRadius(e.type,e.elite):t.radius};}));if(point)angle=Math.atan2(point.y-this.game.player.y,point.x-this.game.player.x);}return{x,y,angle,autoAim:k.has(' '),fire:this.shooting||k.has(' ')};}
}
