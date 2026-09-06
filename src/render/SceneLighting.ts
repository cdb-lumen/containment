import * as T from 'three';

type Fixture={x:number;y:number;z:number;color:number};
/** One shadow map, four fixture pools and one shared blast light on every tier. */
export class SceneLighting {
 readonly root=new T.Group();
 readonly ambient=new T.HemisphereLight(0xb9d4e5,0x303b46,.78);
 readonly key=new T.DirectionalLight(0xc9dfff,3.2);
 readonly fixtures=Array.from({length:4},()=>new T.PointLight(0x9edcec,0,5.5,2));
 readonly blast=new T.PointLight(0xffc18a,0,7,2);
 private blastLife=0;
 constructor(){
  const fill=new T.DirectionalLight(0x7296b0,.22);fill.position.set(-8,8,-12);
  this.key.castShadow=true;this.key.position.set(-16,14,10);
  const shadow=this.key.shadow;shadow.mapSize.set(1024,1024);
  Object.assign(shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:70});
  shadow.normalBias=.015;shadow.bias=-.0002;
  this.root.add(this.ambient,this.key,this.key.target,fill,...this.fixtures,this.blast);
 }
 loadRoom(world:T.Group,width:number,height:number){
  this.blastLife=0;this.blast.intensity=0;
  this.key.target.position.set(width/2,0,height/2);this.key.position.copy(this.key.target.position).add(new T.Vector3(-16,14,10));
  world.updateWorldMatrix(true,true);const candidates:Fixture[]=[],position=new T.Vector3();
  world.traverse(object=>{
   const authored=object.userData.lightFixtures as Fixture[]|undefined;
   if(authored)for(const fixture of authored){position.set(fixture.x,fixture.y,fixture.z).applyMatrix4(object.matrixWorld);candidates.push({...fixture,x:position.x,y:position.y,z:position.z});}
   // Authored meshes are merged by material, so their centers are not fixtures.
   if(object.userData.bakedEnvironment||!(object instanceof T.Mesh)||Array.isArray(object.material))return;
   const material=object.material;
   if(!(material instanceof T.MeshStandardMaterial)||material.emissiveIntensity<.5||material.emissive.getHex()===0)return;
   object.getWorldPosition(position);if(position.y<.65)return;
   candidates.push({x:position.x,y:position.y,z:position.z,color:material.emissive.getHex()});
  });
  // Deterministic farthest-point spacing avoids spending all four pools on one bank.
  const selected:Fixture[]=[];
  candidates.sort((a,b)=>Math.hypot(a.x-width/2,a.z-height/2)-Math.hypot(b.x-width/2,b.z-height/2));
  while(candidates.length&&selected.length<this.fixtures.length){
   if(selected.length)candidates.sort((a,b)=>Math.min(...selected.map(s=>Math.hypot(b.x-s.x,b.z-s.z)))-Math.min(...selected.map(s=>Math.hypot(a.x-s.x,a.z-s.z))));
   const next=candidates.shift()!;if(selected.every(s=>Math.hypot(next.x-s.x,next.z-s.z)>2))selected.push(next);
  }
  this.fixtures.forEach((light,i)=>{const fixture=selected[i];light.intensity=fixture?5:0;if(fixture){light.position.set(fixture.x,fixture.y,fixture.z);light.color.setHex(fixture.color);}});
 }
 explosion(x:number,z:number,radius:number){this.blast.position.set(x,.9,z);this.blast.distance=Math.min(7,Math.max(3,radius*1.5));this.blastLife=.18;this.blast.intensity=12;}
 update(dt:number){this.blastLife=Math.max(0,this.blastLife-dt);this.blast.intensity=12*(this.blastLife/.18)**2;}
 dispose(){this.key.shadow.dispose();this.root.removeFromParent();}
}

/** Soft grounding survives the performance tier without another shadow render. */
export class ContactShadows {
 readonly mesh:T.InstancedMesh;
 private dummy=new T.Object3D();private count=0;
 constructor(){
  const geometry=new T.PlaneGeometry(2,2);geometry.rotateX(-Math.PI/2);
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{},
   vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}',
   fragmentShader:'varying vec2 vUv; void main(){float d=length(vUv*2.0-1.0);float a=(1.0-smoothstep(0.1,1.0,d))*0.24;gl_FragColor=vec4(0.025,0.035,0.045,a);}',
  });
  this.mesh=new T.InstancedMesh(geometry,material,64);this.mesh.name='actor-contact-shadows';this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.frustumCulled=false;this.mesh.count=0;
 }
 begin(){this.count=0;}
 add(x:number,z:number,radius:number){if(this.count===64)return;this.dummy.position.set(x,.025,z);this.dummy.scale.set(radius*1.3,1,radius);this.dummy.updateMatrix();this.mesh.setMatrixAt(this.count++,this.dummy.matrix);}
 end(){this.mesh.count=this.count;this.mesh.instanceMatrix.needsUpdate=true;}
 dispose(){this.mesh.geometry.dispose();(this.mesh.material as T.Material).dispose();this.mesh.removeFromParent();}
}
