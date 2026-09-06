import type {CombatSystem} from '../combat/CombatSystem';
import type {MutationId} from './types';
import type {BuildCause,BuildWeapon} from './builds';
import type {MutationTarget} from './MutationRuntime';

export type BoonEffect='frost'|'arc'|'burn'|'impact'|'leech'|'shield'|'overload'|'poison'|'charge'|'blast'|'shatter'|'field';
type Point={x:number;y:number};
type Host={
 combat:CombatSystem;targets:()=>readonly MutationTarget[];player:()=>Point;
 stacks:(id:number)=>number;burning:(id:number)=>boolean;clearChill:(id:number)=>void;clearBurn:(id:number)=>void;
 chill:(target:MutationTarget,stacks:number,duration:number)=>void;
 damage:(target:MutationTarget,amount:number,cause:BuildCause,id:string)=>void;
 push:(target:MutationTarget,dx:number,dy:number,cause:BuildCause,id:string)=>void;
 visible:(a:Point,b:Point)=>boolean;
 effect:(kind:BoonEffect,x:number,y:number,targetX?:number,targetY?:number,radius?:number,durationMs?:number)=>void;
};
type Poison={until:number;next:number;cause:BuildCause;id:string};
type Charge={at:number;point:Point;damage:number;radius:number;cause:BuildCause;id:string};
/** Additional elemental interactions share bounded target, shot and cooldown gates. */
export class ElementalRuntime{
 private time=0;private cooldowns=new Map<string,number>();private once=new Set<string>();
 private poison=new Map<number,Poison>();private roots=new Map<number,number>();
 private lastWeapon=new Map<number,BuildWeapon>();private frostTicks=new Map<number,number>();
 private charges:Charge[]=[];private fields:Array<Point&{until:number}>=[];
 private primed=new Set<string>();private arcCount=0;private secondaryKills=0;private salvaged=0;private siphoned=0;private healed=0;private bloodCharged=false;
 constructor(private h:Host){h.combat.onHealing(()=>{if(this.has('blood-capacitor'))this.bloodCharged=true;});}
 private has(id:MutationId){return this.h.combat.hasMutation(id);}
 private ready(key:string,ms:number){if((this.cooldowns.get(key)??0)>this.time)return false;this.cooldowns.set(key,this.time+ms);return true;}
 private first(key:string){if(this.once.has(key)||this.once.size>=4096)return false;this.once.add(key);return true;}
 private nearby(point:Point,radius:number,cap:number,exclude?:number){return this.h.targets().filter(t=>t.health>0&&t.id!==exclude&&Math.hypot(t.x-point.x,t.y-point.y)<=radius&&this.h.visible(point,t)).sort((a,b)=>(a.x-point.x)**2+(a.y-point.y)**2-((b.x-point.x)**2+(b.y-point.y)**2)||a.id-b.id).slice(0,cap);}
 private strike(t:MutationTarget,n:number,cause:BuildCause,id:string){if(cause.depth<=3)this.h.damage(t,n,cause,id);}
 private blast(p:Point,n:number,r:number,cap:number,cause:BuildCause,id:string,kind:BoonEffect='blast',exclude?:number){
  if(cause.depth>3)return;this.h.effect(kind,p.x,p.y,undefined,undefined,r);
  for(const t of this.nearby(p,r,cap,exclude))this.strike(t,n,cause,`${id}:${t.id}`);
 }
 private poisonTarget(t:MutationTarget,cause:BuildCause,id:string){if(cause.depth>3||!this.h.targets().some(x=>x.id===t.id&&x.health>0))return;const old=this.poison.get(t.id);this.poison.set(t.id,{until:this.time+3000,next:old?.next??this.time+500,cause,id});if(!old)this.h.effect('poison',t.x,t.y);}
 private charge(p:Point,n:number,r:number,delay:number,cause:BuildCause,id:string){if(this.charges.length>=6)return;this.charges.push({at:this.time+delay,point:{x:p.x,y:p.y},damage:n,radius:r,cause,id});this.h.effect('charge',p.x,p.y,undefined,undefined,r,delay);}
 registerShot(shot:string,primed:boolean){if(primed&&this.primed.size<4096)this.primed.add(shot);}
 clearFreeze(id:number){this.roots.delete(id);}
 reachedChill(t:MutationTarget,before:number,cause:BuildCause,id:string){
  if(before>=3||this.h.stacks(t.id)<3||!this.has('absolute-zero')||!this.ready(`zero:${t.id}`,2000))return;
  if(!t.immovable)this.roots.set(t.id,this.time+350);
  this.strike(t,18,cause,id);this.h.effect('shatter',t.x,t.y);
 }
 frozen(id:number){return (this.roots.get(id)??0)>this.time;}
 poisoned(id:number){return (this.poison.get(id)?.until??0)>this.time;}
 slow(t:MutationTarget){if(!t.immovable&&(this.roots.get(t.id)??0)>this.time)return 0;return this.fields.some(f=>f.until>this.time&&Math.hypot(f.x-t.x,f.y-t.y)<=75&&this.h.visible(f,t))?.75:1;}

