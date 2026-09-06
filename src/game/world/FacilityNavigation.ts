import { segmentIntersectsRect } from '../input/aimAssist';
import { circleBlocked, facilityBlockers } from './facilityGeometry';
import type { FacilityPoint, FacilityRect } from './facilityLayout';
import {clearPolygonTopology,type PolygonTopology} from './polygonGeometry';
const CELL=32,COLS=80,ROWS=45,COUNT=COLS*ROWS;
export type NavigationGeometry = Readonly<{bounds:FacilityRect;blockers:readonly FacilityRect[]}> & PolygonTopology;
const point=(id:number):FacilityPoint=>({x:(id%COLS+.5)*CELL,y:(Math.floor(id/COLS)+.5)*CELL});
const index=(p:FacilityPoint)=>Math.max(0,Math.min(ROWS-1,Math.floor(p.y/CELL)))*COLS+Math.max(0,Math.min(COLS-1,Math.floor(p.x/CELL)));
const adjacency=Array.from({length:COUNT},(_,id)=>[id%COLS>0?id-1:-1,id%COLS<COLS-1?id+1:-1,id>=COLS?id-COLS:-1,id<COUNT-COLS?id+COLS:-1].filter(i=>i>=0));
const neighbors=(id:number)=>adjacency[id];
/** A shared reverse BFS amortizes route finding across the horde. Local steering
 * still handles other enemies. Clearance covers the largest standard enemy. */
export class FacilityNavigation {
  constructor(private readonly geometry?:NavigationGeometry) {}
  private wave=-1;private goal=-1;private playerCell=-1;private walls:readonly FacilityRect[]=[];
  private walkable=new Uint8Array(COUNT);private distance=new Int32Array(COUNT);private queue=new Int32Array(COUNT);private expanded=new Map<number,readonly FacilityRect[]>();
  private clear(a:FacilityPoint,b:FacilityPoint,radius:number):boolean {
    if(this.geometry&&!clearPolygonTopology(this.geometry,a,b,radius))return false;
    let walls=this.expanded.get(radius);if(!walls){walls=this.walls.map(r=>({x:r.x-radius,y:r.y-radius,width:r.width+radius*2,height:r.height+radius*2}));this.expanded.set(radius,walls);}
    for(const r of walls)if(segmentIntersectsRect(a,b,r))return false;return true;
  }
  private closest(p:FacilityPoint,reachable=false):number {
    const center=index(p);let best=-1,score=Infinity;
    for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){
      const col=center%COLS+x,row=Math.floor(center/COLS)+y;if(col<0||col>=COLS||row<0||row>=ROWS)continue;
      const id=row*COLS+col;if(!this.walkable[id]||(reachable&&this.distance[id]<0))continue;
      const q=point(id),d=(p.x-q.x)**2+(p.y-q.y)**2;
      if(d<score&&this.clear(p,q,12)){score=d;best=id;}
    }return best;
  }
  prepare(player:FacilityPoint,wave:number):void {
    const cell=index(player);if(wave===this.wave&&cell===this.playerCell)return;this.playerCell=cell;
    if(wave!==this.wave){this.expanded.clear();this.wave=wave;this.goal=-1;this.walls=this.geometry?.blockers ?? facilityBlockers(wave);for(let i=0;i<COUNT;i++){const p=point(i),b=this.geometry?.bounds;const inside=b?p.x>=b.x+30&&p.y>=b.y+30&&p.x<=b.x+b.width-30&&p.y<=b.y+b.height-30:!circleBlocked(p,30,[]);this.walkable[i]=inside&&this.clear(p,p,30)?1:0;}}
    const goal=this.closest(player);if(goal===this.goal)return;this.goal=goal;this.distance.fill(-1);if(goal<0)return;
    const queue=this.queue;let head=0,tail=1;queue[0]=goal;this.distance[goal]=0;
    while(head<tail){const current=queue[head++]!;for(const next of neighbors(current)){if(!this.walkable[next]||this.distance[next]>=0)continue;this.distance[next]=this.distance[current]!+1;queue[tail++]=next;}}
  }
  waypoint(enemy:FacilityPoint & {radius:number},player:FacilityPoint,wave:number):FacilityPoint|null {
    this.prepare(player,wave);
    if(this.clear(enemy,player,enemy.radius+2))return null;
    let current=this.closest(enemy,true);if(current<0)return enemy;
    let target=point(current);
    for(let n=0;n<7;n++){
      let next:number|undefined,best=this.distance[current];for(const candidate of neighbors(current)){const d=this.distance[candidate];if(d>=0&&d<best){next=candidate;best=d;}}
      if(next===undefined)break;
      const candidate=point(next);if(!this.clear(enemy,candidate,enemy.radius+2))break;
      current=next;target=candidate;
    }return target;
  }
  reachable(p:FacilityPoint):boolean {return this.closest(p,true)>=0;}
}
