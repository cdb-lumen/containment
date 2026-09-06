import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {draftMutationOffers} from '../src/game/roguelike/builds';
import {BOON_PATHS,activePaths,boonHint,prerequisitesMet} from '../src/game/roguelike/boonPaths';
import {MUTATION_CATALOG as catalog,MUTATION_IDS} from '../src/game/roguelike/mutationCatalog';
import type {BuildState,MutationId} from '../src/game/roguelike/types';
const build=(...mutations:MutationId[]):BuildState=>({mutations});
describe('useful boon offers',()=>{
 it('reserves a continuation and an alternative path, including rerolls',()=>{
  for(const path of BOON_PATHS)for(let seed=0;seed<64;seed++)for(const rare of [false,true]){
   const b=build(path.starter),first=draftMutationOffers(seed,b,rare),offers=draftMutationOffers(seed+1,b,rare,first.map(m=>m.id),4);
   expect(offers.some(m=>(path.boons as readonly string[]).includes(m.id))).toBe(true);
   expect(offers.some(m=>BOON_PATHS.some(p=>p.starter!==path.starter&&p.starter===m.id))).toBe(true);
   expect(offers.every(m=>prerequisitesMet(m,b)&&!b.mutations.includes(m.id))).toBe(true);
   expect(new Set(offers.map(m=>m.id)).size).toBe(3);
   if(rare)expect(offers.some(m=>m.rarity==='rare')).toBe(true);
   expect(offers).toEqual(draftMutationOffers(seed+1,b,rare,first.map(m=>m.id),4));
  }
 });
 it('uses Cold Snap for all chill combinations and requires their other ingredient',()=>{
  for(const id of ['thermal-shock','cryo-conductor'] as const){
   const other=id==='thermal-shock'?'incendiary':'arc-filament';
   expect(prerequisitesMet(catalog[id],build('cold-snap',other))).toBe(true);
   expect(prerequisitesMet(catalog[id],build('cold-snap'))).toBe(false);
  }
  expect(activePaths(build('cold-snap','magnetic-feed'))).toHaveLength(2);
 });
 it('only calls a boon an unlock when taking the card makes it eligible',()=>{
  expect(boonHint(catalog.cryogenic,build())).not.toContain('Cold Snap');
  expect(boonHint(catalog['heavy-pellets'],build())).not.toMatch(/^Opens/);
  for(const id of MUTATION_IDS){
   const hint=boonHint(catalog[id],build());
   if(!hint.startsWith('Opens '))continue;
   const next=MUTATION_IDS.find(n=>hint===`Opens ${catalog[n].name}.`)!;
   expect(next).toBeDefined();expect(prerequisitesMet(catalog[next],build())).toBe(false);
   expect(prerequisitesMet(catalog[next],build(id))).toBe(true);
  }
  expect(boonHint(catalog['absolute-zero'],build('cold-snap'))).toBe('Works with Cold Snap.');
 });
 it('keeps saved IDs and marks only Blood Price as risk',()=>{
  expect(MUTATION_IDS).toHaveLength(48);
  expect(MUTATION_IDS.filter(id=>catalog[id].risk)).toEqual(['blood-price']);
 });
 it('shows path and owned synergy on reward cards without ornamental numbering',()=>{
  const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  expect(source).toContain('boonHint(m,game.expedition.build)');
  expect(source).toContain('pathFor(m.id)?.name');
  expect(source).toContain('boon-hint');expect(source).toContain('data-risk');
  expect(source).not.toContain('0${i+1}<span>${m.family}');
 });
});
