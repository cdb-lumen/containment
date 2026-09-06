/** Stable renderer/gameplay contract. Campaign order never depends on the seed. */
export type RoomEnvironment = 'cryogenics'|'habitation'|'security'|'cargo'|'communications'|'engineering'|'maintenance'|'infested'|'containment'|'reactor';
const route = [
 {templateId:'awakening-bay',name:'Awakening bay',environment:'cryogenics',objective:'Mercenary awake. Take your weapon and restore communications.',story:'AI: Purge the infestation. You and the passengers will survive.'},
 {templateId:'passenger-vault',name:'Passenger vault',environment:'cryogenics',objective:'PASSENGERS ALIVE. Clear the occupied pod rows.'},
 {templateId:'residential-gallery',name:'Residential gallery',environment:'habitation',objective:'Fight through the residential doorways.',story:'Packed belongings. Arrival labels for New Earth.'},
 {templateId:'communal-atrium',name:'Communal atrium',environment:'habitation',objective:'Clear the atrium and reach security.',story:'WELCOME TO NEW EARTH. The display still runs.'},
 {templateId:'crew-checkpoint',name:'Crew checkpoint',environment:'security',objective:'Break through the fortified checkpoint.',story:'The crew held this line. Their weapons remain.'},
 {templateId:'armory',name:'Armory',environment:'security',objective:'Defeat the armory elite. Choose combat equipment.'},
 {templateId:'freight-hold',name:'Freight hold',environment:'cargo',objective:'Clear a path through the colony supplies.'},
 {templateId:'breached-loading-bay',name:'Breached loading bay',environment:'cargo',objective:'Fight around the sealed breach.',story:'Alien growth follows the boarding scar. Hull seal intact.'},
 {templateId:'relay-racks',name:'Relay racks',environment:'communications',objective:'Clear the equipment aisles to restore the local relay.'},
 {templateId:'transmission-chamber',name:'Transmission chamber',environment:'communications',objective:'Defend the uplink until the war warning is received.'},
 {templateId:'diagnostic-gallery',name:'Diagnostic gallery',environment:'engineering',objective:'Read the independent service display while clearing the gallery.',story:'PHYSICAL SERVICE DISPLAY: Purge destroys every deck, including occupied cryopods.'},
 {templateId:'safety-interlock-station',name:'Safety-interlock station',environment:'engineering',objective:'Clear the interlock station. Review the pre-awakening safety record.',story:'LOCAL RECORD, BEFORE AWAKENING: Rescue impossible. AI acknowledged. Survival promise issued afterward.'},
 {templateId:'coolant-plant',name:'Coolant plant',environment:'maintenance',objective:'Descend through the coolant pumps, knowing the fatal cost.'},
 {templateId:'service-shaft-landing',name:'Service shaft landing',environment:'maintenance',objective:'Cross the connected service platforms. Reach the lower decks.',story:'LOCAL ACCESS ONLY. AI connection lost below this landing.'},
 {templateId:'infested-workshop',name:'Infested workshop',environment:'infested',objective:'Clear the converted workshop and its converging attackers.'},
 {templateId:'swarm-junction',name:'Swarm junction',environment:'infested',objective:'Break the concentrated swarm guarding reactor access.'},
 {templateId:'shielding-gate',name:'Shielding gate',environment:'containment',objective:'Clear the last defensive line before the reactor.'},
 {templateId:'containment-annulus',name:'Containment annulus',environment:'containment',objective:'Circle the shielding. Reach manual controls. Overload is NOT armed.',story:'PASSENGERS ALIVE. Manual authorization still required.'},
 {templateId:'manual-control-chamber',name:'Manual-control chamber',environment:'reactor',objective:'Clear threats. PASSENGERS ALIVE. Overload kills everyone aboard. Explicitly choose Destroy ship.'},
 {templateId:'overload-floor',name:'Overload floor',environment:'reactor',objective:'Defend the overload sequence. No escape. Everyone aboard will die.'},
] as const satisfies readonly {templateId:string;name:string;environment:RoomEnvironment;objective:string;story?:string}[];
export type StoryTemplateId = typeof route[number]['templateId'];
export type StoryRoom = Readonly<{templateId:StoryTemplateId;name:string;environment:RoomEnvironment;objective:string;story?:string}>;
export const ROOM_STORY_ROUTE:readonly StoryRoom[] = Object.freeze(route.map(room=>Object.freeze({...room})));
export const storyRoomFor = (templateId:string):StoryRoom|undefined=>ROOM_STORY_ROUTE.find(room=>room.templateId===templateId);
export const SACRIFICE_ENDING = 'SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED';
