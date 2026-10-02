import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Room20 constructed reactor assembly. Coordinates are game units; all solid work stays in the
 * existing void. Heads occupy the stage1 reservations, not the combat deck. */
export function createOverloadDraft(){
 const root=new T.Group();root.name='overload-draft';
 const material=(name:string,color:number,metalness=.65)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:.65});m.name=name;m.userData.actorMaterial=true;return m;};
 const steel=material('overload-steel',0x52656a),dark=material('overload-recess',0x17262d),ceramic=material('overload-ceramic',0xb2bcb1,.12),bronze=material('overload-buswork',0x9b7243),bolts=material('reactor-fasteners',0x8c999a);
 // Quiet static column. Sequence-driven overload emission is not part of this pass.
 const core=material('overload-column',0x8ebfc5,.3);core.emissive.setHex(0x285762);core.emissiveIntensity=.35;
 let group:T.Group;
 const role=(name:string)=>{group=new T.Group();group.name=name;root.add(group);};
 const add=(g:T.BufferGeometry,m:T.Material,x:number,h:number,z:number)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x/32,h/32,z/32);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;};
 const box=(x:number,h:number,z:number,w:number,t:number,d:number,m:T.Material)=>add(new T.BoxGeometry(w/32,t/32,d/32),m,x,h,z);
 const pipe=(a:number[],b:number[],r:number,m:T.Material)=>{const start=new T.Vector3(...a).divideScalar(32),end=new T.Vector3(...b).divideScalar(32),mesh=add(new T.CylinderGeometry(r/32,r/32,start.distanceTo(end),12),m,0,0,0);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());};
 const ring=(h:number,r:number,t:number,m:T.Material)=>{const mesh=add(new T.TorusGeometry(r/32,t/32,8,48),m,600,h,415);mesh.rotation.x=-Math.PI/2;};
 const foundation=(x:number,z:number)=>{for(const dx of [-18,18])box(x+dx,-101,z,10,118,36,steel);};
 role('coolant-header');foundation(510,375);
 box(510,-38,375,56,8,66,dark);
 for(const x of [489,531])box(x,-8,375,8,52,58,steel);
 // Broad transverse header and paired drop/return pipes, unlike the bus blades.
 pipe([489,24,352],[531,24,352],8,steel);
 for(const x of [496,524]){
  pipe([x,-34,394],[x,24,394],6,steel);pipe([x,24,352],[x,24,394],6,steel);
  pipe([x,24,364],[x,24,376],8,ceramic);
 }
 role('power-bus');foundation(690,375);
 box(690,-38,375,56,8,66,dark);
 for(const z of [350,396]){box(690,-9,z,52,50,9,steel);box(690,18,z,54,8,12,ceramic);}
 for(const x of [673,690,707]){box(x,30,375,7,16,58,bronze);box(x,42,350,10,8,10,ceramic);}
 role('restraint-head');foundation(600,510);
 box(600,-38,510,66,8,56,dark);
 // Two raised cheeks carry a transverse jaw and a visible axial piston.
 for(const x of [574,626]){box(x,1,510,12,70,52,steel);box(x,39,510,14,6,54,ceramic);}
 box(600,28,489,60,16,12,steel);
 box(600,20,533,28,24,10,steel);
 for(const x of [574,626])for(const z of [490,530])pipe([x,42,z],[x,46,z],3,bolts);
 role('induction-core');foundation(600,415);
 box(600,-38,415,56,8,96,dark);
 pipe([600,-34,415],[600,82,415],8,core);
 for(const h of [-20,18,54]){ring(h,25,3,bronze);ring(h+5,18,2,ceramic);}
 for(const x of [578,622])for(const z of [390,440]){
  box(x,12,z,5,92,6,steel);box(x,37,z,8,12,9,ceramic);
 }
 // Segmented annular shoes wrap the winding rather than reading as wire hoops.
 const coreGroup=root.getObjectByName('induction-core') as T.Group;const shoes=new T.Group();shoes.name='coil-shoes';coreGroup.add(shoes);group=shoes;
 for(const h of [-20,18,54])for(let i=0;i<6;i++){
  const a=i*Math.PI/3+.08,span=Math.PI/3-.16;
  const shape=new T.Shape();shape.absarc(0,0,29/32,a,a+span,false);
  shape.absarc(0,0,21/32,a+span,a,true);shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:8/32,bevelEnabled:true,bevelSize:.8/32,bevelThickness:.8/32,bevelSegments:1,steps:1,curveSegments:6});
  g.rotateX(-Math.PI/2);add(g,bronze,600,h-4,415);
 }
 group=coreGroup;
 for(const h of [-12,26,62])for(const z of [390,440])box(600,h,z,22,6,8,ceramic);
 // A ribbed header chest with bolted split flanges on both return lines.
 group=root.getObjectByName('coolant-header') as T.Group;
 box(510,17,350,42,24,18,steel);box(510,30,350,34,3,12,ceramic);
 for(const x of [498,510,522])box(x,17,340.8,5,16,1.5,dark);
 const flanges=new T.Group();flanges.name='coolant-flanges';group.add(flanges);group=flanges;
 for(const x of [496,524])for(const z of [360,381]){
  pipe([x,24,z-2],[x,24,z+2],10,steel);
  for(const dx of [-7,7])pipe([x+dx,24,z-3],[x+dx,24,z+3],1.5,bolts);
 }
 // Raised ceramic saddles and a recessed steel terminal chest protect the bus.
 group=root.getObjectByName('power-bus') as T.Group;
 box(690,8,399,54,32,18,steel);box(690,26,399,50,4,18,dark);
 for(const x of [664,716])box(x,35,374,6,30,46,steel);
 const insulators=new T.Group();insulators.name='bus-insulators';group.add(insulators);group=insulators;
 for(const x of [673,690,707])for(const z of [350,395]){
  pipe([x,24,z],[x,32,z],6,ceramic);pipe([x,27,z],[x,29,z],8,ceramic);
  box(x,34,z,9,4,10,bronze);pipe([x,36,z],[x,40,z],2,bolts);
 }
 group=root.getObjectByName('restraint-head') as T.Group;
 // Recessed cheek webs, crosshead and guide rods visibly cradle the actuator.
 for(const x of [574,626]){
  box(x,8,510,13,28,30,dark);box(x,8,510,15,10,18,steel);
 }
 for(const x of [585,615])pipe([x,20,483],[x,20,530],3,bolts);
 box(600,20,489,38,25,10,steel);box(600,34,489,32,3,10,ceramic);
 role('connections');
 // Local return trunks connect the heads beneath the exposed ring stack.
 for(const x of [496,524]){pipe([x,-26,394],[x,-26,430],4,steel);pipe([x,-26,430],[580,-26,430],4,steel);}
 for(const x of [673,690,707]){pipe([x,0,400],[x,0,450],3,bronze);pipe([x,0,450],[620,0,450],3,bronze);}
 const ram=new T.Group();ram.name='restraint-ram';group.add(ram);group=ram;
 pipe([600,20,455],[600,20,489],5,bolts);
 pipe([600,20,490],[600,20,525],9,bronze);
 for(const z of [491,523])pipe([600,20,z-2],[600,20,z+2],12,steel);
 // The vertical clevis bolts the elevated ram to the lower core frame.
 box(600,0,458,22,48,8,steel);box(600,24,458,24,6,10,ceramic);
 root.userData.overloadDraftRoles=root.children.slice(0,4).map(o=>o.name);
 return root;
}

/** Release input geometry after flattening. One owned mesh per material. */
export function batchOverloadDraft(root:T.Group){
 root.updateMatrixWorld(true);const buckets=new Map<T.Material,T.BufferGeometry[]>();
 root.traverse(o=>{if(o instanceof T.Mesh){const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);const m=o.material as T.Material;const list=buckets.get(m)??[];list.push(g);buckets.set(m,list);o.geometry.dispose();}});
 const result=new T.Group();result.name=root.name;result.userData={...root.userData};
 for(const [material,parts] of buckets){const geometry=mergeGeometries(parts)!;geometry.userData.environmentUV=true;parts.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,material);mesh.userData.bakedEnvironment=true;mesh.castShadow=mesh.receiveShadow=true;result.add(mesh);}
 root.clear();return result;
}
