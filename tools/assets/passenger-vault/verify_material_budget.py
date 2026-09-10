"""Independent exported-GLB budget audit, using the CPU regression's decoder.

Print JSON to stdout. Does not rewrite prior receipts or claim pixel acceptance.
"""
import hashlib
import json
from test_material_budget import FAMILIES, OUT, ROOT, glb, signature


def audit(paths):
    groups, used_groups, families = {}, set(), {}
    for family, path in paths.items():
        doc, binary = glb(path)
        used = {p['material'] for m in doc['meshes'] for p in m['primitives']}
        for index, material in enumerate(doc['materials']):
            definition = signature(material, doc, binary)
            digest = hashlib.sha256(definition.encode()).hexdigest()
            groups.setdefault(digest, {'definition': json.loads(definition), 'members': []})['members'].append({'family': family, 'slot': index, 'name': material['name'], 'used': index in used})
            if index in used:
                used_groups.add(digest)
        families[family] = {'path': str(path.relative_to(ROOT)),
                            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                            'bytes': path.stat().st_size,
                            'triangles': sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives']),
                            'material_definitions': len(doc['materials']), 'used_slots': sorted(used)}
    return {'unique_definitions': len(groups), 'unique_used_definitions': len(used_groups),
            'groups': groups, 'families': families,
            'glb_bytes': sum(f['bytes'] for f in families.values()),
            'placed_triangles': sum(f['triangles'] * (16 if name == 'chamber' else 4 if name == 'row-carrier' else 1) for name, f in families.items())}


def main():
    before = audit({f: OUT.parent/('materials/wear-'+f+'.glb' if f in FAMILIES[:2] else f+'.glb') for f in FAMILIES})
    after = audit({f: OUT/(f+'.glb') for f in FAMILIES})
    assert after['unique_definitions'] <= 8
    assert after['placed_triangles'] == before['placed_triangles']
    print(json.dumps({'status': 'Exported candidate material-count ceiling met; NOT full material acceptance',
                      'count_method': 'All material definitions, with embedded image content hashes and sampler values resolved, not local texture indices. Used count also reported.',
                      'visual_gate': 'INCOMPLETE: changed ancillary pixels have not been captured or inspected',
                      'runtime_sharing_draw_calls_memory': 'unverified; equal definitions permit sharing but do not implement it',
                      'before': before, 'after': after}, indent=2))


if __name__ == '__main__':
    main()
