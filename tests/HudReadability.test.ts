import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import * as story from '../src/game/roguelike/storyRooms';
import {DepthGame} from '../src/DepthGame';

const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
describe('bright cryo floor HUD readability',()=>{
 it('backs each floating readout locally, never the full playfield',()=>{
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for(const selector of ['.vitals','.room-label','.weapon-hud','#run-stock','.desktop-hint']){
   const rule=rules.find(([,selectors,body])=>selectors.split(',').map(s=>s.trim()).includes(selector)&&body.includes('background:var(--hud-backplate)'));
   expect(rule,`${selector} needs its own dark backplate`).toBeDefined();
  }
  expect(css).toContain('--hud-backplate:#081014f2');
  expect(css).not.toMatch(/#hud\s*\{[^}]*background:/);
 });
 it('meets normal-text contrast even when the floor behind the plate is white',()=>{
  const token=css.match(/--hud-backplate:#([0-9a-f]{8})/i);
  expect(token).not.toBeNull();
  const rgba=token![1].match(/../g)!.map(v=>parseInt(v,16)),alpha=rgba[3]/255;
  const luminance=(rgb:number[])=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const background=luminance(rgba.slice(0,3).map(v=>v*alpha+255*(1-alpha)));
  for(const text of ['9cb8bf','a6c7ca','91b3b7','bbd1cf','90abaa','b9c6c5','8aa2a6']){
   const foreground=luminance(text.match(/../g)!.map(v=>parseInt(v,16)));
   expect((foreground+.05)/(background+.05),text).toBeGreaterThanOrEqual(4.5);
  }
 });
});
describe('short non-blocking story HUD',()=>{
 it('separates essential status, immediate objective, and optional AI instruction',()=>{
  expect(story).toHaveProperty('conciseStoryStatus');
  const g=new DepthGame();g.newRun(137);
  expect(story.conciseStoryStatus(g.storyStatus)).toBe('Passengers alive · AI promises survival');
  expect(g.storyRoom?.objective).toBe('Restore communications.');
  expect(g.storyPresentation).toBe('AI: Purge the infestation.');
  expect(main).toContain("el('story-status').textContent=conciseStoryStatus(game.storyStatus)");
  const status=story.conciseStoryStatus(g.storyStatus),objective=g.storyRoom?.objective;
  g.skipStory();expect(g.storyPresentation).toBeUndefined();
  expect(story.conciseStoryStatus(g.storyStatus)).toBe(status);
  expect(g.storyRoom?.objective).toBe(objective);expect(g.authorizeDestruction()).toBe(false);
 });
 it('keeps warning, fatal cost and proof of the lie at their existing reveal stages',()=>{
  expect(story).toHaveProperty('conciseStoryStatus');
  const warning=story.conciseStoryStatus('WARNING RECEIVED / NEW EARTH PREPARING FOR WAR / PASSENGERS ALIVE');
  expect(warning).toBe('New Earth warned · Passengers alive');expect(warning).not.toMatch(/AI knew|kills/i);
  const cost=story.conciseStoryStatus('WARNING RECEIVED / NEW EARTH PREPARING FOR WAR / SERVICE DISPLAY: PURGE DESTROYS OCCUPIED CRYO DECKS.');
  expect(cost).toContain('Purge kills everyone');expect(cost).not.toContain('AI knew');
  const lie=story.conciseStoryStatus('NEW EARTH WARNED / PASSENGERS ALIVE / AI LIED. THE PURGE KILLS EVERYONE. LOCAL RECORD: AI KNEW BEFORE AWAKENING.');
  expect(lie).toContain('AI knew before awakening');expect(lie).toContain('Passengers alive');expect(lie).toContain('Purge kills everyone');
  expect(story.conciseStoryStatus(story.SACRIFICE_ENDING)).toBe(story.SACRIFICE_ENDING);
 });
});
