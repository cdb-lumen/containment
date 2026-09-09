"""CPU artifact integrity, exact inventory and actual decoded vertex bounds."""
import hashlib
import json
import math
import struct
import sys
import unittest
from pathlib import Path
ROOT=Path(sys.argv.pop(1)).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[3]
NAMES={'deck_plinth','back_wall','side_north','side_south','central_bulkhead','service_worktop','instrument_wedge','operating_display','display_bezel','rear_service_cover','instrument_cheek_north','instrument_cheek_south',*[f'{p}_{i}' for p in ['service_panel','latch','panel_seam','electronics_tray','electronics_pack'] for i in range(2)]}

class MonitorArtifacts(unittest.TestCase):
    def test_exact_package(self):
        out=ROOT/'tools/assets/passenger-vault/monitoring';m=json.loads((out/'manifest.json').read_text())
        expected={f'public/assets/passenger-vault/monitor-{v}.glb' for v in ['north','south']}|{f'tools/assets/passenger-vault/monitoring/{v}.{ext}' for v in ['north','south'] for ext in ['blend']}|{f'tools/assets/passenger-vault/monitoring/{n}.png' for n in ['north-closed','north-cutaway','south-closed','south-cutaway','room-placement']}
        self.assertEqual(set(m['files']),expected)
        for name,r in m['files'].items():
            raw=(ROOT/name).read_bytes();self.assertEqual(len(raw),r['bytes']);self.assertEqual(hashlib.sha256(raw).hexdigest(),r['sha256'])
        for variant,h in [('north',1.21),('south',.96)]:
            raw=(ROOT/f'public/assets/passenger-vault/monitor-{variant}.glb').read_bytes()
            self.assertEqual(raw[:4],b'glTF');self.assertEqual(struct.unpack_from('<II',raw,4),(2,len(raw)))
            length=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+length]);binary=raw[28+length:]
            self.assertNotIn('images',doc);self.assertNotIn('animations',doc);self.assertEqual(len(doc['materials']),3)
            self.assertEqual(len(doc['nodes']),22);self.assertEqual({n['name'] for n in doc['nodes']},NAMES)
            self.assertEqual(len(doc['meshes']),22)
            def accessor(index):
                a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];fmt={5126:'f',5123:'H',5125:'I'}[a['componentType']];count={'SCALAR':1,'VEC3':3}[a['type']];stride=v.get('byteStride',struct.calcsize('<'+fmt)*count);start=v.get('byteOffset',0)+a.get('byteOffset',0)
                return [struct.unpack_from('<'+fmt*count,binary,start+i*stride) for i in range(a['count'])]
            vertices=[];triangles=0
            for n in doc['nodes']:
                self.assertNotIn('matrix',n);self.assertEqual(n.get('scale',[1,1,1]),[1,1,1]);self.assertEqual(n.get('rotation',[0,0,0,1]),[0,0,0,1])
                t=n.get('translation',[0,0,0])
                for p in doc['meshes'][n['mesh']]['primitives']:
                    self.assertIn('NORMAL',p['attributes']);v=accessor(p['attributes']['POSITION']);idx=accessor(p['indices']);self.assertEqual(len(idx)%3,0)
                    self.assertTrue(all(0<=i[0]<len(v) for i in idx));triangles+=len(idx)//3
                    vertices.extend(tuple(a+b for a,b in zip(x,t)) for x in v)
            self.assertTrue(all(math.isfinite(c) for v in vertices for c in v))
            for axis,low,high in [(0,-1.875,1.875),(1,0,h),(2,-1.25,1.25)]:
                self.assertAlmostEqual(min(v[axis] for v in vertices),low,places=5);self.assertAlmostEqual(max(v[axis] for v in vertices),high,places=5)
            self.assertEqual(triangles,264);r=m['validation'][variant];self.assertEqual(r['triangles'],triangles)
            self.assertEqual([r[k] for k in ['deck_probes','support_contacts','exposed_fittings','closed_front_probes']],[9,12,11,18])
        self.assertEqual([r['id'] for r in m['validation']['room_context']['monitors']],['MN','MS'])
        self.assertEqual(len(list(out.glob('*.png'))),5)
        for path in out.glob('*.png'):
            raw=path.read_bytes();self.assertEqual(raw[:8],b'\x89PNG\r\n\x1a\n');self.assertEqual(struct.unpack_from('>II',raw,16),(1200,800))
if __name__=='__main__':unittest.main()
