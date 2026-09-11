import type {Point, RoomTemplate} from './types';
import type {StoryTemplateId} from './storyRooms';

const polygon=(vertices:readonly (readonly [number,number])[]):readonly Point[]=>Object.freeze(vertices.map(([x,y])=>Object.freeze({x,y})));
/** Stable story roles; these same footprints drive solids and neutral meshes. */
export const AWAKENING_BLOCKOUT=Object.freeze([
 {id:'player-release',x:90,y:380,w:90,h:120},
 {id:'bank-north',x:440,y:240,w:400,h:110},
 {id:'bank-south',x:440,y:530,w:400,h:110},
 {id:'supply-wall',x:400,y:90,w:500,h:50},
 {id:'monitoring-recovery',x:160,y:650,w:130,h:100},
 {id:'interrupted-service',x:1040,y:650,w:70,h:100},
].map(({id,x,y,w,h})=>Object.freeze({id,footprint:polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]])})));
/** Detail-stage reservations, NOT collision geometry or new interactions.
 * XY and elevation are game units above deck. Sweeps include handles/rail feet.
 * Solid detail must stay in its owning AWAKENING_BLOCKOUT footprint. Access
 * reservations remain walkable; never append them to topology voids. */
export type AwakeningFunctionalEnvelope=Readonly<{
 id:string;fixture:string;kind:'contained-sweep'|'access'|'contained-kit';
 bounds:Readonly<{x:number;y:number;w:number;h:number}>;maxHeight:number;contract:string;
}>;
export const AWAKENING_FUNCTIONAL_ENVELOPES:readonly AwakeningFunctionalEnvelope[]=Object.freeze(([
 {id:'release-lid',fixture:'player-release',kind:'contained-sweep',bounds:{x:94,y:383,w:82,h:114},maxHeight:40,contract:'Telescoping lid retracts north inside tray footprint; parked y383–405. No outward hinge sweep.'},
 {id:'release-rail',fixture:'player-release',kind:'contained-kit',bounds:{x:92,y:383,w:8,h:114},maxHeight:30,contract:'West rail with feet inside solid. East side y405–475 is the unobstructed release gap.'},
 {id:'landing',fixture:'player-release',kind:'access',bounds:{x:180,y:380,w:58,h:120},maxHeight:.6,contract:'Flush walkable landing, no lip, steps or rail across east exit. Spawn 230/440.'},
 {id:'monitor',fixture:'monitoring-recovery',kind:'contained-kit',bounds:{x:173,y:664,w:62,h:37},maxHeight:40,contract:'North working face y664, controls at height 34. Mount on cabinet, no floating screen.'},
 {id:'operator',fixture:'monitoring-recovery',kind:'access',bounds:{x:176,y:582,w:56,h:56},maxHeight:64,contract:'Standing center 204/610 radius28 faces south; 54 units to controls. Approach from landing via x204/y610.'},
 {id:'seat-pullback',fixture:'monitoring-recovery',kind:'contained-sweep',bounds:{x:186,y:704,w:36,h:44},maxHeight:38,contract:'Seat height23; back/feet and southward pull-back end at y748 inside island. No new sit interaction.'},
 {id:'seat-access',fixture:'monitoring-recovery',kind:'access',bounds:{x:176,y:762,w:56,h:56},maxHeight:64,contract:'Standing center 204/790 faces north. Reach south seat edge; approach around west side x120.'},
 {id:'locker-door',fixture:'monitoring-recovery',kind:'contained-sweep',bounds:{x:252,y:656,w:36,h:88},maxHeight:48,contract:'East-facing sliding door and recessed handle, no hinged swing into aisle. Entire travel remains inside island.'},
 {id:'locker-access',fixture:'monitoring-recovery',kind:'access',bounds:{x:302,y:672,w:56,h:56},maxHeight:64,contract:'Standing center 330/700 faces west; 42 units to door. Approach from x350 center cross-aisle.'},
 {id:'cabinet-door',fixture:'interrupted-service',kind:'contained-sweep',bounds:{x:1044,y:658,w:62,h:47},maxHeight:48,contract:'West-facing split folding door parked ajar inside reserved sweep, including handle. Technician stands west, no swing toward x960 route.'},
 {id:'technician',fixture:'interrupted-service',kind:'access',bounds:{x:972,y:650,w:56,h:56},maxHeight:64,contract:'Standing center 1000/678 faces east; 44 units to cabinet working face. Unattended satellite supply station, not bedside monitor kit.'},
 {id:'trolley',fixture:'interrupted-service',kind:'contained-kit',bounds:{x:1044,y:710,w:62,h:36},maxHeight:34,contract:'Tray height18; wheels touch deck, handle included. Detail-stage parked center1079/728, +4 east of aligned storage1075/728; no aisle overhang.'},
] satisfies AwakeningFunctionalEnvelope[]).map(e=>Object.freeze({...e,bounds:Object.freeze(e.bounds)})));
/** Reviewed neutral Passenger Vault reservations. Sealed floor-mounted solids,
 * not wells. Dimensions and heights are game units; chambers stay single-tier. */
