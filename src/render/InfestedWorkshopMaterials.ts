import * as T from 'three';

// Room15 only. Integer noise keeps these small shared textures reproducible.
function surface(kind:'paint'|'steel'|'resin',color:number){
 const size=128,data=new Uint8Array(size*size*4),base=new T.Color(color);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const noise=((Math.imul(x+17,374761393)^Math.imul(y+31,668265263))>>>0)%101/100;
  const fiber=.5+.5*Math.sin(x*.72+Math.sin(y*.08)*1.8);
  const edge=Math.min(x,y,size-1-x,size-1-y);
  const chipped=kind==='paint'&&((edge<6&&noise>.46)||(noise>.94&&Math.sin(x*.21+y*.12)>.83));
  const tone=kind==='resin'?.66+fiber*.26+noise*.08:.78+noise*.22;
  const c=chipped?new T.Color(0x273034):base;
  const i=(y*size+x)*4;data[i]=Math.round(c.r*255*tone);data[i+1]=Math.round(c.g*255*tone);data[i+2]=Math.round(c.b*255*tone);data[i+3]=255;
 }
 const map=new T.DataTexture(data,size,size);map.wrapS=map.wrapT=T.RepeatWrapping;
 map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
 return map;
}
const steel=new T.MeshStandardMaterial({map:surface('steel',0x354047),metalness:.72,roughness:.48});
const trim=new T.MeshStandardMaterial({map:surface('paint',0xb99a46),metalness:.22,roughness:.76});
const flesh=new T.MeshStandardMaterial({map:surface('resin',0x806e61),metalness:0,roughness:.96});
const edge=new T.MeshStandardMaterial({color:0x69777a,metalness:.82,roughness:.39});
const black=new T.MeshStandardMaterial({color:0x141b1d,metalness:.35,roughness:.7});
const copper=new T.MeshStandardMaterial({color:0x997454,metalness:.65,roughness:.5});
const rubber=new T.MeshStandardMaterial({color:0x252326,metalness:0,roughness:1});
const wet=new T.MeshStandardMaterial({color:0x635549,metalness:.08,roughness:.26});
export const WORKSHOP_MAT={steel,trim,flesh,bone:flesh,edge,black,copper,rubber,wet};
for(const [name,material] of Object.entries(WORKSHOP_MAT))material.name=`workshop-${name}`;
