#!/usr/bin/env python3
"""CPU-only independent bundle audit. Never writes the runtime asset directory.

Run: python3 tools/assets/passenger-vault/test_bundle_runtime.py
Pillow decodes the real PNGs. Node runs the installed Three GLTFLoader, with a
size-only ImageBitmap adapter because Node has no native image bitmap decoder.
This proves loader geometry/material creation, not GPU upload or room placement.
"""
import copy
import hashlib
import io
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest

import bundle_runtime as bundler

ROOT = Path(__file__).resolve().parents[3]
INPUT = ROOT / 'public/assets/passenger-vault/runtime'


def stable(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)


def digest(value):
    return hashlib.sha256(value).hexdigest()


def read(path):
    # Independent reader, deliberately not the writer's parser/remapping code.
    data = path.read_bytes()
    assert struct.unpack_from('<4sII', data) == (b'glTF', 2, len(data))
    length, kind = struct.unpack_from('<II', data, 12)
    assert kind == 0x4e4f534a
    doc = json.loads(data[20:20 + length])
    size, kind = struct.unpack_from('<II', data, 20 + length)
    assert kind == 0x004e4942
    blob = data[28 + length:28 + length + size]
    assert len(blob) == size
    return doc, blob


def snapshot(doc, blob, roots, kind='nodes'):
    """Resolve references to content, never to the writer's index maps.

    Identical local transforms and ordered parent edges prove equal world
    geometry. GLTFLoader below separately recomputes and hashes world triangles.
    Entire accessor backing views include UVs, normals, indices and padding.
    """
    cache = {}

    def resolve(kind, index):
        key = kind, index
        if key in cache:
            return cache[key]
        x = copy.deepcopy(doc[kind][index])
        if kind in ('materials', 'images', 'textures', 'samplers'):
            x.pop('name', None)
        if kind == 'bufferViews':
            start = x.pop('byteOffset', 0)
            assert x.pop('buffer') == 0
            x['payload'] = digest(blob[start:start + x['byteLength']])
        elif kind in ('accessors', 'images'):
            if 'bufferView' in x:
                x['bufferView'] = resolve('bufferViews', x['bufferView'])
            if 'sparse' in x:
                for part in ('indices', 'values'):
                    p = x['sparse'][part]
                    p['bufferView'] = resolve('bufferViews', p['bufferView'])
        elif kind == 'samplers':
            x.setdefault('wrapS', 10497)
            x.setdefault('wrapT', 10497)
        elif kind == 'textures':
            if 'source' in x:
                x['source'] = resolve('images', x['source'])
            if 'sampler' in x:
                x['sampler'] = resolve('samplers', x['sampler'])
        elif kind == 'materials':
            for parent in (x, x.get('pbrMetallicRoughness', {})):
                for name, value in parent.items():
                    if name.endswith('Texture'):
                        value['index'] = resolve('textures', value['index'])
        elif kind == 'meshes':
            for p in x['primitives']:
                for field, array in (('indices', 'accessors'), ('material', 'materials')):
                    if field in p:
                        p[field] = resolve(array, p[field])
                for attrs in [p['attributes']] + p.get('targets', []):
                    for name, accessor in attrs.items():
                        attrs[name] = resolve('accessors', accessor)
        elif kind == 'nodes':
            for field, array in (('mesh', 'meshes'), ('camera', 'cameras')):
                if field in x:
                    x[field] = resolve(array, x[field])
            # These seven static sources must not silently gain unsupported rigs.
            assert 'skin' not in x
            if 'children' in x:
                x['children'] = [resolve('nodes', child) for child in x['children']]
        cache[key] = digest(stable(x).encode())
        return cache[key]

    assert not doc.get('animations') and not doc.get('skins')
    return [resolve(kind, i) for i in roots]


