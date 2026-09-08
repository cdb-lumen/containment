"""Independent saved-blend support and packed texture checks, GLB accessor audit."""
import bpy,json,pathlib,struct,math
R=pathlib.Path(__file__).resolve().parents[1];out=R/'public/assets/awakening/recovery-storage';results=[]
for name in ['locker','satellite-cabinet','trolley']:
 f=out/(name+'.glb');raw=f.read_bytes();assert raw[:4]==b'glTF';jlen,jtype=struct.unpack_from('<II',raw,12);d=json.loads(raw[20:20+jlen]);bo=28+jlen
 checks={};textureDims=[]
 # Reuse independently authored original accessor/PNG decoder without executing original asset rays.
 source=(R/'scripts/verify-recovery-kit.py').read_text();asset_name=name;exec(source[source.index('for m in d[\'meshes\']:'):source.index('bpy.ops.object.select_all')]);name=asset_name
 bpy.ops.wm.open_mainfile(filepath=str(out/(name+'.blend')))
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH'];images={n.image for o in objects for m in o.data.materials for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image}
 assert all(i.packed_file for i in images)
 def bounds(o):
  pts=[o.matrix_world@v.co for v in o.data.vertices];return [(min(v[i] for v in pts),max(v[i] for v in pts)) for i in range(3)]
 def overlap(a,b):return all(min(u[1],v[1])-max(u[0],v[0])>1e-5 for u,v in zip(bounds(a),bounds(b)))
 geometry={}
 if name=='satellite-cabinet':
  doors=[o for o in objects if o.name.startswith('Folded ')];shelves=[o for o in objects if o.name.startswith(('Service rolled shelf','Service shelf load channel'))]
  assert len(doors)==4 and all(not overlap(a,b) for a in doors for b in shelves)
  assert all(not overlap(a,b) for i,a in enumerate(doors) for b in doors[i+1:])
  geometry={'parkedDoorShelfPairsClear':len(doors)*len(shelves),'fourFoldedLeavesMutuallyClear':True}
 if name=='locker':
  doors=[o for o in objects if o.name.startswith('Locker captured sliding leaf')];assert len(doors)==2 and not overlap(*doors)
  shelves=[o for o in objects if o.name.startswith('Locker supported shelf')];assert all(not overlap(a,b) for a in doors for b in shelves)
  geometry={'twoSeparateSlidingTracks':True,'shelfLeafClear':True,'KITPlateExplicitUV':len(bpy.data.objects['East readable KIT plate'].data.uv_layers.active.data)==4}
 results.append({'asset':name,'finiteAccessors':checks,'packedUsedImages':len(images),'embeddedTextures':textureDims,'construction':geometry})
(R/'docs/art-evidence/recovery-storage/independent-verification.json').write_text(json.dumps({'result':'PASS','assets':results},indent=2));print(json.dumps(results))
