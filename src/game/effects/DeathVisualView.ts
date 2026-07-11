import type { CharacterSkinId } from '../art/characterSkins';
import { resolveBloodDecal, resolveCorpseSource, type BloodGroup } from '../art/deathVisualAssets';
import type { EffectsSystem } from './EffectsSystem';

export const MAX_CORPSE_IMAGES = 32;
export const MAX_BLOOD_IMAGES = 128;

type ImageSlot = {
  active: boolean; visible: boolean; x: number; y: number; rotation: number; scaleX: number; scaleY: number; depth: number;
  setTexture(key: string, frame?: number): ImageSlot; setFrame(frame: number): ImageSlot;
  setPosition(x: number, y: number): ImageSlot; setTint(tint: number): ImageSlot; clearTint(): ImageSlot;
  setAlpha(alpha: number): ImageSlot; setScale(x: number, y?: number): ImageSlot; setRotation(rotation: number): ImageSlot;
  setFlip(x: boolean, y: boolean): ImageSlot; setDepth(depth: number): ImageSlot; setActive(active: boolean): ImageSlot; setVisible(visible: boolean): ImageSlot;
};
type Slot = { readonly image: ImageSlot; readonly kind: 'blood'|'corpse'; family: CharacterSkinId; texture: string; frame?: number; tint?: number };
export type DeathRequest = Readonly<{family: CharacterSkinId; x:number; y:number; elite?:boolean; major?:boolean; rotation?:number}>;
export type DeathVisualOptions = Readonly<{effects: EffectsSystem; hasTexture:(key:string)=>boolean; createImage:()=>ImageSlot; poolLimits?:Readonly<{blood:number;corpse:number}>; onEffectsChanged?:()=>void}>;

const FALLBACK_TINT: Readonly<Record<BloodGroup, number>> = Object.freeze({human:0x9b2027, alien:0x58a832, acid:0xd8d94a});
const BLOOD_FAMILIES = ['small','medium','large','streak'] as const;
const quarterRotation = (id:number):number => (id % 4) * Math.PI / 2;

export class DeathVisualView {
  private readonly effects: EffectsSystem;
  private readonly createImage: () => ImageSlot;
  private readonly corpseSources: Record<CharacterSkinId, ReturnType<typeof resolveCorpseSource>>;
  private readonly bloodSources: Record<BloodGroup, readonly ReturnType<typeof resolveBloodDecal>[]>;
  private readonly mappings = new Map<number, Slot>();
  private readonly corpsePool: ImageSlot[]=[];
  private readonly bloodPool: ImageSlot[]=[];
  private corpseAllocated=0; private bloodAllocated=0;
  private readonly poolLimits: Readonly<{blood:number;corpse:number}>;
  private readonly onEffectsChanged: () => void;

  constructor(options: DeathVisualOptions) {
    this.effects=options.effects; this.createImage=options.createImage;
    this.poolLimits=options.poolLimits ?? {blood:MAX_BLOOD_IMAGES,corpse:MAX_CORPSE_IMAGES};
    this.onEffectsChanged=options.onEffectsChanged ?? (()=>{});
    const families: CharacterSkinId[]=['marine','crawler','brute','spitter','stalker','carrier','queen'];
    this.corpseSources=Object.fromEntries(families.map(f=>[f,resolveCorpseSource(options.hasTexture,f)])) as typeof this.corpseSources;
    this.bloodSources={
      human:BLOOD_FAMILIES.map(f=>resolveBloodDecal(options.hasTexture,'human',f)),
      alien:BLOOD_FAMILIES.map(f=>resolveBloodDecal(options.hasTexture,'alien',f)),
      acid:['small','medium','large','scorch'].map(f=>resolveBloodDecal(options.hasTexture,'acid',f as 'small'|'medium'|'large'|'scorch')),
    };
  }

  spawnDeath(request: DeathRequest): boolean {
    if (!this.valid(request)) return false;
    const source=this.corpseSources[request.family];
    const records=this.effects.addAtomic([{kind:'decals',input:{label:`blood-${request.family}`}},
      {kind:'remains',input:{label:request.family,major:request.major===true||request.elite===true||source.major}}]);
    if(!records)return false;
    const [blood,corpse]=records;
    this.syncRetainedIds(false);
    const bloodSlot=this.acquire('blood'); const corpseSlot=this.acquire('corpse');
    if (!bloodSlot || !corpseSlot) {
      if(bloodSlot)this.release(bloodSlot);if(corpseSlot)this.release(corpseSlot);
      this.effects.remove(blood.id);this.effects.remove(corpse.id);this.syncRetainedIds(false);
      this.onEffectsChanged();return false;
    }
    this.configureBlood(bloodSlot,blood.id,request,source.bloodGroup);
    this.configureCorpse(corpseSlot,request,source);
    this.mappings.set(blood.id,bloodSlot);this.mappings.set(corpse.id,corpseSlot);
    this.onEffectsChanged();return true;
  }

