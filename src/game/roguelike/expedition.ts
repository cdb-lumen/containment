import { MUTATION_CATALOG } from './mutationCatalog';
import {createRun,generateRun,clearRoom,finishReward,enterRoom,endRun,isValidRunState} from './run';
import {createBuild,addMutation,draftMutationOffers,isValidBuildState} from './builds';
import {isValidRunResources,parseCheckpoint,serializeCheckpoint} from './checkpoints';
import type {BuildState,MutationId,RunCheckpoint,RunResources,RunState} from './types';

export type Expedition = Readonly<{run:RunState;build:BuildState;resources:RunResources}>;
const resourcesCopy=(resources:RunResources):RunResources=>Object.freeze({...resources,ammo:Object.freeze(Object.fromEntries(Object.entries(resources.ammo).map(([key,ammo])=>[key,Object.freeze({...ammo})])) as RunResources['ammo'])});
function assertExpedition(expedition:Expedition):void {
  if(!expedition||!isValidRunState(expedition.run)||!isValidBuildState(expedition.build)||!isValidRunResources(expedition.resources))throw new Error('Invalid expedition');
}
function snapshot(run:RunState,build:BuildState,resources:RunResources):Expedition {
  const result=Object.freeze({
    run:Object.freeze({...run,completedNodeIds:Object.freeze([...run.completedNodeIds])}),
    build:Object.freeze({...build,mutations:Object.freeze([...build.mutations])}),
    resources:resourcesCopy(resources),
  });assertExpedition(result);return result;
}
function currentNode(expedition:Expedition){
  assertExpedition(expedition);
  return generateRun(expedition.run.seed,expedition.run.version).nodes.find(node=>node.id===expedition.run.currentNodeId)!;
}
const offerSeed=(expedition:Expedition):number=>{
  let hash=expedition.run.seed;
  for(const char of expedition.run.currentNodeId)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
  return hash;
};
export function createExpedition(seed:number,resources:RunResources):Expedition {
  if(!isValidRunResources(resources)||resources.health<=0)throw new Error('A run must start alive');
  return snapshot(createRun(seed),createBuild(),resources);
}
/** The host supplies authoritative combat resources; changing rooms never resets them. */
export function completeExpeditionRoom(expedition:Expedition,resources:RunResources):Expedition {
  assertExpedition(expedition);
  if(!isValidRunResources(resources)||resources.health<=0)throw new Error('A dead player cannot clear a room');
  return snapshot(clearRoom(expedition.run),expedition.build,resources);
}
export function expeditionRewardOffers(expedition:Expedition):ReturnType<typeof draftMutationOffers> {
  const node=currentNode(expedition);
  if(expedition.run.phase!=='reward'||!['upgrade','rare-upgrade'].includes(node.reward))return Object.freeze([]);
  let offers:ReturnType<typeof draftMutationOffers>=[],excluded:MutationId[]=[];
  for(let roll=0;roll<=(expedition.run.draftRoll??0);roll++){
    offers=draftMutationOffers((offerSeed(expedition)+Math.imul(roll,0x9e3779b9))>>>0,expedition.build,node.reward==='rare-upgrade',excluded,node.depth);
    excluded.push(...offers.map(m=>m.id));
  }
  return offers;
}
export function rerollCost(expedition:Expedition):number{return 75*((expedition.run.draftRoll??0)+1)+currentNode(expedition).depth*10;}
export function rerollExpedition(expedition:Expedition):Expedition{
 const cost=rerollCost(expedition),roll=expedition.run.draftRoll??0;
 if(expedition.run.version!==2||roll>=2||!expeditionRewardOffers(expedition).length||expedition.resources.credits<cost)throw new Error('Reroll unavailable');
 return snapshot({...expedition.run,draftRoll:roll+1},expedition.build,{...expedition.resources,credits:expedition.resources.credits-cost});
}
/** Commit a valid offered mutation and consume the reward in the same transition. */
export function claimExpeditionMutation(expedition:Expedition,id:MutationId):Expedition {
  if(!expeditionRewardOffers(expedition).some(offer=>offer.id===id))throw new Error('Mutation is not offered');
  return snapshot(finishReward(expedition.run),addMutation(expedition.build,id),expedition.resources);
}
/** Medical/supply adapters apply their receipt first; this boundary commits it once. */
export function claimExpeditionResources(expedition:Expedition,resources:RunResources):Expedition {
  const node=currentNode(expedition);
  if(expedition.run.phase!=='reward'||!['healing','supplies'].includes(node.reward))throw new Error('No resource reward is pending');
  if(!isValidRunResources(resources)||resources.health<=0)throw new Error('Invalid resource receipt');
  return snapshot(finishReward(expedition.run),expedition.build,resources);
}
export function chooseExpeditionRoute(expedition:Expedition,nodeId:string):Expedition {
  assertExpedition(expedition);return snapshot(enterRoom(expedition.run,nodeId),expedition.build,expedition.resources);
}
export function defeatExpedition(expedition:Expedition):Expedition {
  assertExpedition(expedition);return snapshot(endRun(expedition.run),expedition.build,expedition.resources);
}
export function expeditionCheckpoint(expedition:Expedition,savedAt:number):RunCheckpoint {
  assertExpedition(expedition);
  const checkpoint:RunCheckpoint={version:1,savedAt,...expedition};
  const serialized=serializeCheckpoint(checkpoint);if(!serialized)throw new Error('Expedition is not at a save boundary');
  return parseCheckpoint(serialized)!;
}
export function restoreExpedition(checkpoint:RunCheckpoint):Expedition {
  const serialized=serializeCheckpoint(checkpoint);if(!serialized)throw new Error('Invalid checkpoint');
  const valid=parseCheckpoint(serialized)!;return snapshot(valid.run,valid.build,valid.resources);
}
