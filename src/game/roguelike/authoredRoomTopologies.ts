import type {Point, RoomTemplate} from './types';
import type {StoryTemplateId} from './storyRooms';

const polygon=(vertices:readonly (readonly [number,number])[]):readonly Point[]=>Object.freeze(vertices.map(([x,y])=>Object.freeze({x,y})));
type Topology=Pick<RoomTemplate,'boundary'|'voids'|'spawn'|'exit'|'breaches'|'obstacles'>;
/** Shared floor/collision contract. Voids are sealed solid silhouettes, never jump gaps.
 * Width/height remain the camera envelope. Only these three v3 rooms opt in. */
export const AUTHORED_ROOM_TOPOLOGIES:Readonly<Partial<Record<StoryTemplateId,Topology>>>=Object.freeze({
 'passenger-vault':Object.freeze({
  boundary:polygon([[80,220],[260,40],[820,40],[1100,220],[1180,440],[1100,660],[820,840],[260,840],[40,620],[40,300]]),
  // The exposed 160-wide cross-aisle cuts between two cryo banks. The covered
  // crescent follows the broad outer balcony, with no single mandatory choke.
  voids:Object.freeze([polygon([[400,240],[760,200],[940,320],[940,360],[400,360]]),polygon([[400,520],[940,520],[940,560],[760,680],[400,640]])]),
  spawn:Object.freeze({x:100,y:440}),exit:Object.freeze({x:1100,y:440}),
  breaches:polygon([[260,140],[980,200],[260,740],[980,680]]),
  obstacles:Object.freeze([{x:230,y:290,width:70,height:80},{x:230,y:520,width:70,height:80}].map(rect=>Object.freeze(rect))),
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