 hit(shot:string,weapon:BuildWeapon,t:MutationTarget,direction:Point,before:{chill:number;burn:boolean},primed=false){
  const cause={chainId:shot,depth:1},id=`${shot}:element:${t.id}`;
  this.registerShot(shot,primed);
  const poisoned=this.poisoned(t.id);let thermal=false,combusted=false;
  if(this.has('thermal-shock')&&before.chill&&this.h.stacks(t.id)>0&&before.burn&&this.ready(`thermal:${t.id}`,1500)){
   thermal=true;this.h.clearChill(t.id);this.h.clearBurn(t.id);this.blast(t,32,90,4,cause,`${id}:thermal`,'shatter');
  }
  if(!thermal&&this.has('combustion')&&before.burn&&this.ready('combustion',1500)&&this.first(`combustion:${shot}`)){
   combusted=true;this.h.clearBurn(t.id);this.blast(t,26,85,4,cause,`${id}:combustion`);
  }
  if(this.has('first-impact')&&this.first(`first:${t.id}`)){this.strike(t,18,cause,`${id}:first`);this.h.effect('impact',t.x,t.y);}
  if(this.has('executioner')&&t.maxHealth&&t.health/t.maxHealth<.3&&this.ready(`execute:${t.id}`,900)){this.strike(t,24,cause,`${id}:execute`);this.h.effect('impact',t.x,t.y);}
  const previous=this.lastWeapon.get(t.id);this.lastWeapon.set(t.id,weapon);
  if(this.has('crossfire')&&previous&&previous!==weapon&&this.ready(`cross:${t.id}`,1200)){this.strike(t,28,cause,`${id}:cross`);this.h.effect('impact',t.x,t.y);}
  if(this.has('ricochet-rounds')&&this.ready('ricochet',1000)){const other=this.nearby(t,150,1,t.id)[0];if(other){this.strike(other,18,cause,`${id}:ricochet`);this.h.effect('impact',t.x,t.y,other.x,other.y);}}
  if(this.has('concussion-rounds')&&this.first(`push:${shot}`)&&this.ready('push',500)&&!t.immovable){const player=this.h.player(),power=Math.hypot(player.x-t.x,player.y-t.y)<180?75:35,d=Math.hypot(direction.x,direction.y)||1;this.h.push(t,direction.x/d*power,direction.y/d*power,cause,`${id}:push`);}
  if(!thermal)this.reachedChill(t,before.chill,cause,`${id}:zero`);
  if(this.has('ice-lance')&&before.chill&&this.ready('lance',900)&&this.first(`lance:${shot}`)){const other=this.nearby(t,140,1,t.id)[0];if(other){this.strike(other,14,cause,`${id}:lance`);this.h.chill(other,1,2000);this.h.effect('frost',t.x,t.y,other.x,other.y);}}
  if(this.has('caustic-rounds')&&!combusted)this.poisonTarget(t,cause,`${id}:poison`);
  if(this.has('aftershock')&&this.ready('aftershock',1000)&&this.first(`after:${shot}`))this.charge(t,18,75,450,cause,`${id}:after`);
  if(this.has('siphon-shells')&&(before.chill||before.burn||poisoned)&&this.siphoned<20&&this.ready('siphon',1500)&&this.first(`siphon:${shot}`)){const gain=this.h.combat.restoreArmor(2);this.siphoned+=gain;if(gain)this.h.effect('shield',t.x,t.y);}
  if(this.has('blood-capacitor')&&this.bloodCharged&&this.h.targets().some(x=>x.id===t.id&&x.health>0)){this.bloodCharged=false;this.strike(t,24,cause,`${id}:blood`);this.h.effect('leech',t.x,t.y);}
  return {skipBurn:thermal||combusted};
 }
 arc(origin:MutationTarget,targets:readonly MutationTarget[],cause:BuildCause,id:string){
  if(this.has('cryo-conductor'))for(const t of targets){if(this.h.stacks(t.id)>0)this.strike(t,12,cause,`${id}:cryo:${t.id}`);if(this.h.stacks(origin.id)>0)this.h.chill(t,1,2000);}
  if(this.has('ball-lightning')&&++this.arcCount%3===0)this.charge(origin,22,100,500,cause,`${id}:ball`);
 }
 kill(t:MutationTarget,source:'direct'|'secondary',cause:BuildCause,onHit=false){
  const next={chainId:cause.chainId,depth:cause.depth+1},id=`${cause.chainId}:death:${t.id}`;
  if(source==='direct'&&this.has('fragmentation')&&this.first(`frag:${cause.chainId}`))this.blast(t,16,115,3,next,`${id}:frag`,'impact',t.id);
  if((source==='direct'||onHit)&&this.primed.has(cause.chainId)&&this.has('reactor-cascade')&&this.first(`cascade:${cause.chainId}`))this.blast(t,36,115,5,next,`${id}:cascade`,'overload');
  if(this.has('toxic-bloom')&&this.poisoned(t.id)&&next.depth<=3&&this.first(`bloom:${cause.chainId}`)){this.h.effect('poison',t.x,t.y,undefined,undefined,100);for(const other of this.nearby(t,100,3,t.id))this.poisonTarget(other,next,`${id}:bloom`);}
  if(this.has('glacial-wake')&&this.h.stacks(t.id)>0&&this.first(`wake:${cause.chainId}`)){if(this.fields.length>=4)this.fields.shift();this.fields.push({x:t.x,y:t.y,until:this.time+2000});this.h.effect('field',t.x,t.y,undefined,undefined,75,2000);}
  if(source==='secondary'&&this.has('salvage-engine')){this.secondaryKills++;if(this.secondaryKills>=6&&this.salvaged<2&&this.h.combat.addGrenades(1)){this.secondaryKills-=6;this.salvaged++;this.h.effect('shield',t.x,t.y);}}
  this.poison.delete(t.id);this.roots.delete(t.id);this.lastWeapon.delete(t.id);this.frostTicks.delete(t.id);
 }
 reload(player:Point){if(this.has('combat-medic')&&this.healed<12&&this.h.combat.snapshot.health<100&&this.ready('medic',3000)){const n=Math.min(2,12-this.healed);this.h.combat.restoreHealth(n);this.healed+=n;this.h.effect('leech',player.x,player.y);}}
 hurt(armorBefore:number,armorAfter:number,player:Point){
  const chain=this.h.combat.nextMutationEventId('defense'),cause={chainId:chain,depth:1};
  if(this.has('reactive-barrier')&&this.ready('barrier',3000))this.blast(player,20,120,4,cause,chain,'shield');
  if(this.has('shock-absorber')&&armorBefore>0&&armorAfter===0&&this.ready('absorber',6000)){for(const t of this.nearby(player,150,3)){this.h.chill(t,1,2000);if(!t.immovable)this.roots.set(t.id,this.time+300);}this.h.effect('shatter',player.x,player.y,undefined,undefined,150);}
 }
 update(deltaMs:number){
  this.time+=Math.min(100,deltaMs);
  const active=this.h.targets();
  for(const [id,poison]of this.poison){let t=active.find(t=>t.id===id&&t.health>0);if(!t){this.poison.delete(id);continue;}let ticks=0;while(poison.next<=this.time&&poison.next<=poison.until&&ticks++<2){this.strike(t,5,poison.cause,`${poison.id}:${poison.next}`);poison.next+=500;t=this.h.targets().find(t=>t.id===id&&t.health>0);if(!t)break;}if(this.time>=poison.until)this.poison.delete(id);}
  if(this.has('frostbite'))for(const t of active){if(this.h.stacks(t.id)<3){this.frostTicks.delete(t.id);continue;}const next=this.frostTicks.get(t.id);if(next===undefined)this.frostTicks.set(t.id,this.time+500);else if(next<=this.time){this.frostTicks.set(t.id,this.time+500);const id=this.h.combat.nextMutationEventId('frostbite');this.strike(t,5,{chainId:id,depth:1},id);}}
  const due=this.charges.filter(c=>c.at<=this.time);this.charges=this.charges.filter(c=>c.at>this.time);for(const c of due)this.blast(c.point,c.damage,c.radius,4,c.cause,c.id,c.id.includes(':ball')?'arc':'blast');
  this.fields=this.fields.filter(f=>f.until>this.time);for(const[id,until]of this.roots)if(until<=this.time)this.roots.delete(id);
 }
 reset(){this.time=0;this.cooldowns.clear();this.once.clear();this.poison.clear();this.roots.clear();this.lastWeapon.clear();this.frostTicks.clear();this.charges=[];this.fields=[];this.primed.clear();this.arcCount=this.secondaryKills=this.salvaged=this.siphoned=this.healed=0;this.bloodCharged=false;}
 get counts(){return{charges:this.charges.length,fields:this.fields.length,poison:this.poison.size};}
}
