import type {Rect} from './types';
/** Room9 reservations, in game units. The central south edge is inset for the y514 pistol lane. */
export const RELAY_RACKS_FOOTPRINTS:readonly Rect[]=Object.freeze([
 {x:300,y:160,width:100,height:170},
 {x:300,y:550,width:100,height:170},
 {x:800,y:160,width:100,height:170},
 {x:800,y:550,width:100,height:170},
 {x:550,y:360,width:100,height:150},
].map(r=>Object.freeze(r)));
