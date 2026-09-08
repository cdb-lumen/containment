"""Blender GLB roundtrip clearance and embedded PBR checks, no renderer changes."""
import bpy,json,pathlib,struct,math,os
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1];path=ROOT/'public/assets/awakening/released-berth/released-berth.glb'
raw=path.read_bytes();assert raw[:4]==b'glTF';length,kind=struct.unpack_from('<II',raw,12);doc=json.loads(raw[20:20+length]);assert kind==0x4e4f534a
for m in doc['meshes']:
 for p in m['primitives']:assert {'POSITION','NORMAL','TEXCOORD_0'}<=p['attributes'].keys()
textured=[m for m in doc['materials'] if 'baseColorTexture' in m.get('pbrMetallicRoughness',{})]
assert len(textured)>=6
assert sum('metallicRoughnessTexture' in m.get('pbrMetallicRoughness',{}) for m in doc['materials'])>=5
assert all('bufferView' in image for image in doc['images'])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=str(path));bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
def top(x,y):
 hit,loc,normal,index,obj,matrix=bpy.context.scene.ray_cast(deps,Vector(((x-135)/32,-(y-440)/32,3)),Vector((0,0,-1)))
 assert hit,(x,y)
 return loc.z*32
# Real downward rays verify no lid over the usable interior or raised landing.
bed=[top(x,y) for x in [120,136,152] for y in [410,419,430,441,452,463,476]]
assert max(bed)<15,bed
landing=[top(x,y) for x in [181,188,209,230,237] for y in [381,392,420,440,470,488,499]]
assert max(landing)<=.601,landing
# East exit has no handrail. Preserve the original north actuator sleeve at
# height 21.1 through y414; the central transfer guide tops out at 17.5.
exit_heights=[top(x,y) for x in [166,169,173,176,178] for y in [410,440,470]]
assert max(exit_heights)<=21.11,exit_heights
assert max(top(x,y) for x in [166,169,173,176,178] for y in [430,440,470])<=17.51
# Parked lid exists only north of usable interior and fits the frozen height.
lid=[top(x,y) for x in [110,135,160] for y in [389,395,401]]
assert min(lid)>20 and max(lid)<=40
stats={'checks':'PASS','bedRayCount':len(bed),'bedMaxHeightGame':max(bed),'landingRayCount':len(landing),'landingMaxHeightGame':max(landing),'eastExitRayCount':len(exit_heights),'eastGuideMaxHeightGame':max(exit_heights),'parkedLidRayCount':len(lid),'embeddedImages':len(doc['images']),'texturedMaterials':len(textured),'allPrimitivesNormalsAndUV':True,'runtimeIntegrationVerified':False}
E=pathlib.Path(os.environ.get('BERTH_EVIDENCE','/home/chernodubv/.hermes/workspaces/containment-awakening-completion/released-berth'));(E/'clearance-verification.json').write_text(json.dumps(stats,indent=2));print(json.dumps(stats))