export const PASSENGER_BLOCKOUT=Object.freeze([
 {id:'A',x:320,y:240,w:200,h:120,height:40,row:true},
 {id:'B',x:680,y:240,w:200,h:120,height:40,row:true},
 {id:'C',x:320,y:520,w:200,h:120,height:40,row:true},
 {id:'D4',x:680,y:520,w:200,h:120,height:40,row:true},
 {id:'SN',x:300,y:40,w:600,h:80,height:48,row:false},
 {id:'SS',x:300,y:760,w:600,h:80,height:32,row:false},
 {id:'MN',x:1040,y:240,w:120,h:80,height:40,row:false},
 {id:'MS',x:1002.55,y:479.35,w:87.45,h:38.63,height:58.34,row:false},
].map(({x,y,w,h,...role})=>Object.freeze({...role,footprint:polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]])})));
/** Room 4 social-frontage rough hypothesis, not visual acceptance.
 * A low shared back connects seating, small shared surfaces and planting.
 * Circulation goes around both ends, never through the solid frontage.
 * These footprints drive both rendering and collision. */
export const COMMUNAL_ATRIUM_BLOCKOUT=Object.freeze([
 {id:'common-low-back',kind:'back',x:180,y:330,w:720,h:12},
 ...[180,300,420,540,660,780].map(x=>({id:`seat-${x}`,kind:'seat-north',x,y:342,w:96,h:28})),
 ...[276,396,516,636,756,876].map(x=>({id:`shared-surface-${x}`,kind:'table',x,y:342,w:24,h:36})),
 ...[180,420,660].map(x=>({id:`garden-${x}`,kind:'garden',x,y:286,w:96,h:44})),
 {id:'attached-water',kind:'water',x:900,y:310,w:60,h:68},
].map(({x,y,w,h,...role})=>Object.freeze({...role,x,y,w,h,footprint:polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]])})));
type Topology=Pick<RoomTemplate,'boundary'|'voids'|'spawn'|'exit'|'breaches'|'obstacles'>;
/** Shared floor/collision contract. Voids are sealed solid silhouettes, never jump gaps.
 * Width/height remain the camera envelope. Only explicitly listed rooms opt in. */
export const AUTHORED_ROOM_TOPOLOGIES:Readonly<Partial<Record<StoryTemplateId,Topology>>>=Object.freeze({
 'awakening-bay':Object.freeze({
  boundary:polygon([[80,40],[1120,40],[1160,80],[1160,800],[1120,840],[80,840],[40,800],[40,80]]),
  // Straight banks leave a 180-unit center aisle and connected outer routes.
  voids:Object.freeze(AWAKENING_BLOCKOUT.map(f=>f.footprint)),
  spawn:Object.freeze({x:230,y:440}),exit:Object.freeze({x:1080,y:440}),
  breaches:polygon([[350,190],[1000,190],[350,730],[1000,550]]),obstacles:Object.freeze([]),
 }),
 'passenger-vault':Object.freeze({
  boundary:polygon([[40,40],[1160,40],[1160,840],[40,840]]),
  voids:Object.freeze(PASSENGER_BLOCKOUT.map(f=>f.footprint)),
  spawn:Object.freeze({x:100,y:440}),exit:Object.freeze({x:1100,y:440}),
  // Production east/west facing adds +/-56 along the clear rear aisles.
  breaches:polygon([[260,180],[960,180],[260,700],[960,700]]),
  obstacles:Object.freeze([]),
 }),
 'communal-atrium':Object.freeze({
  // Bring the existing straight south enclosure to the passage, rather than
  // retaining an unused second room of floor behind the circulation band.
  boundary:polygon([[0,0],[1200,0],[1200,580],[0,580]]),
  voids:Object.freeze(COMMUNAL_ATRIUM_BLOCKOUT.map(f=>f.footprint)),
  spawn:Object.freeze({x:100,y:440}),exit:Object.freeze({x:1100,y:440}),
  breaches:polygon([[100,100],[1100,100],[100,500],[1100,500]]),
  obstacles:Object.freeze([]),
 }),
 'breached-loading-bay':Object.freeze({
  boundary:polygon([[40,200],[760,40],[1160,160],[1160,640],[860,840],[280,840],[40,600]]),
  // Diagonal lodged hull penetrator divides unequal lobes. Both ends admit
  // larger enemies; the south route is spacious, the north route more direct.
  voids:Object.freeze([polygon([[440,300],[610,220],[940,460],[820,570],[560,470]])]),
  spawn:Object.freeze({x:140,y:440}),exit:Object.freeze({x:1080,y:520}),
  breaches:polygon([[220,260],[1000,240],[300,740],[860,720]]),
  obstacles:Object.freeze([{x:300,y:600,width:100,height:70}].map(rect=>Object.freeze(rect))),
 }),
 'overload-floor':Object.freeze({
  boundary:polygon([[40,320],[180,200],[360,200],[420,40],[780,40],[840,200],[1020,200],[1160,320],[1160,680],[1000,820],[800,820],[720,720],[480,720],[400,820],[200,820],[40,680]]),
  voids:Object.freeze([polygon([[470,300],[730,300],[790,400],[730,560],[470,560],[410,400]])]),
  spawn:Object.freeze({x:140,y:440}),
  // Compatibility anchor only. The story finale has no route or escape.
  exit:Object.freeze({x:1060,y:440}),
  breaches:polygon([[240,320],[960,320],[240,680],[960,680]]),obstacles:Object.freeze([]),
 }),
});
