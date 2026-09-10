#!/usr/bin/env python3
"""Lossless, deterministic, CPU-only glTF 2.0 equipment bundler (stdlib).

Run with --self-test to build twice in temporary directories and compare bytes.
Only the seven named sources are read. No resampling, mesh merging or runtime edits.
Unknown extensions fail closed rather than leaving unremapped extension indices.
Scene topology and every accessor's entire backing view are verified after serialization.
Draw counts describe unbatched source instances, NOT the integrated room.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import zlib

FAMILIES = ('chamber', 'distribution-north', 'distribution-south', 'monitor-north',
            'monitor-south', 'row-carrier', 'service-finish')
ARRAYS = ('bufferViews', 'accessors', 'images', 'samplers', 'textures', 'materials',
          'meshes', 'cameras', 'skins', 'nodes', 'animations')
LIMITS = {'placed_triangles': 100000, 'added_main_pass_draws': 48,
          'shared_materials': 8, 'decoded_rgba_mip_bytes': 32 * 1024**2,
          'transfer_bytes': 16 * 1024**2}


def require(ok, message):
    if not ok:
        raise ValueError(message)


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_glb(path):
    data = path.read_bytes()
    require(len(data) >= 28, 'truncated GLB')
    magic, version, size = struct.unpack_from('<4sII', data)
    require((magic, version, size) == (b'glTF', 2, len(data)), 'invalid GLB header')
    chunks = []
    pos = 12
    while pos < len(data):
        require(pos + 8 <= len(data), 'truncated chunk header')
        length, kind = struct.unpack_from('<II', data, pos)
        pos += 8
        require(length % 4 == 0 and pos + length <= len(data), 'invalid chunk bounds')
        chunks.append((kind, data[pos:pos + length]))
        pos += length
    require([x[0] for x in chunks] == [0x4E4F534A, 0x004E4942], 'expected JSON and BIN')
    doc = json.loads(chunks[0][1])
    require(doc['asset']['version'] == '2.0', 'unsupported glTF version')
    require(len(doc['buffers']) == 1 and 'uri' not in doc['buffers'][0], 'embedded buffer required')
    length = doc['buffers'][0]['byteLength']
    require(0 <= len(chunks[1][1]) - length <= 3, 'buffer length mismatch')
    return doc, chunks[1][1][:length], data


def view_bytes(doc, binary, index):
    require(type(index) is int and 0 <= index < len(doc['bufferViews']), 'bad view index')
    view = doc['bufferViews'][index]
    start, length = view.get('byteOffset', 0), view['byteLength']
    require(view['buffer'] == 0 and start >= 0 and length > 0 and start + length <= len(binary), 'bad view bounds')
    return binary[start:start + length]


def check_extensions(obj):
    if isinstance(obj, dict):
        require(set(obj.get('extensions', {})) <= {'KHR_texture_transform'}, 'unsupported extension')
        for k, v in obj.items():
            if k != 'extras':
                check_extensions(v)
    elif isinstance(obj, list):
        for v in obj:
            check_extensions(v)


def remap(kind, obj, maps):
    """All core glTF array references, including sparse/morph/skin/animation."""
    x = copy.deepcopy(obj)
    def ref(o, key, array):
        if key in o:
            i = o[key]
            require(type(i) is int and 0 <= i < len(maps[array]), 'bad ' + array + ' reference')
            o[key] = maps[array][i]
    if kind == 'accessors':
        ref(x, 'bufferView', 'bufferViews')
        if 'sparse' in x:
            for k in ('indices', 'values'):
                ref(x['sparse'][k], 'bufferView', 'bufferViews')
    elif kind == 'images':
        require('uri' not in x and x.get('mimeType') == 'image/png', 'embedded PNG required')
        ref(x, 'bufferView', 'bufferViews')
    elif kind == 'textures':
        ref(x, 'source', 'images')
        ref(x, 'sampler', 'samplers')
    elif kind == 'materials':
        for key in ('normalTexture', 'occlusionTexture', 'emissiveTexture'):
            if key in x:
                ref(x[key], 'index', 'textures')
        for key in ('baseColorTexture', 'metallicRoughnessTexture'):
            if key in x.get('pbrMetallicRoughness', {}):
                ref(x['pbrMetallicRoughness'][key], 'index', 'textures')
    elif kind == 'meshes':
        for p in x['primitives']:
            ref(p, 'indices', 'accessors')
            ref(p, 'material', 'materials')
            for attrs in [p['attributes']] + p.get('targets', []):
                for key in attrs:
                    ref(attrs, key, 'accessors')
    elif kind == 'nodes':
        for key, array in [('mesh', 'meshes'), ('camera', 'cameras'), ('skin', 'skins')]:
            ref(x, key, array)
        if 'children' in x:
            x['children'] = [mapped(maps['nodes'], i) for i in x['children']]
    elif kind == 'skins':
        ref(x, 'inverseBindMatrices', 'accessors')
        ref(x, 'skeleton', 'nodes')
        x['joints'] = [mapped(maps['nodes'], i) for i in x['joints']]
    elif kind == 'animations':
        for sampler in x['samplers']:
            ref(sampler, 'input', 'accessors')
            ref(sampler, 'output', 'accessors')
        for channel in x['channels']:
            require(0 <= channel['sampler'] < len(x['samplers']), 'bad animation sampler')
            ref(channel['target'], 'node', 'nodes')
    return x


def mapped(mapping, index):
    require(type(index) is int and 0 <= index < len(mapping), 'invalid index')
    return mapping[index]


def semantic(kind, obj):
    x = copy.deepcopy(obj)
    if kind in ('materials', 'images', 'samplers', 'textures'):
        x.pop('name', None)  # Labels do not change rendering; first label wins.
    if kind == 'samplers':
        x.setdefault('wrapS', 10497)
        x.setdefault('wrapT', 10497)
    return x


def png_info(data):
    require(data[:8] == b'\x89PNG\r\n\x1a\n', 'invalid PNG signature')
    pos, dimensions, ended = 8, None, False
    while pos < len(data):
        require(pos + 12 <= len(data), 'truncated PNG')
        n = struct.unpack_from('>I', data, pos)[0]
        kind = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + n]
        require(pos + 12 + n <= len(data), 'PNG bounds')
        crc = struct.unpack_from('>I', data, pos + 8 + n)[0]
        require(zlib.crc32(kind + body) & 0xffffffff == crc, 'PNG CRC')
        if dimensions is None:
            require(kind == b'IHDR' and n == 13, 'PNG IHDR')
            dimensions = struct.unpack_from('>II', body)
            require(min(dimensions) > 0, 'zero PNG dimensions')
        pos += n + 12
        if kind == b'IEND':
            require(n == 0 and pos == len(data), 'PNG trailing bytes')
            ended = True
    require(ended, 'missing IEND')
    if dimensions is None:
        raise ValueError('missing PNG dimensions')
    w, h = dimensions
    total = 0
    while True:
        total += w * h * 4
        if w == h == 1:
            break
        w, h = max(1, w // 2), max(1, h // 2)
    return {'width': dimensions[0], 'height': dimensions[1], 'rgba_mip_bytes': total, 'sha256': sha(data)}


def validate_accessor(doc, binary, accessor):
    widths = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
    shapes = {'SCALAR': (1, 1), 'VEC2': (1, 2), 'VEC3': (1, 3),
              'VEC4': (1, 4), 'MAT2': (2, 2), 'MAT3': (3, 3), 'MAT4': (4, 4)}
    require(accessor['componentType'] in widths and accessor['type'] in shapes, 'invalid accessor type')
    width = widths[accessor['componentType']]
    columns, rows = shapes[accessor['type']]
    column_bytes = rows * width
    if columns > 1:
        column_bytes += -column_bytes % 4
    element_bytes = columns * column_bytes
    count = accessor['count']
    require(type(count) is int and count > 0, 'invalid accessor count')
    def bounds(part, length, element, alignment, interleaved=False):
        payload = view_bytes(doc, binary, part['bufferView'])
        view = doc['bufferViews'][part['bufferView']]
        offset = part.get('byteOffset', 0)
        stride = view.get('byteStride', element) if interleaved else element
        require(offset >= 0 and offset % alignment == 0 and stride >= element,
                'invalid accessor alignment or stride')
        require(offset + (length - 1) * stride + element <= len(payload), 'accessor exceeds view')
    if 'bufferView' in accessor:
        bounds(accessor, count, element_bytes, width, True)
    if 'sparse' in accessor:
        sparse = accessor['sparse']
        require(0 < sparse['count'] <= count, 'invalid sparse count')
        require(sparse['indices']['componentType'] in (5121, 5123, 5125), 'invalid sparse indices')
        iw = widths[sparse['indices']['componentType']]
        bounds(sparse['indices'], sparse['count'], iw, iw)
        bounds(sparse['values'], sparse['count'], element_bytes, width)


def scene_counts(doc, roots):
    seen, active = set(), set()
    triangles = draws = 0
    def visit(i):
        nonlocal triangles, draws
        require(0 <= i < len(doc['nodes']) and i not in active and i not in seen, 'scene cycle or multiple parents')
        seen.add(i)
        active.add(i)
        node = doc['nodes'][i]
        if 'mesh' in node:
            for p in doc['meshes'][node['mesh']]['primitives']:
                require(p.get('mode', 4) == 4, 'only triangle primitives supported for budget')
                accessor = doc['accessors'][p.get('indices', p['attributes']['POSITION'])]
                require(accessor['count'] % 3 == 0, 'triangle index count')
                triangles += accessor['count'] // 3
                draws += 1
        for child in node.get('children', []):
            visit(child)
        active.remove(i)
    for root in roots:
        visit(root)
    return {'triangles_one_instance': triangles, 'unbatched_draws_one_instance': draws, 'reachable_nodes': len(seen)}


def bundle(input_dir, output):
    require(output.resolve() not in [(input_dir / (f + '.glb')).resolve() for f in FAMILIES], 'cannot overwrite a source')
    out = {'asset': {'version': '2.0', 'generator': 'passenger-vault stdlib lossless bundler v1'},
           **{k: [] for k in ARRAYS}, 'scenes': [{'name': 'equipment', 'nodes': []}], 'scene': 0}
    binary, caches, records, sources = bytearray(), {k: {} for k in ARRAYS}, [], []
    for family in FAMILIES:
        path = input_dir / (family + '.glb')
        doc, blob, raw = read_glb(path)
        require(set(doc) <= set(ARRAYS) | {'asset', 'buffers', 'scenes', 'scene', 'extensionsUsed', 'extensionsRequired', 'extras'}, 'unsupported top-level field')
        check_extensions(doc)
        for key in ('extensionsUsed', 'extensionsRequired'):
            require(set(doc.get(key, [])) <= {'KHR_texture_transform'}, 'unsupported declared extension')
            if doc.get(key):
                out[key] = sorted(set(out.get(key, [])) | set(doc[key]))
        require(len(doc['scenes']) == 1 and doc.get('scene', 0) == 0, 'exactly one scene per family required')
        maps = {k: list(range(len(out[k]), len(out[k]) + len(doc.get(k, [])))) for k in ARRAYS}
        # Node/skin forward references use the append-only reserved maps above.
        for kind in ARRAYS:
            for i, source in enumerate(doc.get(kind, [])):
                if kind == 'bufferViews':
                    payload = view_bytes(doc, blob, i)
                    value = copy.deepcopy(source)
                    value['buffer'] = 0
                    value.pop('byteOffset', None)
                    key = (canonical(value), payload)
                    if key in caches[kind]:
                        maps[kind][i] = caches[kind][key]
                        continue
                    binary.extend(b'\0' * (-len(binary) % 4))
                    value['byteOffset'] = len(binary)
                    binary.extend(payload)
                else:
                    value = remap(kind, source, maps)
                    key = canonical(semantic(kind, value))
                    if kind in ('images', 'samplers', 'textures', 'materials') and key in caches[kind]:
                        maps[kind][i] = caches[kind][key]
                        continue
                maps[kind][i] = len(out[kind])
                caches[kind][key] = len(out[kind])
                out[kind].append(value)
        roots = [mapped(maps['nodes'], i) for i in doc['scenes'][0].get('nodes', [])]
        root = len(out['nodes'])
        require(family not in {n.get('name') for n in out['nodes']}, 'family root name collision')
        out['nodes'].append({'name': family, 'children': roots})
        out['scenes'][0]['nodes'].append(root)
        records.append({'family': family, 'input_sha256': sha(raw), 'input_bytes': len(raw),
                        'root_node': root, **scene_counts(doc, doc['scenes'][0].get('nodes', []))})
        sources.append((doc, blob, maps, path, sha(raw)))
    out['buffers'] = [{'byteLength': len(binary)}]
    encoded = canonical(out)
    encoded += b' ' * (-len(encoded) % 4)
    binary.extend(b'\0' * (-len(binary) % 4))
    result = (struct.pack('<4sII', b'glTF', 2, 28 + len(encoded) + len(binary)) +
              struct.pack('<II', len(encoded), 0x4E4F534A) + encoded +
              struct.pack('<II', len(binary), 0x004E4942) + binary)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(result)
    actual, actual_bin, actual_raw = read_glb(output)
    require(actual_raw == result, 'output readback mismatch')
    verified_accessors = 0
    for record, (doc, blob, maps, path, digest) in zip(records, sources):
        require(sha(path.read_bytes()) == digest, 'source changed during bundling')
        for kind in ARRAYS:
            for i, source in enumerate(doc.get(kind, [])):
                target = actual[kind][maps[kind][i]]
                if kind == 'bufferViews':
                    require(view_bytes(doc, blob, i) == view_bytes(actual, actual_bin, maps[kind][i]), 'backing bytes changed')
                    a, b = copy.deepcopy(source), copy.deepcopy(target)
                    a.pop('byteOffset', None)
                    b.pop('byteOffset', None)
                    require(a == b, 'view layout changed')
                else:
                    require(semantic(kind, remap(kind, source, maps)) == semantic(kind, target), 'semantic reference changed: ' + kind)
                if kind == 'accessors':
                    validate_accessor(doc, blob, source)
                    validate_accessor(actual, actual_bin, target)
                    verified_accessors += 1
        # Identical local matrix/TRS + identical mapped parent edges + identity family
        # wrapper proves identical world transforms without floating-point recomputation.
        require(actual['nodes'][record['root_node']] == {
            'name': record['family'],
            'children': [mapped(maps['nodes'], i) for i in doc['scenes'][0].get('nodes', [])]
        }, 'family identity wrapper or scene roots changed')
    require(actual['scenes'][0]['nodes'] == [r['root_node'] for r in records], 'bundle scene roots changed')
    images = [png_info(view_bytes(actual, actual_bin, im['bufferView'])) for im in actual['images']]
    require(len({im['sha256'] for im in images}) == len(images), 'duplicate PNG remains')
    counts = {k: len(actual[k]) for k in ARRAYS}
    decoded = sum(im['rgba_mip_bytes'] for im in images)
    checks = {'shared_materials': counts['materials'] <= LIMITS['shared_materials'],
              'decoded_rgba_mip_bytes': decoded <= LIMITS['decoded_rgba_mip_bytes'],
              'transfer_bytes': len(result) <= LIMITS['transfer_bytes']}
    manifest = {'schema': 1, 'output': output.name, 'output_sha256': sha(result),
                'transfer_bytes': len(result), 'decoded_unique_rgba_mip_bytes': decoded,
                'decode_estimate_policy': 'RGBA8, complete mip chain for every unique embedded image, including unused images; conservative when sampler disables mipmaps',
                'counts': counts, 'families': records, 'images': images, 'limits': LIMITS,
                'shared_resource_checks': checks, 'shared_resource_budget_pass': all(checks.values()),
                'placement_budget_status': 'NOT VERIFIED: runtime placement multiplicities and batching required; raw per-family draws are not added main-pass draws',
                'integrity': {'accessors_verified': verified_accessors, 'all_backing_view_bytes_equal': True,
                              'all_core_semantic_references_equal': True, 'node_local_transforms_and_parent_edges_equal': True,
                              'original_inputs_unchanged': True, 'texels_modified': False}}
    manifest_path = output.with_suffix('.manifest.json')
    text = json.dumps(manifest, indent=2, sort_keys=True) + '\n'
    require(len(text) < 32768, 'manifest exceeds bound')
    manifest_path.write_text(text)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    default = Path(__file__).resolve().parents[3] / 'public/assets/passenger-vault/runtime'
    parser.add_argument('--input-dir', type=Path, default=default)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    output = args.output or args.input_dir / 'equipment.glb'
    manifest = bundle(args.input_dir, output)
    if args.self_test:
        with tempfile.TemporaryDirectory(prefix='passenger-bundle-') as temp:
            a, b = Path(temp) / 'a/equipment.glb', Path(temp) / 'b/equipment.glb'
            bundle(args.input_dir, a)
            bundle(args.input_dir, b)
            require(a.read_bytes() == b.read_bytes() == output.read_bytes(), 'nondeterministic GLB')
            require(a.with_suffix('.manifest.json').read_bytes() == b.with_suffix('.manifest.json').read_bytes(), 'nondeterministic manifest')
        print('PASS: two temporary builds byte-identical; serialized semantic and backing-byte integrity verified')
    print(json.dumps({'sha256': manifest['output_sha256'], 'counts': manifest['counts'],
                      'decoded_rgba_mip_bytes': manifest['decoded_unique_rgba_mip_bytes'],
                      'transfer_bytes': manifest['transfer_bytes'], 'checks': manifest['shared_resource_checks']}))
    if not manifest['shared_resource_budget_pass']:
        raise SystemExit('FAIL: shared resource budget exceeded; diagnostic output retained')


if __name__ == '__main__':
    main()
