import {describe,it,expect} from 'vitest';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
import {generateRun} from '../src/game/roguelike/run';
import contour from './fixtures/navigation-wide-room16.json';
// Rejected Room16 art outline is only a deterministic navigation fixture. This
// radius38 probe is conservative coverage, not a claim that standard enemies
// currently have that radius (their maximum is28).
const node=generateRun(1729,3).nodes.find(n=>n.templateId==='swarm-junction')!;
const geometry={...createExpeditionGeometry(node),blockers:[],voids:[contour]};
const pairs=[[{x:460,y:340},{x:450,y:100}],[{x:780,y:300},{x:740,y:80}],[{x:510,y:440},{x:710,y:440}]] as const;
describe('navigation clearance',()=>{
 for(const radius of [14,18,24,28,38])it(`uses legal cells and sweeps for radius${radius}`,()=>{
  for(const[start,goal]of pairs){
   const nav=new FacilityNavigation(geometry),p={...start,radius};
   expect(canOccupyExpedition(geometry,p,radius)).toBe(true);expect(canOccupyExpedition(geometry,goal,radius)).toBe(true);
   for(let i=0;i<900&&Math.hypot(p.x-goal.x,p.y-goal.y)>4;i++){
    const q=nav.waypoint(p,goal,1)??goal,d=Math.hypot(q.x-p.x,q.y-p.y),step=Math.min(8,d);
    if(d<1e-8)break;
    const next={x:p.x+(q.x-p.x)*step/d,y:p.y+(q.y-p.y)*step/d};
    expect(canTraverseExpedition(geometry,p,next,radius)).toBe(true);Object.assign(p,next);
   }
   expect(Math.hypot(p.x-goal.x,p.y-goal.y),JSON.stringify(start)).toBeLessThanOrEqual(4);
  }
 });
});
