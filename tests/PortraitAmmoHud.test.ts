import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
describe('narrow portrait ammunition clearance',()=>{
 it('lowers only the portrait ammunition panel without shrinking controls or hiding information',()=>{
  const rule=css.match(/@media\s*\(max-width:700px\)\s*and\s*\(orientation:portrait\)\s*\{\s*\.weapon-hud\s*\{([^}]+)\}\s*\}/);
  expect(rule).not.toBeNull();
  expect(rule![1].trim()).toBe('bottom:max(244px,calc(env(safe-area-inset-bottom) + 186px));');
 });
});
