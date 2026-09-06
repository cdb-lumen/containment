import * as T from 'three';

/** RGB-only wet detail: geometry and the standard material still own coverage. */
export class AcidPoolMaterial extends T.MeshBasicMaterial {
 readonly surfaceTime={value:0};
 constructor(id:number){
  super({color:0x99cf56,transparent:true,opacity:.3,depthWrite:false});
  this.name='acid-pool-surface';
  const seed={value:(id%997)*.137};
  this.onBeforeCompile=shader=>{
   shader.uniforms.acidTime=this.surfaceTime;shader.uniforms.acidSeed=seed;
   shader.vertexShader='varying vec2 acidPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nacidPosition = position.xy;');
   shader.fragmentShader=`
    varying vec2 acidPosition;
    uniform float acidTime;
    uniform float acidSeed;
    float acidHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float acidNoise(vec2 p){
     vec2 cell=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
     return mix(mix(acidHash(cell),acidHash(cell+vec2(1.0,0.0)),f.x),mix(acidHash(cell+vec2(0.0,1.0)),acidHash(cell+vec2(1.0)),f.x),f.y);
    }
    float acidRipple(vec2 p,float index){
     float angle=acidHash(vec2(index,acidSeed))*6.2831853;
     vec2 center=vec2(cos(angle),sin(angle))*(0.18+0.46*acidHash(vec2(acidSeed,index+9.0)));
     float phase=fract(acidTime*0.43+acidHash(vec2(index+4.0,acidSeed)));
     float radius=mix(0.025,0.17,phase),d=length(p-center);
     float ring=1.0-smoothstep(0.008,0.027,abs(d-radius));
     float life=sin(phase*3.14159265);
     // A tiny off-center glint suggests a bubble without a raised mesh.
     float glint=1.0-smoothstep(0.008,0.033,length(p-center-vec2(-radius*0.4,radius*0.55)));
     return (ring*0.14+glint*0.12)*life*life;
    }
   `+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec2 acidP=acidPosition;
    float acidMottle=acidNoise(acidP*5.0+acidSeed);
    float acidFilm=acidNoise(acidP*11.0+acidSeed+vec2(acidTime*0.035,-acidTime*0.025));
    float acidDetail=0.0;
    for(int i=0;i<4;i++){acidDetail+=acidRipple(acidP,float(i));}
    // Keep the full original perimeter visible; only interior RGB varies.
    float acidInterior=1.0-smoothstep(0.82,0.98,length(acidP));
    float acidWet=mix(1.0,clamp(0.78+acidMottle*0.28+acidFilm*0.10+acidDetail,0.78,1.24),acidInterior);
    diffuseColor.rgb *= acidWet;
   `);
  };
 }
 override customProgramCacheKey(){return 'acid-pool-surface-v1';}
}
