import { describe, expect, it } from 'vitest';
import { EffectsSystem } from '../../src/game/effects/EffectsSystem';
import { DeathVisualView } from '../../src/game/effects/DeathVisualView';

class FakeImage {
  active=true; visible=true; texture=''; frame: number|undefined; x=0; y=0; tint?:number; alpha=1; scaleX=1; scaleY=1; rotation=0; flipX=false; flipY=false; depth=0;
  setTexture(v:string, f?:number){this.texture=v;this.frame=f;return this} setFrame(v:number){this.frame=v;return this}
  setPosition(x:number,y:number){this.x=x;this.y=y;return this} setTint(v:number){this.tint=v;return this} clearTint(){this.tint=undefined;return this}
  setAlpha(v:number){this.alpha=v;return this} setScale(x:number,y=x){this.scaleX=x;this.scaleY=y;return this} setRotation(v:number){this.rotation=v;return this}
  setFlip(x:boolean,y:boolean){this.flipX=x;this.flipY=y;return this} setDepth(v:number){this.depth=v;return this} setActive(v:boolean){this.active=v;return this} setVisible(v:boolean){this.visible=v;return this}
}
const setup=(loaded=true)=>{const images:FakeImage[]=[]; const effects=new EffectsSystem('high'); const view=new DeathVisualView({effects,hasTexture:(k)=>loaded && (k==='skin-crawler'||k==='blood-decals'),createImage:()=>{const i=new FakeImage();images.push(i);return i as never}}); return {images,effects,view}};

describe('DeathVisualView',()=>{
 it('admits one blood decal and corpse with family assets and deterministic static variation',()=>{const {view,effects}=setup(); expect(view.spawnDeath({family:'crawler',x:10,y:20})).toBe(true); expect(effects.count('decals')).toBe(1);expect(effects.count('remains')).toBe(1); const s=view.snapshot; expect(s.blood[0]).toMatchObject({texture:'blood-decals'});expect(s.corpses[0]).toMatchObject({texture:'skin-crawler',frame:6}); expect(s.blood[0]?.rotation).toBe(view.snapshot.blood[0]?.rotation)});
 it('uses frameless tinted fallbacks and rejects invalid coordinates without records',()=>{const {view,effects}=setup(false);expect(view.spawnDeath({family:'spitter',x:1,y:2})).toBe(true);expect(view.snapshot.blood[0]).toMatchObject({frame:undefined,tint:0xd8d94a});expect(view.spawnDeath({family:'crawler',x:NaN,y:2})).toBe(false);expect(effects.count('remains')).toBe(1)});
 it('shares caps, reconciles retirement and profile trim, and never allocates beyond 32/128',()=>{const {view,images,effects}=setup();for(let i=0;i<300;i++)view.spawnDeath({family:'crawler',x:i,y:i,major:i===0});expect(images.length).toBeLessThanOrEqual(160);expect(view.snapshot.corpses.length).toBe(32);expect(view.snapshot.blood.length).toBe(128);effects.setProfile('low');view.syncRetainedIds();expect(view.snapshot.corpses.length).toBe(8);expect(view.snapshot.blood.length).toBe(32)});
 it('fully resets reused slots and supports blood-only retained corpse owners',()=>{const {view,effects}=setup(false);view.spawnDeath({family:'spitter',x:1,y:2,elite:true,rotation:2}); const ids=effects.snapshot('remains').map(x=>x.id);effects.remove(ids[0]!);view.syncRetainedIds();view.spawnBlood({family:'marine',x:3,y:4});expect(view.snapshot.blood.at(-1)).toMatchObject({tint:0x9b2027,x:3,y:4});view.clear(true);expect(view.snapshot.blood).toHaveLength(0);expect(view.snapshot.corpses).toHaveLength(0)});
 it('drops bookkeeping without mutating displays at shutdown',()=>{const {view,images}=setup();view.spawnDeath({family:'crawler',x:1,y:2});view.clear(false);expect(images.every(i=>i.active)).toBe(true);expect(view.snapshot.corpses).toHaveLength(0)});
});