  spawnBlood(request: DeathRequest): boolean {
    if (!this.valid(request)) return false;
    const record=this.effects.add('decals',{label:`blood-${request.family}`});if(!record)return false;
    this.syncRetainedIds(false);
    const slot=this.acquire('blood');
    if(!slot){this.effects.remove(record.id);this.syncRetainedIds(false);this.onEffectsChanged();return false;}
    this.configureBlood(slot,record.id,request,this.corpseSources[request.family].bloodGroup);this.mappings.set(record.id,slot);this.onEffectsChanged();return true;
  }

  /** QueenBossView intentionally retains the corpse; this view owns blood only. */
  spawnQueenBlood(request: Omit<DeathRequest,'family'>): boolean {return this.spawnBlood({...request,family:'queen'});}

  syncRetainedIds(notify=true): void {
    const retained=new Set<number>();
    for(const kind of ['dynamicLights','particles','decals','remains','shellCasings'] as const) for(const effect of this.effects.snapshot(kind))retained.add(effect.id);
    for(const [id,slot] of this.mappings) if(!retained.has(id)){this.mappings.delete(id);this.release(slot);}
    if(notify)this.onEffectsChanged();
  }

  clear(recycle=true): void {
    if(recycle) for(const slot of this.mappings.values())this.release(slot);
    this.mappings.clear();
    if(!recycle){this.corpsePool.length=0;this.bloodPool.length=0;this.corpseAllocated=0;this.bloodAllocated=0;}
  }

  get snapshot() {
    const describe=(slot:Slot)=>Object.freeze({family:slot.family,texture:slot.texture,frame:slot.frame,tint:slot.tint,x:slot.image.x,y:slot.image.y,rotation:slot.image.rotation,scaleX:slot.image.scaleX,scaleY:slot.image.scaleY,depth:slot.image.depth});
    return Object.freeze({corpses:Object.freeze([...this.mappings.values()].filter(s=>s.kind==='corpse').map(describe)),blood:Object.freeze([...this.mappings.values()].filter(s=>s.kind==='blood').map(describe)),corpseAllocated:this.corpseAllocated,bloodAllocated:this.bloodAllocated});
  }

  private valid(r:DeathRequest){return Number.isFinite(r.x)&&Number.isFinite(r.y)&&this.corpseSources[r.family]!==undefined;}
  private acquire(kind:'blood'|'corpse'):Slot|null {
    const pool=kind==='blood'?this.bloodPool:this.corpsePool;let image=pool.pop();
    if(!image){if(kind==='blood'){if(this.bloodAllocated>=this.poolLimits.blood)return null;this.bloodAllocated++;}else{if(this.corpseAllocated>=this.poolLimits.corpse)return null;this.corpseAllocated++;}image=this.createImage();}
    return {image,kind,family:'marine',texture:''};
  }
  private reset(slot:Slot,r:DeathRequest){slot.family=r.family;slot.tint=undefined;slot.frame=undefined;slot.image.setTexture(this.corpseSources[r.family].texture).clearTint().setAlpha(1).setScale(1,1).setRotation(0).setFlip(false,false).setPosition(r.x,r.y).setDepth(0).setActive(true).setVisible(true);}
  private configureBlood(slot:Slot,id:number,r:DeathRequest,group:BloodGroup){this.reset(slot,r);const index=(id+r.family.length+(r.major?1:0))%4;const source=this.bloodSources[group][index]!;slot.texture=source.texture;slot.frame=source.frame;slot.image.setTexture(source.texture,source.frame);if(!source.framed){slot.tint=FALLBACK_TINT[group];slot.image.setTint(slot.tint);}const scale=(r.major||r.elite?1.3:0.72)+(id%3)*0.08;slot.image.setScale(scale).setRotation(quarterRotation(id)).setDepth(Math.max(-20,r.y-30));}
  private configureCorpse(slot:Slot,r:DeathRequest,source:ReturnType<typeof resolveCorpseSource>){this.reset(slot,r);slot.texture=source.texture;slot.frame=source.frame;slot.image.setTexture(source.texture,source.frame);const size=(r.major||r.elite||source.major?1.25:1)*(source.displaySize.width/64);slot.image.setScale(size).setRotation(Number.isFinite(r.rotation)?r.rotation!:quarterRotation(r.x+r.y)).setDepth(Math.max(-19,r.y-20));}
  private release(slot:Slot){slot.image.clearTint().setAlpha(1).setScale(1,1).setRotation(0).setFlip(false,false).setPosition(0,0).setDepth(0).setVisible(false).setActive(false);(slot.kind==='blood'?this.bloodPool:this.corpsePool).push(slot.image);}
}
