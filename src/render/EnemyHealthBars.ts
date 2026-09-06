import * as T from 'three';
export type HealthBarEntry={x:number;z:number;height:number;health:number;maxHealth:number;elite?:boolean;armor?:number;maxArmor?:number};
export function healthFraction(health:number,maxHealth:number){return Number.isFinite(health)&&Number.isFinite(maxHealth)&&maxHealth>0?T.MathUtils.clamp(health/maxHealth,0,1):0;}
/** Two draw calls for every visible enemy; constant screen size on phones. */
export class EnemyHealthBars{
 readonly root=new T.Group();private background:T.InstancedMesh;private fill:T.InstancedMesh;private dummy=new T.Object3D();
 constructor(private capacity=128){
  const shape=new T.PlaneGeometry(1,1);this.background=new T.InstancedMesh(shape,new T.MeshBasicMaterial({color:0x071110,depthWrite:false,depthTest:false,toneMapped:false}),capacity);
  this.fill=new T.InstancedMesh(shape,new T.MeshBasicMaterial({depthWrite:false,depthTest:false,toneMapped:false}),capacity);
  this.background.renderOrder=1000;this.fill.renderOrder=1001;this.fill.setColorAt(0,new T.Color(0xbcd5b2));
  for(const mesh of [this.background,this.fill]){mesh.frustumCulled=false;mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.add(mesh);}
 }
 update(entries:HealthBarEntry[],camera:T.OrthographicCamera,viewportHeight:number,hidden=false){
  this.root.visible=!hidden;const pixel=(camera.top-camera.bottom)/(Math.max(1,viewportHeight)*camera.zoom),right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion);let count=0;
  for(const e of entries){const fraction=healthFraction(e.health,e.maxHealth);if(fraction<=0||count>=this.capacity)continue;const width=(e.elite?38:32)*pixel,height=4*pixel;
   this.dummy.quaternion.copy(camera.quaternion);this.dummy.position.set(e.x,e.height+.24,e.z);this.dummy.scale.set(width+2*pixel,height+2*pixel,1);this.dummy.updateMatrix();this.background.setMatrixAt(count,this.dummy.matrix);
   this.dummy.position.addScaledVector(right,-width*(1-fraction)/2).addScaledVector(new T.Vector3(0,0,1).applyQuaternion(camera.quaternion),.005);this.dummy.scale.set(width*fraction,height,1);this.dummy.updateMatrix();this.fill.setMatrixAt(count,this.dummy.matrix);this.fill.setColorAt(count,new T.Color((e.armor??0)>0?0x83bbd8:e.elite?0xe1b16d:0xbcd5b2));count++;
  }
  this.background.count=this.fill.count=count;this.background.instanceMatrix.needsUpdate=this.fill.instanceMatrix.needsUpdate=true;if(this.fill.instanceColor)this.fill.instanceColor.needsUpdate=true;
 }
 dispose(){this.background.geometry.dispose();(this.background.material as T.Material).dispose();(this.fill.material as T.Material).dispose();this.root.removeFromParent();}
}
