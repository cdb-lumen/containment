import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';

type Pool={id:number;x:number;y:number;radius:number;life:number};
type PoolRenderer={scene:T.Scene;poolMeshes:Map<number,T.Mesh<T.CircleGeometry,T.MeshBasicMaterial>>;time:number;syncPools(pools:readonly Pool[]):void;clearPools():void};
function fixture(){
 const renderer=Object.assign(Object.create(DepthRenderer.prototype),{scene:new T.Scene(),poolMeshes:new Map(),time:3}) as PoolRenderer;
 expect(renderer.syncPools,'production renderer owns procedural pool synchronization').toBeTypeOf('function');
 return renderer;
}
const pool:Pool={id:17,x:192,y:320,radius:48,life:4};
function shaderFor(mesh:T.Mesh<T.CircleGeometry,T.MeshBasicMaterial>){
 const shader={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader,uniforms:T.UniformsUtils.clone(T.ShaderLib.basic.uniforms)};
 mesh.material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);return shader;
}
it('retains the exact 40-segment hazard footprint, ground transform and single draw',()=>{
 const r=fixture();r.syncPools([pool]);const mesh=r.poolMeshes.get(pool.id)!;
 expect(r.scene.children).toEqual([mesh]);expect(mesh.children).toHaveLength(0);
 expect(mesh.geometry.parameters).toEqual({radius:1,segments:40,thetaStart:0,thetaLength:Math.PI*2});
 expect(mesh.position.toArray()).toEqual([6,.03,10]);expect(mesh.scale.toArray()).toEqual([1.5,1.5,1.5]);expect(mesh.rotation.x).toBe(-Math.PI/2);
 expect(mesh.material).toBeInstanceOf(T.MeshBasicMaterial);expect(mesh.material.color.getHex()).toBe(0x99cf56);
 expect(mesh.material.transparent).toBe(true);expect(mesh.material.depthWrite).toBe(false);expect(mesh.material.side).toBe(T.FrontSide);
 expect(mesh.material.map).toBeNull();expect(mesh.castShadow).toBe(false);
});
it('adds procedural mottling and bounded ripple detail to RGB only, retaining standard output',()=>{
 const r=fixture();r.syncPools([pool]);const mesh=r.poolMeshes.get(pool.id)!,shader=shaderFor(mesh);
 expect(shader.fragmentShader).toContain('acidNoise');expect(shader.fragmentShader).toContain('acidRipple');
 expect(shader.fragmentShader).toContain('diffuseColor.rgb *=');
 expect(shader.fragmentShader).not.toMatch(/discard|diffuseColor\.a\s*[*=]/);
 expect(shader.vertexShader).toContain('#include <begin_vertex>');expect(shader.vertexShader).not.toMatch(/transformed\s*[+*=]/);
 for(const chunk of ['fog_fragment','tonemapping_fragment','colorspace_fragment','opaque_fragment'])expect(shader.fragmentShader).toContain(`#include <${chunk}>`);
 expect(mesh.material.customProgramCacheKey()).not.toBe(new T.MeshBasicMaterial().customProgramCacheKey());
});
it('updates only the existing material clock and exact lifetime fade, with no simulation mutation',()=>{
 const r=fixture(),p=Object.freeze({...pool});r.syncPools([p]);const mesh=r.poolMeshes.get(p.id)!,shader=shaderFor(mesh);
 expect(shader.uniforms.acidTime.value).toBe(3);
 r.syncPools([p]);expect(shader.uniforms.acidTime.value).toBe(3);
 r.time=3.05;r.syncPools([p]);expect(shader.uniforms.acidTime.value).toBe(3.05);
 for(const life of [4,1,.8,.1,0]){r.syncPools([{...p,life}]);expect(mesh.material.opacity).toBe(Math.min(.3,life*.3));expect(r.poolMeshes.get(p.id)).toBe(mesh);}
 const source=readFileSync(new URL('../src/render/DepthRenderer.ts',import.meta.url),'utf8');
 expect(source).toContain('this.syncPools(game.pools)');
 expect(source).toContain("const dt=game.status==='paused'||game.status==='reward'||game.status==='route'?0:Math.min(delta,.05);this.time+=dt");
});
it('disposes retired pools once and releases every pool on room reset and renderer disposal',()=>{
 const r=fixture();r.syncPools([pool,{...pool,id:18}]);const meshes=[...r.poolMeshes.values()];
 const disposed=meshes.map(m=>[vi.spyOn(m.geometry,'dispose'),vi.spyOn(m.material,'dispose')]);
 r.syncPools([{...pool,id:18}]);expect(r.poolMeshes.size).toBe(1);expect(meshes[0].parent).toBeNull();
 for(const spy of disposed[0])expect(spy).toHaveBeenCalledTimes(1);
 r.clearPools();r.clearPools();expect(r.poolMeshes.size).toBe(0);expect(r.scene.children).toHaveLength(0);
 for(const pair of disposed)for(const spy of pair)expect(spy).toHaveBeenCalledTimes(1);
 r.syncPools([pool]);expect(r.poolMeshes.get(pool.id)).not.toBe(meshes[0]);
 const source=readFileSync(new URL('../src/render/DepthRenderer.ts',import.meta.url),'utf8');
 expect(source.slice(source.indexOf(' loadRoom('),source.indexOf(' private wallPanel'))).toContain('this.clearPools()');
 expect(source.slice(source.indexOf(' dispose(){'))).toContain('this.clearPools()');
});
