import type { RoomTemplate, TemplateId } from './types';
import {STORY_ROOM_TEMPLATES} from './storyRoomTemplates';

function template(value: RoomTemplate): RoomTemplate {
  return Object.freeze({
    ...value, spawn: Object.freeze({ ...value.spawn }), exit: Object.freeze({ ...value.exit }),
    obstacles: Object.freeze(value.obstacles.map(rect => Object.freeze({ ...rect }))),
    breaches: Object.freeze(value.breaches.map(point => Object.freeze({ ...point }))),
  });
}

const ordinary = {
  width: 1200, height: 880,
  spawn: { x: 100, y: 440 }, exit: { x: 1100, y: 440 },
  breaches: [{ x: 100, y: 100 }, { x: 1100, y: 100 }, { x: 100, y: 780 }, { x: 1100, y: 780 }],
};

/** Local coordinates for a future room host. All circulation admits radius 28.
 * Shapes are solid collision footprints; decorative geometry must stay separate.
 */
export const ROOM_TEMPLATES: Readonly<Record<TemplateId, RoomTemplate>> = Object.freeze({
  ...STORY_ROOM_TEMPLATES,
  receiving: template({
    ...ordinary, id: 'receiving', name: 'Receiving Dock',
    // Four pallet islands leave a broad opening lane and perimeter escape route.
    obstacles: [
      { x: 300, y: 200, width: 160, height: 120 }, { x: 780, y: 200, width: 160, height: 120 },
      { x: 300, y: 560, width: 160, height: 120 }, { x: 780, y: 560, width: 160, height: 120 },
    ],
  }),
  'forklift-loop': template({
    ...ordinary, id: 'forklift-loop', name: 'Forklift Loop',
    // The central loading island supports clockwise or counterclockwise kiting.
    obstacles: [
      { x: 460, y: 300, width: 280, height: 280 },
      { x: 240, y: 160, width: 120, height: 100 }, { x: 840, y: 620, width: 120, height: 100 },
    ],
  }),
  'cold-aisle': template({
    ...ordinary, id: 'cold-aisle', name: 'Cold Storage Aisles',
    // Staggered racks break sightlines; top/bottom cross-aisles prevent traps.
    obstacles: [
      { x: 320, y: 160, width: 120, height: 540 }, { x: 570, y: 280, width: 120, height: 440 },
      { x: 820, y: 160, width: 120, height: 540 },
    ],
  }),
  'freight-crossing': template({
    ...ordinary, id: 'freight-crossing', name: 'Freight Crossing',
    // A wide cross offers long firing lanes and four cover-backed corners.
    obstacles: [
      { x: 260, y: 220, width: 280, height: 120 }, { x: 660, y: 220, width: 280, height: 120 },
      { x: 260, y: 540, width: 280, height: 120 }, { x: 660, y: 540, width: 280, height: 120 },
    ],
  }),
  'pump-ring': template({
    ...ordinary, id: 'pump-ring', name: 'Coolant Pump Ring',
    // Small pumps create several short loops without narrow diagonal pinches.
    obstacles: [
      { x: 320, y: 240, width: 100, height: 100 }, { x: 780, y: 240, width: 100, height: 100 },
      { x: 320, y: 540, width: 100, height: 100 }, { x: 780, y: 540, width: 100, height: 100 },
      { x: 540, y: 380, width: 120, height: 120 },
    ],
  }),
  'specimen-bay': template({
    ...ordinary, id: 'specimen-bay', name: 'Specimen Bay',
    // Offset benches alternate open staging space with short protected approaches.
    obstacles: [
      { x: 280, y: 160, width: 220, height: 100 }, { x: 280, y: 620, width: 220, height: 100 },
      { x: 680, y: 280, width: 240, height: 100 }, { x: 680, y: 500, width: 240, height: 100 },
    ],
  }),
  'security-lock': template({
    ...ordinary, id: 'security-lock', name: 'Security Lock',
    // Offset security walls demand a turn but retain alternate perimeter passages.
    obstacles: [
      { x: 320, y: 80, width: 80, height: 480 }, { x: 720, y: 320, width: 80, height: 480 },
    ],
  }),

  'rail-depot':template({...ordinary,id:'rail-depot',name:'Rail Depot',obstacles:[
   {x:260,y:230,width:500,height:130},{x:480,y:530,width:460,height:130},{x:890,y:190,width:130,height:150}]}),
  'quarantine-cross':template({...ordinary,id:'quarantine-cross',name:'Quarantine Transfer',obstacles:[
   {x:300,y:180,width:170,height:170},{x:730,y:180,width:170,height:170},{x:300,y:530,width:170,height:170},{x:730,y:530,width:170,height:170}]}),
  'cryo-gallery':template({...ordinary,id:'cryo-gallery',name:'Cryogenic Gallery',obstacles:[
   {x:300,y:200,width:100,height:450},{x:540,y:100,width:120,height:250},{x:540,y:530,width:120,height:250},{x:800,y:230,width:100,height:450}]}),
  filtration:template({...ordinary,id:'filtration',name:'Filtration Works',obstacles:[
   {x:280,y:230,width:150,height:150},{x:540,y:440,width:150,height:150},{x:800,y:230,width:150,height:150},{x:800,y:630,width:150,height:100}]}),
  'turbine-hall':template({...ordinary,id:'turbine-hall',name:'Turbine Hall',obstacles:[
   {x:340,y:240,width:200,height:340},{x:680,y:240,width:200,height:340}]}),
  'waste-processing':template({...ordinary,id:'waste-processing',name:'Waste Processing',obstacles:[
   {x:270,y:180,width:290,height:100},{x:720,y:160,width:120,height:270},{x:370,y:530,width:120,height:200},{x:680,y:600,width:290,height:100}]}),
  'power-conduits':template({...ordinary,id:'power-conduits',name:'Power Conduits',obstacles:[
   {x:280,y:180,width:120,height:440},{x:540,y:320,width:120,height:420},{x:810,y:140,width:120,height:440}]}),
  'hive-approach':template({...ordinary,id:'hive-approach',name:'Hive Approach',obstacles:[
   {x:280,y:230,width:170,height:120},{x:460,y:570,width:170,height:120},{x:690,y:180,width:130,height:230},{x:840,y:560,width:170,height:120}]}),
  'reactor-vault': template({
    id: 'reactor-vault', name: 'Reactor Vault', width: 1440, height: 1080,
    spawn: { x: 100, y: 540 }, exit: { x: 1340, y: 540 },
    breaches: [{ x: 100, y: 100 }, { x: 1340, y: 100 }, { x: 100, y: 980 }, { x: 1340, y: 980 }],
    // The largest room reserves an open central arena and a continuous outer ring.
    obstacles: [
      { x: 300, y: 220, width: 200, height: 120 }, { x: 940, y: 220, width: 200, height: 120 },
      { x: 300, y: 740, width: 200, height: 120 }, { x: 940, y: 740, width: 200, height: 120 },
    ],
  }),
});
