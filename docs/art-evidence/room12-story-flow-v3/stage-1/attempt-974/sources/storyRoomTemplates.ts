import {ROOM_STORY_ROUTE,type StoryTemplateId} from './storyRooms';
import type {Rect,RoomTemplate} from './types';
import {AUTHORED_ROOM_TOPOLOGIES} from './authoredRoomTopologies';

/** Authored collision silhouettes, not recolors of a single room. All lanes support radius 28. */
const footprints:Readonly<Record<StoryTemplateId,readonly (readonly [number,number,number,number])[]>>={
 'awakening-bay':[[300,200,180,120],[720,200,180,120],[340,580,140,100]],
 'passenger-vault':[[300,180,100,500],[550,180,100,220],[550,500,100,180],[800,180,100,500]],
 'residential-gallery':[[280,160,240,100],[280,520,120,200],[650,270,260,100],[780,570,140,150]],
 'communal-atrium':[[450,310,300,260],[260,160,120,100],[830,610,120,100]],
 'crew-checkpoint':[[300,150,80,400],[690,340,80,390],[510,180,160,80]],
 'armory':[[280,180,280,100],[740,180,180,100],[280,600,180,100],[740,530,180,170]],
 'freight-hold':[[280,180,260,180],[670,180,260,180],[280,520,260,180],[670,520,260,180]],
 'breached-loading-bay':[[280,190,380,130],[720,550,240,180],[300,580,180,110]],
 'relay-racks':[[300,160,100,530],[540,300,100,420],[800,160,100,500]],
 'transmission-chamber':[[480,260,240,180],[290,580,180,100],[770,580,180,100]],
 'diagnostic-gallery':[[280,220,260,90],[280,580,260,90],[710,340,220,90],[710,590,220,90]],
 'safety-interlock-station':[[330,210,160,140],[700,210,160,140],[480,580,240,120]],
 'coolant-plant':[[300,210,150,150],[750,210,150,150],[300,540,150,150],[750,540,150,150],[550,390,100,100]],
 // Solid machine voids leave connected ordinary-floor platforms, not jump gaps.
 'service-shaft-landing':[[290,180,250,210],[660,500,250,200],[300,600,180,100]],
 'infested-workshop':[[280,220,190,140],[480,560,180,160],[700,160,130,240],[850,550,150,140]],
 'swarm-junction':[[290,200,220,130],[690,200,220,130],[450,560,300,160]],
 'shielding-gate':[[300,140,100,310],[520,590,160,150],[800,340,100,360]],
 'containment-annulus':[[470,310,260,260],[280,180,120,100],[800,180,120,100],[280,620,120,100],[800,620,120,100]],
 'manual-control-chamber':[[340,230,160,180],[700,230,160,180],[470,610,260,100]],
 'overload-floor':[[470,300,260,280],[260,170,140,100],[800,610,140,100]],
};
export const STORY_ROOM_TEMPLATES:Readonly<Record<StoryTemplateId,RoomTemplate>>=Object.freeze(Object.fromEntries(ROOM_STORY_ROUTE.map(room=>{
 const obstacles:readonly Rect[]=Object.freeze(footprints[room.templateId].map(([x,y,width,height])=>Object.freeze({x,y,width,height})));
 return [room.templateId,Object.freeze({id:room.templateId,name:room.name,width:1200,height:880,
  spawn:Object.freeze({x:100,y:440}),exit:Object.freeze({x:1100,y:440}),obstacles,
  breaches:Object.freeze([{x:100,y:100},{x:1100,y:100},{x:100,y:780},{x:1100,y:780}].map(p=>Object.freeze(p))),
  ...AUTHORED_ROOM_TOPOLOGIES[room.templateId],
 })];
})) as Record<StoryTemplateId,RoomTemplate>);
