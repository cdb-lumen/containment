import * as T from 'three';

/** Original deterministic 128px service-enamel atlas. No external imagery.
 * Rub-through is confined to removable cover edges and two handling zones.
 * Broad clean enamel remains dominant; this is not rust or a bevel bake. */
export function createAwakeningServiceFinish(){
 const size=128,color=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,edge=Math.min(x,y,size-1-x,size-1-y);
  const grain=((x*17+y*31)%11)-5;
  const handled=(y<9||y>118)&&((x>18&&x<43)||(x>86&&x<109));
  const rubbed=handled&&edge<2+((x*7+y*3)%4);
  const c=rubbed?164:edge<2?192:228;
  color.set([c+grain,c+grain+3,c+grain+1,255],i);
  const r=rubbed?138:206+grain;rough.set([r,r,r,255],i);
 }
 const texture=(data:Uint8Array)=>{const t=new T.DataTexture(data,size,size);t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 const map=texture(color);map.colorSpace=T.SRGBColorSpace;
 const roughnessMap=texture(rough);
 const material=new T.MeshStandardMaterial({color:0x9dada6,map,roughnessMap,roughness:.72,metalness:.35});
 material.name='awakening-service-enamel';material.userData.actorMaterial=true;
 material.userData.provenance='Original analytic cover-edge/handling atlas, AwakeningServiceFinish.ts; project license';
 material.addEventListener('dispose',()=>{map.dispose();roughnessMap.dispose();});
 return material;
}