LOADER_AUDIT = r"""
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Vector3 } from 'three';
globalThis.self = globalThis;
// Real PNG decoding is independently exercised by Pillow in the Python test.
globalThis.createImageBitmap = async blob => {
  const view = new DataView(await blob.arrayBuffer());
  return {width: view.getUint32(16), height: view.getUint32(20), close() {}};
};
const [input, output, familiesJSON] = process.argv.slice(1);
const families = JSON.parse(familiesJSON);
async function load(path) {
  const b = fs.readFileSync(path);
  const gltf = await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength), '');
  gltf.scene.updateMatrixWorld(true);
  return gltf;
}
function geometry(root) {
  const hashes = []; let triangles = 0;
  root.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry, position = g.attributes.position;
    const hash = crypto.createHash('sha256');
    const count = g.index ? g.index.count : position.count;
    assert.equal(count % 3, 0);
    triangles += count / 3;
    const v = new Vector3();
    for(let i=0;i<count;i++) {
      const index = g.index ? g.index.getX(i) : i;
      v.fromBufferAttribute(position,index).applyMatrix4(o.matrixWorld);
      hash.update(JSON.stringify(v.toArray()));
      for(const name of Object.keys(g.attributes).sort()) {
        if(name === 'position') continue;
        const a = g.attributes[name];
        hash.update(name + JSON.stringify(Array.from({length:a.itemSize}, (_,k)=>a.getComponent(index,k))));
      }
    }
    hashes.push(hash.digest('hex'));
  });
  return {triangles, primitives: hashes.sort()};
}
const bundled = await load(output), reports = [];
for(const family of families) {
  const source = await load(input + '/' + family + '.glb');
  const target = bundled.scene.children.find(o => o.name === family);
  assert.ok(target, 'missing family ' + family);
  const expected = geometry(source.scene), actual = geometry(target);
  assert.deepEqual(actual, expected, family + ' world triangle/attribute mismatch');
  reports.push({family, triangles:actual.triangles, primitives:actual.primitives.length});
}
const materials = new Set(), batches = new Map(), textures = new Set();
bundled.scene.traverse(o => {
  if (!o.isMesh) return;
  assert.ok(!Array.isArray(o.material));
  materials.add(o.material);
  const attrs = Object.entries(o.geometry.attributes).sort(([a],[b])=>a.localeCompare(b))
    .map(([k,a])=>k+':'+a.itemSize+':'+a.normalized+':'+a.array.constructor.name).join(',');
  const key = o.material.uuid + '/' + attrs;
  const entry = batches.get(key) || {material:o.material.name,attributes:attrs,primitives:0};
  entry.primitives++; batches.set(key,entry);
  for(const value of Object.values(o.material)) if(value?.isTexture) textures.add(value);
});
const textureReport = [...textures].map(t => {
  let w=t.image.width, h=t.image.height, bytes=0;
  do {
    bytes += w*h*4;
    if (!t.generateMipmaps || (w===1 && h===1)) break;
    w=Math.max(1,Math.floor(w/2)); h=Math.max(1,Math.floor(h/2));
  } while(true);
  return {name:t.name,width:t.image.width,height:t.image.height,
    generateMipmaps:t.generateMipmaps,minFilter:t.minFilter,rgbaMipBytes:bytes};
});
console.log(JSON.stringify({families:reports,uniqueMaterials:materials.size,
  compatibleAttributeBatches:batches.size,batches:[...batches.values()],
  textureObjects:textures.size,loadedTextureRgbaMipBytes:textureReport.reduce((n,t)=>n+t.rgbaMipBytes,0),
  textures:textureReport,imageBitmapAdapter:'dimensions only; Pillow validates PNG decoding separately'}));
"""


class BundleAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='passenger-independent-audit-')
        cls.output = Path(cls.temp.name) / 'equipment.glb'
        cls.manifest = bundler.bundle(INPUT, cls.output)
        cls.doc, cls.blob = read(cls.output)
        cls.sources = {f: read(INPUT / (f + '.glb')) for f in bundler.FAMILIES}

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def assert_family_equal(self, family, doc=None, blob=None):
        doc = self.doc if doc is None else doc
        blob = self.blob if blob is None else blob
        source, source_blob = self.sources[family]
        wrappers = [doc['nodes'][i] for i in doc['scenes'][doc.get('scene', 0)]['nodes']]
        root = next(n for n in wrappers if n.get('name') == family)
        self.assertEqual(set(root), {'name', 'children'}, 'family wrapper is not identity')
        self.assertEqual(snapshot(source, source_blob, source['scenes'][0]['nodes']),
                         snapshot(doc, blob, root['children']), family)

    def test_all_seven_source_graphs_and_resource_bindings(self):
        self.assertEqual(len(self.sources), 7)
        self.assertEqual([self.doc['nodes'][i]['name'] for i in self.doc['scenes'][0]['nodes']], list(bundler.FAMILIES))
        for family in bundler.FAMILIES:
            with self.subTest(family=family):
                self.assert_family_equal(family)

    def test_all_resources_including_unused_survive_dedup(self):
        for kind in ('bufferViews', 'accessors', 'images', 'samplers', 'textures', 'materials'):
            with self.subTest(kind=kind):
                expected = set()
                for source, blob in self.sources.values():
                    expected.update(snapshot(source, blob, range(len(source.get(kind, []))), kind))
                actual = snapshot(self.doc, self.blob, range(len(self.doc[kind])), kind)
                self.assertEqual(set(actual), expected, kind + ' content lost or changed')
                if kind in ('images', 'samplers', 'textures', 'materials'):
                    self.assertEqual(len(actual), len(expected), kind + ' not fully deduplicated')

    def test_determinism_and_existing_runtime_manifest(self):
        other = Path(self.temp.name) / 'repeat/equipment.glb'
        bundler.bundle(INPUT, other)
        self.assertEqual(self.output.read_bytes(), other.read_bytes())
        self.assertEqual(self.output.with_suffix('.manifest.json').read_bytes(), other.with_suffix('.manifest.json').read_bytes())
        runtime = INPUT / 'equipment.glb'
        self.assertEqual(runtime.read_bytes(), self.output.read_bytes(), 'runtime bundle is stale')
        manifest = json.loads(runtime.with_suffix('.manifest.json').read_text())
        self.assertEqual(manifest, self.manifest, 'runtime manifest is stale')

    def test_corruption_controls(self):
        # Each mutation must be rejected by content/graph comparison, not hashes
        # recorded by the bundler or by its own remap implementation.
        primitives = [p for m in self.doc['meshes'] for p in m['primitives']]
        uv_primitive = next(p for p in primitives if 'TEXCOORD_0' in p['attributes'])
        cases = ['transform', 'position', 'uv', 'indices', 'material', 'texture', 'sampler', 'image']
        for case in cases:
            with self.subTest(corruption=case):
                doc, blob = copy.deepcopy(self.doc), bytearray(self.blob)
                p = doc['meshes'][0]['primitives'][0]
                if case == 'transform':
                    doc['nodes'][0]['translation'] = [123, 456, 789]
                elif case in ('position', 'uv', 'indices'):
                    idx = (p['attributes']['POSITION'] if case == 'position' else
                           uv_primitive['attributes']['TEXCOORD_0'] if case == 'uv' else p['indices'])
                    accessor = doc['accessors'][idx]
                    view = doc['bufferViews'][accessor['bufferView']]
                    blob[view.get('byteOffset', 0) + accessor.get('byteOffset', 0)] ^= 1
                elif case == 'material':
                    p['material'] = (p['material'] + 1) % len(doc['materials'])
                elif case == 'texture':
                    tex = next(m['pbrMetallicRoughness']['baseColorTexture'] for m in doc['materials']
                               if 'baseColorTexture' in m.get('pbrMetallicRoughness', {}))
                    tex['index'] = (tex['index'] + 1) % len(doc['textures'])
                elif case == 'sampler':
                    doc['samplers'][0]['wrapS'] = 33071 if doc['samplers'][0].get('wrapS', 10497) != 33071 else 10497
                else:
                    view = doc['bufferViews'][doc['images'][0]['bufferView']]
                    blob[view.get('byteOffset', 0) + 50] ^= 1
                rejected = False
                for family in bundler.FAMILIES:
                    try:
                        self.assert_family_equal(family, doc, blob)
                    except AssertionError:
                        rejected = True
                        break
                self.assertTrue(rejected, case + ' corruption escaped')
        print('PASS: 8 negative controls: ' + ', '.join(cases))

    def test_png_decode_and_resource_dedup(self):
        from PIL import Image
        image_hashes, decoded = set(), 0
        for image in self.doc['images']:
            view = self.doc['bufferViews'][image['bufferView']]
            start = view.get('byteOffset', 0)
            payload = self.blob[start:start + view['byteLength']]
            self.assertNotIn(digest(payload), image_hashes)
            image_hashes.add(digest(payload))
            with Image.open(io.BytesIO(payload)) as png:
                rgba = png.convert('RGBA')
                rgba.load()
                w, h = rgba.size
                self.assertEqual(len(rgba.tobytes()), w * h * 4)
                while True:
                    decoded += w * h * 4
                    if w == h == 1:
                        break
                    w, h = max(1, w // 2), max(1, h // 2)
        for kind in ('materials', 'textures', 'samplers'):
            values = []
            for item in self.doc[kind]:
                item = copy.deepcopy(item)
                item.pop('name', None)
                if kind == 'samplers':
                    item.setdefault('wrapS', 10497)
                    item.setdefault('wrapT', 10497)
                values.append(stable(item))
            self.assertEqual(len(values), len(set(values)), kind + ' duplicate remains')
        self.assertEqual(decoded, self.manifest['decoded_unique_rgba_mip_bytes'])
        self.assertLessEqual(decoded, 32 * 1024**2)
        print(f'PASS: {len(image_hashes)} real PNG decodes; RGBA8 full mip bytes={decoded}, MiB={decoded / 1024**2:.6f}')

    def test_actual_gltfloader_world_triangles_and_batches(self):
        result = subprocess.run(['node', '--input-type=module', '-e', LOADER_AUDIT,
                                 str(INPUT), str(self.output), json.dumps(bundler.FAMILIES)],
                                cwd=ROOT, text=True, capture_output=True, timeout=90)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report['uniqueMaterials'], len(self.doc['materials']))
        self.assertLessEqual(report['uniqueMaterials'], 8)
        self.assertEqual(len(report['families']), 7)
        print('GLTFLoader CPU: ' + stable(report))


if __name__ == '__main__':
    unittest.main(verbosity=2)
