import * as T from 'three';
export type AfflictionStatus={chilled:boolean;burning:boolean;poisoned?:boolean;chillStacks?:number;frozen?:boolean};
export const NO_AFFLICTION:AfflictionStatus={chilled:false,burning:false,poisoned:false,frozen:false,chillStacks:0};
type Attachment={status:AfflictionStatus;span:number;height:number;phase:number};
let serial=0;
/** Actor-local state only. GPU resources belong to the renderer, not pooled actors. */
export function afflictionEffects(root:T.Group,span:number,height:number){
 const data:Attachment={status:NO_AFFLICTION,span,height,phase:serial++*.713};root.userData.affliction=data;
 const frost={value:0};
 root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial){
  m.onBeforeCompile=shader=>{shader.uniforms.statusFrost=frost;
   shader.vertexShader='varying vec3 statusPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nstatusPosition = position;');
   shader.fragmentShader='uniform float statusFrost; varying vec3 statusPosition;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 sp=statusPosition*19.0;
    float grain=fract(sin(dot(floor(sp*6.0),vec3(12.9898,78.233,37.719)))*43758.5453);
    float frostPatch=sin(sp.x*.73)*sin(sp.y*.91)+cos(sp.z*.57);
    float cover=smoothstep(1.65-statusFrost*.85,1.95-statusFrost*.85,frostPatch+grain*.25);
    float fracture=pow(1.0-abs(sin(sp.x+sin(sp.z)*1.7)*sin(sp.y*.7+sp.z)),32.0);
    // Translucent blue glaze retains the albedo; bright veins occupy only fractures.
    vec3 glaze=diffuseColor.rgb*vec3(.65,1.12,1.3)+vec3(.025,.065,.09);
    diffuseColor.rgb=mix(diffuseColor.rgb,glaze,(.12+cover*.65)*statusFrost);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.34,.68,.78),cover*fracture*statusFrost*.55);
   `);};m.customProgramCacheKey=()=> 'actor-frost-v2';m.needsUpdate=true;
 }});
 return {set(status:AfflictionStatus){data.status=status;frost.value=status.frozen?1:status.chilled?Math.min(3,Math.max(1,status.chillStacks??1))*.29:0;},animate(_time:number){},reset(){data.status=NO_AFFLICTION;frost.value=0;}};
}
const vertex=`attribute vec4 atlas; varying vec2 texUV; varying vec2 localUV;
void main(){texUV=atlas.xy+uv*atlas.zw;localUV=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`;
/** Five shared draws at most: flame, toxic vapor, droplets, ice and embers. */
export class AfflictionBatches{
 readonly root=new T.Group();
 private meshes:T.InstancedMesh[]=[];private textures:T.Texture[]=[];private dummy=new T.Object3D();private pos=new T.Vector3();private color=new T.Color();
 private fire:T.InstancedMesh;private poison:T.InstancedMesh;private ice:T.InstancedMesh;private drops:T.InstancedMesh;private embers:T.InstancedMesh;
 constructor(loader?:T.TextureLoader,private capacity=128){
  const atlas=(name:string,cols:number,rows:number,tint:T.Color,fire=false)=>{
   const texture=loader?.load(`${import.meta.env.BASE_URL}assets/vfx/${name}.png`)??new T.Texture();texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;this.textures.push(texture);
   const geometry=new T.PlaneGeometry(1,1);geometry.setAttribute('atlas',new T.InstancedBufferAttribute(new Float32Array(capacity*3*4),4));
   // Authored RGBA contains bright RGB outside its silhouette. Never derive coverage from RGB.
   texture.colorSpace=fire?T.SRGBColorSpace:T.NoColorSpace;
   const material=new T.ShaderMaterial({uniforms:{map:{value:texture},tint:{value:tint}},vertexShader:vertex,fragmentShader:`uniform sampler2D map;uniform vec3 tint;varying vec2 texUV;varying vec2 localUV;
void main(){vec4 s=texture2D(map,texUV);float edge=smoothstep(0.0,.12,localUV.y)*smoothstep(0.0,.06,localUV.x)*smoothstep(0.0,.06,1.0-localUV.x);float a=s.a*${fire?'.68':'.48'}*edge;if(a<.008)discard;gl_FragColor=vec4(${fire?'s.rgb*vec3(1.0,.55,.16)':'tint'},a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.NormalBlending});
   const mesh=this.batch(geometry,material,capacity*3);mesh.userData.grid=[cols,rows];return mesh;
  };
  this.fire=atlas('Flame02',16,4,new T.Color(1,.5,.1),true);this.poison=atlas('WispySmoke02',8,8,new T.Color(.08,.36,.012));
  this.ice=this.batch(new T.OctahedronGeometry(1,0),new T.MeshStandardMaterial({color:0xa6e2ef,roughness:.24,metalness:.15,transparent:true,opacity:.78,flatShading:true,depthWrite:false}),capacity*10);
  this.drops=this.batch(new T.SphereGeometry(1,6,4),new T.MeshStandardMaterial({color:0x81b94b,emissive:0x345918,emissiveIntensity:.4,roughness:.2}),capacity*4);
  this.embers=this.batch(new T.SphereGeometry(1,4,3),new T.MeshBasicMaterial({color:0xffb65b,toneMapped:false,transparent:true,opacity:.65,depthWrite:false}),capacity*4);
  this.root.name='shared-affliction-batches';
 }
 private batch(g:T.BufferGeometry,m:T.Material,n:number){const mesh=new T.InstancedMesh(g,m,n);mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.add(mesh);this.meshes.push(mesh);return mesh;}
 private put(mesh:T.InstancedMesh,x:number,y:number,z:number,sx:number,sy:number,sz:number,camera?:T.Camera,angle=0){
  const d=this.dummy;d.position.set(x,y,z);d.scale.set(sx,sy,sz);if(camera)d.quaternion.copy(camera.quaternion);else d.rotation.set(angle*.3,angle,angle*.2);d.updateMatrix();mesh.setMatrixAt(mesh.count++,d.matrix);
 }
 private card(mesh:T.InstancedMesh,x:number,y:number,z:number,w:number,h:number,time:number,camera:T.Camera){
  const [cols,rows]=mesh.userData.grid,frame=Math.floor(time*24)%64,a=mesh.geometry.getAttribute('atlas') as T.InstancedBufferAttribute;
  // TextureLoader flips PNG vertically; authored frames run left-to-right, top-to-bottom.
  const image=(mesh.material as T.ShaderMaterial).uniforms.map.value.image;
  const ix=.5/(image?.width??2048),iy=.5/(image?.height??1024);
  a.setXYZW(mesh.count,(frame%cols)/cols+ix,1-(Math.floor(frame/cols)+1)/rows+iy,1/cols-2*ix,1/rows-2*iy);this.put(mesh,x,y,z,w,h,1,camera);
 }
 update(roots:Iterable<T.Object3D>,camera:T.Camera,time:number){
  for(const mesh of this.meshes)mesh.count=0;let actors=0;
  for(const root of roots){const d=root.userData.affliction as Attachment|undefined;if(!d||!root.visible)continue;const s=d.status;if(!(s.burning||s.poisoned||s.chilled||s.frozen))continue;if(actors++>=this.capacity)break;
   root.getWorldPosition(this.pos);const {x,y,z}=this.pos,r=d.span*.29,h=d.height,t=time+d.phase;
   if(s.burning){for(let i=0;i<3;i++){const a=i*2.094+d.phase;this.card(this.fire,x+Math.cos(a)*r*.55,y+h*.85,z+Math.sin(a)*r*.55,d.span*.34,Math.max(h*1.2,1.0),t+i*.51,camera);}for(let i=0;i<2;i++){const p=(t*.6+i*.5)%1,a=i*2.4;this.put(this.embers,x+Math.cos(a+p)*r*.7,y+h*.5+p*h,z+Math.sin(a)*r*.5,.016*(1-p),.04*(1-p),.016);}}
   if(s.poisoned){for(let i=0;i<2;i++)this.card(this.poison,x+(i?1:-1)*r*.5,y+h*.6,z,d.span*.65,h*1.35,t*.7+i*.7,camera);for(let i=0;i<4;i++){const p=(t*.45+i*.25)%1,a=i*2.4;this.put(this.drops,x+Math.cos(a)*r*.8,y+h*(1-p)*.8+.05,z+Math.sin(a)*r*.8,.045,.075,.045);}}
   if(s.frozen||s.chilled){const n=s.frozen?10:Math.min(3,Math.max(1,s.chillStacks??1))*2;for(let i=0;i<n;i++){const a=i*2.399+d.phase,large=s.frozen?1:.82+Math.sin(t*3.2+i*.8)*.08;this.put(this.ice,x+Math.cos(a)*r,y+.08+(i%3)*h*(s.frozen?.18:.24),z+Math.sin(a)*r,.11*large,.3*large*(1+(i%3)*.35),.15*large,undefined,a);this.color.setHex(i%3?0x9cd5e5:0xe5fbff);this.ice.setColorAt(this.ice.count-1,this.color);}}
  }
  for(const mesh of this.meshes){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;const a=mesh.geometry.getAttribute('atlas');if(a)a.needsUpdate=true;}
 }
 get counts(){return{fire:this.fire.count,poison:this.poison.count,ice:this.ice.count,drops:this.drops.count,embers:this.embers.count};}
 clear(){for(const mesh of this.meshes)mesh.count=0;}
 dispose(){for(const mesh of this.meshes){mesh.geometry.dispose();(mesh.material as T.Material).dispose();}for(const t of this.textures)t.dispose();this.root.removeFromParent();}
}
