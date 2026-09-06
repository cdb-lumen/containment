/** Serializable contracts shared by generation, build resolution and checkpoints. */
export type RoomKind = 'combat' | 'medical' | 'armory' | 'elite' | 'boss';
import type {StoryTemplateId} from './storyRooms';
export type TemplateId = StoryTemplateId | 'receiving' | 'forklift-loop' | 'cold-aisle' | 'freight-crossing' | 'pump-ring' | 'specimen-bay' | 'security-lock' | 'reactor-vault'|'rail-depot'|'quarantine-cross'|'cryo-gallery'|'filtration'|'turbine-hall'|'waste-processing'|'power-conduits'|'hive-approach';
export type Point = Readonly<{x:number;y:number}>;
export type Rect = Point & Readonly<{width:number;height:number}>;
export type RoomTemplate = Readonly<{id:TemplateId;name:string;width:number;height:number;spawn:Point;exit:Point;obstacles:readonly Rect[];breaches:readonly Point[]}>;
export type RunNode = Readonly<{id:string;depth:number;kind:RoomKind;templateId:TemplateId;next:readonly string[];reward:'upgrade'|'healing'|'supplies'|'rare-upgrade'|'victory'}>;
export type RunGraph = Readonly<{seed:number;nodes:readonly RunNode[];startId:string;bossId:string}>;
export type RunPhase = 'combat'|'reward'|'route'|'complete'|'dead';
export type RunState = Readonly<{version:1|2|3;seed:number;currentNodeId:string;completedNodeIds:readonly string[];phase:RunPhase;draftRoll?:number}>;
export type MutationId = 'breacher'|'heavy-pellets'|'chain-reaction'|'volatile-remains'|'cryogenic'|'shattershot'|'scavenger'|'blood-price'|'hot-reload'|'last-shell'|'magnetic-feed'|'field-medic'|'piercing-rounds'|'pressure-point'|'seismic-impact'|'permafrost'|'cold-snap'|'frost-armor'|'arc-filament'|'conductive-shell'|'incendiary'|'rapid-cycle'|'leech-rounds'|'emergency-plating'|'ricochet-rounds'|'concussion-rounds'|'executioner'|'first-impact'|'crossfire'|'fragmentation'|'absolute-zero'|'ice-lance'|'frostbite'|'thermal-shock'|'glacial-wake'|'cryo-conductor'|'caustic-rounds'|'toxic-bloom'|'combustion'|'ball-lightning'|'aftershock'|'reactor-cascade'|'siphon-shells'|'combat-medic'|'reactive-barrier'|'salvage-engine'|'blood-capacitor'|'shock-absorber';
export type BuildState = Readonly<{mutations:readonly MutationId[]}>;
export type RunResources = Readonly<{health:number;armor:number;credits:number;grenades:number;medkits:number;weapon:'pistol'|'rifle'|'shotgun'|'plasma'|'rocket';ammo:Readonly<Record<'pistol'|'rifle'|'shotgun'|'plasma'|'rocket',Readonly<{magazine:number;reserve:number}>>>}>;
export type RunCheckpoint = Readonly<{version:1;savedAt:number;run:RunState;build:BuildState;resources:RunResources}>;
