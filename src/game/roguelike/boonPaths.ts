import type {BuildState,MutationId} from './types';
import {MUTATION_CATALOG,type MutationDefinition} from './mutationCatalog';

/** Gameplay paths are separate from legacy family set bonuses. */
export const BOON_PATHS = [
 {name:'Cryo executioner',starter:'cryogenic',continuations:['absolute-zero', 'shattershot', 'ice-lance', 'permafrost', 'frostbite', 'frost-armor', 'glacial-wake'],sources:['cryogenic','cold-snap'],boons:['cryogenic','cold-snap','absolute-zero','shattershot','ice-lance','permafrost','frostbite','frost-armor','glacial-wake']},
 {name:'Wildfire',starter:'incendiary',continuations:['scavenger', 'combustion', 'thermal-shock'],sources:['incendiary'],boons:['incendiary','scavenger','combustion','thermal-shock']},
 {name:'Kinetic demolition',starter:'breacher',continuations:['heavy-pellets', 'chain-reaction', 'seismic-impact'],sources:['breacher'],boons:['breacher','heavy-pellets','chain-reaction','seismic-impact']},
 {name:'Reactor cycling',starter:'hot-reload',continuations:['magnetic-feed', 'reactor-cascade', 'last-shell', 'rapid-cycle'],sources:['hot-reload','magnetic-feed'],boons:['hot-reload','magnetic-feed','reactor-cascade','last-shell','rapid-cycle','crossfire']},
] as const;
export const pathFor=(id:MutationId)=>BOON_PATHS.find(p=>(p.boons as readonly string[]).includes(id));
export const activePaths=(build:BuildState)=>BOON_PATHS.filter(p=>p.sources.some(id=>build.mutations.includes(id)));
export function prerequisitesMet(m:MutationDefinition,build:BuildState){
 return (m.requires??[]).every(id=>build.mutations.includes(id))&&(!m.requiresAny?.length||m.requiresAny.some(id=>build.mutations.includes(id)));
}
export function boonHint(m:MutationDefinition,build:BuildState):string{
 const path=pathFor(m.id),sources=[...(m.requires??[]),...(m.requiresAny??[])].filter(id=>build.mutations.includes(id));
 if(sources.length)return `Works with ${sources.map(id=>MUTATION_CATALOG[id].name).join(' + ')}.`;
 if(path){const owned=path.sources.find(id=>build.mutations.includes(id));if(owned)return `Builds on ${MUTATION_CATALOG[owned].name}.`;
 const next=path.boons.find(id=>id!==m.id&&!build.mutations.includes(id)&&!prerequisitesMet(MUTATION_CATALOG[id],build)&&prerequisitesMet(MUTATION_CATALOG[id],{mutations:[...build.mutations,m.id]}));
 return next?`Opens ${MUTATION_CATALOG[next].name}.`:`${path.name}.`;}
 return 'Independent support.';
}
