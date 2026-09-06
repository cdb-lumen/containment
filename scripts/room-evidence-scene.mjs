import {DepthGame} from '../src/DepthGame';
import {createExpeditionGeometry,canOccupyExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {ENEMIES} from '../src/game/enemies/catalog';

const check=(condition,message)=>{if(!condition)throw new Error(message);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const copy=p=>({x:p.x,y:p.y});
const idle={x:0,y:0,fire:false,angle:null,autoAim:false};

// Test-only assembly. The director is deliberately not started: these are local
// combat fixtures, not evidence of campaign progression or organic wave balance.
function localGame(node,emit=()=>{}) {
  const game=new DepthGame(emit);
  game.node=node;
  game.geometry=createExpeditionGeometry(node);
  game.navigation=new FacilityNavigation(game.geometry);
  game.enemies=game.makeEnemies();
  // Keep the constructor's inactive director. Synthetic evidence IDs are not
  // campaign nodes, and starting a director here would imply organic waves.
  Object.assign(game.player,game.geometry.playerSpawn);
  game.status='playing';game.combat.switchWeapon('rifle');
  check(canOccupyExpedition(game.geometry,game.player,game.player.radius),'Illegal authored spawn');
  return game;
}

function clearSegment(game,a,b) {
  const steps=Math.max(1,Math.ceil(distance(a,b)/2));
  for(let i=0;i<=steps;i++) if(!canOccupyExpedition(game.geometry,{x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps},game.player.radius))return false;
  return true;
}

function routeToExit(game) {
  const start=copy(game.player),goal=game.geometry.exitPoint,cell=24;
  const queue=[{...start,parent:-1}],seen=new Set(['0,0']);let end=-1;
  for(let head=0;head<queue.length;head++) {
    const p=queue[head];
    if(distance(p,goal)<=cell*2&&clearSegment(game,p,goal)){end=head;break;}
    for(const [dx,dy] of [[cell,0],[0,cell],[0,-cell],[-cell,0]]) {
      const next={x:p.x+dx,y:p.y+dy,parent:head},key=`${next.x-start.x},${next.y-start.y}`;
      if(seen.has(key))continue;seen.add(key);
      if(clearSegment(game,p,next))queue.push(next);
    }
  }
  check(end>=0,`No radius-${game.player.radius} route to exit in ${game.node.templateId}`);
  const route=[copy(goal)];for(let i=end;i>=0;i=queue[i].parent)route.push(copy(queue[i]));
  return route.reverse();
}

export function traverseEvidenceRoom(node) {
  const game=localGame(node),route=routeToExit(game);let steps=0,total=0;
  for(const target of route.slice(1)) {
    let budget=100;
    while(distance(game.player,target)>1) {
      check(budget-->0,'Production movement stalled on planned route');
      const before=copy(game.player),d=distance(before,target);
      game.update(1000/60,{...idle,x:(target.x-before.x)/d*Math.min(1,d/(220/60)),y:(target.y-before.y)/d*Math.min(1,d/(220/60))});
      check(canOccupyExpedition(game.geometry,game.player,game.player.radius),'Traversal entered solid geometry');
      total+=distance(before,game.player);steps++;
    }
  }
  return {steps,distance:total,exitDistance:distance(game.player,game.geometry.exitPoint),route,legalChecks:steps};
}

export function stageEvidenceGame(node,emit=()=>{}) {
  const events=[],game=localGame(node,e=>{events.push(e);emit(e);});
  const route=routeToExit(game);
  // Stage centrally on the verified legal route, not on top of authored cover.
  Object.assign(game.player,route[Math.floor(route.length/2)]);
  const staged=[];
  for(const range of [160,220,280]) for(let i=0;i<16&&staged.length<3;i++) {
    const angle=i*Math.PI/8,p={x:game.player.x+Math.cos(angle)*range,y:game.player.y+Math.sin(angle)*range};
    const radius=ENEMIES.brute.radius;
    if(!canOccupyExpedition(game.geometry,p,radius)||!hasClearExpeditionShot(game.geometry,game.player,p)||staged.some(e=>distance(e,p)<radius*2+16))continue;
    const result=game.enemies.spawn('brute',p.x,p.y,false);
    if(result.spawned)staged.push({...p,id:result.enemy.id});
  }
  check(staged.length>=2,`Cannot stage legal local combat in ${node.templateId}`);
  return {game,events,staged};
}

export function fightEvidenceGame(fixture,render=()=>{}) {
  const {game,events,staged}=fixture,initial=copy(game.player);
  const health=game.enemies.snapshot.enemies.reduce((sum,e)=>sum+e.health+e.armor,0);
  let legalChecks=0,travel=0;
  for(let frame=0;frame<180;frame++) {
    const before=copy(game.player);
    // Short real movement while aiming/firing; collision response stays authoritative.
    game.update(1000/60,{x:0,y:frame<24?.35:0,fire:true,angle:null,autoAim:true});
    travel+=distance(before,game.player);
    check(game.status==='playing','Combat fixture stopped playing');
    for(const actor of [game.player,...game.enemies.snapshot.enemies]) {
      check(canOccupyExpedition(game.geometry,actor,actor.radius),`Combat actor entered solid geometry in ${game.node.templateId}`);legalChecks++;
    }
    render(game,1/60);
    const enemies=game.enemies.snapshot.enemies;
    const shots=events.filter(e=>e.type==='shot').length;
    const damage=health-enemies.reduce((sum,e)=>sum+e.health+e.armor,0);
    const enemyDistance=enemies.reduce((sum,e)=>sum+distance(e,staged.find(s=>s.id===e.id)??e),0);
    if(frame>=24&&shots>=2&&damage>0&&enemyDistance>0&&game.bullets.some(b=>b.kind==='player')&&enemies.length>0) {
      check(travel>0,'No live player movement');
      return {steps:frame+1,deltaMs:1000/60,shots,damage,enemyDistance,playerDistance:travel,playerDisplacement:distance(initial,game.player),legalChecks,activeEnemies:enemies.length,bullets:game.bullets.length,player:copy(game.player),staged,events:events.map(e=>e.type)};
    }
  }
  throw new Error(`No active fighting capture in ${game.node.templateId}`);
}
