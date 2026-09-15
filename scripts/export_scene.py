"""Run with Blender --background --disable-autoexec <source.blend> --python this-file."""
import bpy, json, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Original remains untouched. Remove display-only people; game owns all NPCs.
for o in list(bpy.data.objects):
 if o.type not in {'MESH','FONT'} or o.name.startswith('Pedestrians'):
  bpy.data.objects.remove(o,do_unlink=True)
# Bake material color/roughness to portable PBR. Procedural Cycles nodes do not export.
for m in bpy.data.materials:
 col=tuple(m.diffuse_color)
 m.use_nodes=True;m.node_tree.nodes.clear()
 out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');p=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
 p.inputs['Base Color'].default_value=col;p.inputs['Roughness'].default_value=.9
 m.node_tree.links.new(p.outputs['BSDF'],out.inputs['Surface'])
# Terrain sampling: ground and bridge deck only, excluding decorative arch ribs.
verts=[];faces=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 if not any(s in o.name for s in ['Canal,','foundation','Boulevards,','bridge •']):continue
 mat=o.matrix_world
 for p in o.data.polygons:
  vv=[mat@o.data.vertices[i].co for i in p.vertices]
  if max(v.z for v in vv)>2.5 or min(v.z for v in vv)<.8:continue
  if abs(p.normal.z)<.5:continue
  base=len(verts);verts.extend(vv);faces.append(tuple(range(base,base+len(vv))))
bvh=BVHTree.FromPolygons(verts,faces)
heights=[]
for iz in range(257):
 for ix in range(257):
  x=-64+ix*.5;z=-70+iz*.5
  hit=bvh.ray_cast(Vector((x/.55,(19.25-z)/.55,3)),Vector((0,0,-1)),4)
  heights.append(round((hit[0].z-1.3)*.55,3) if hit[0] else -99)
# Collisions for merged railings, vehicles, tree trunks and street furniture.
cv=[];cf=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH' or not any(t in o.name for t in ['Canal,','City traffic','Sakura, greenery','Landmark garden']):continue
 base=len(cv);cv.extend(o.matrix_world@v.co for v in o.data.vertices)
 cf.extend(tuple(base+i for i in p.vertices) for p in o.data.polygons)
cbvh=BVHTree.FromPolygons(cv,cf)
blocked=[]
for iz in range(257):
 for ix in range(257):
  x=(-64+ix*.5)/.55;y=(19.25-(-70+iz*.5))/.55
  blocked.append(int(any(cbvh.ray_cast(Vector((x,y,2.2)),Vector(d),.5)[0] is not None for d in [(1,0,0),(-1,0,0),(0,1,0),(0,-1,0)])))
json.dump({'minX':-64,'minZ':-70,'step':.5,'size':257,'heights':heights,'blocked':blocked},open(ROOT+'/assets/scenes/terrain.json','w'))
# One vertex-colored material per object keeps browser draw calls low.
shared=bpy.data.materials.new('Baked voxel palette');shared.use_nodes=True
shared.node_tree.nodes.clear();bsdf=shared.node_tree.nodes.new('ShaderNodeBsdfPrincipled');out=shared.node_tree.nodes.new('ShaderNodeOutputMaterial');shared.node_tree.links.new(bsdf.outputs['BSDF'],out.inputs['Surface']);bsdf.inputs['Roughness'].default_value=.95
color=shared.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Color'
shared.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color'])
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 mesh=o.data
 palette=[tuple(m.diffuse_color) if m else (.5,.5,.5,1) for m in mesh.materials]
 attr=mesh.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER')
 for p in mesh.polygons:
  col=palette[p.material_index] if p.material_index<len(palette) else (.5,.5,.5,1)
  shade=.94+((p.index*13)%11)*.012
  rgba=tuple(min(1,c*shade) for c in col[:3])+(1,)
  for li in p.loop_indices:attr.data[li].color=rgba
 mesh.materials.clear();mesh.materials.append(shared)
 for p in mesh.polygons:p.material_index=0
bpy.ops.export_scene.gltf(filepath=ROOT+'/assets/scenes/riverside.glb',export_format='GLB',export_cameras=False,export_lights=False,export_animations=False,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
