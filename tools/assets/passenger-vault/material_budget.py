"""Export a separate eight-role budget candidate; never overwrite accepted inputs.

Python stdlib only. This consolidates neutral ancillary palettes, not finished PBR
or wear. Pixels change on ancillary families; their visual gate remains incomplete.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[3]
FAMILIES = ('chamber', 'row-carrier', 'distribution-north', 'distribution-south',
            'monitor-north', 'monitor-south', 'service-finish')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_glb(path):
    raw = path.read_bytes()
    size = struct.unpack_from('<I', raw, 12)[0]
    return json.loads(raw[20:20+size]), raw[28+size:]


def shared_role(name):
    # Preserve the authored distinction between enclosure, dark recess/seam and
    # mechanism. Never infer semantics from brightness or merge all dark parts.
    if 'gasket' in name or 'panel_seam' in name:
        return 'recess'
    if 'shell' in name or 'cover_marking' in name:
        return 'enclosure'
    if 'mechanism' in name:
        return 'mechanism'
    raise ValueError(f'Unmapped ancillary material: {name}')


def palette(role):
    value = {'recess': .16, 'enclosure': .48, 'mechanism': .32}[role]
    return {'name': 'PV_ancillary_' + role, 'doubleSided': True,
            'pbrMetallicRoughness': {'baseColorFactor': [value, value, value, 1],
                                   'metallicFactor': 0, 'roughnessFactor': .72}}


def consolidate(source, target):
    original, binary = read_glb(source)
    doc = copy.deepcopy(original)
    mappings = []
    # Keep slots and per-primitive bindings intact. Only material definitions
    # change, so UVs, geometry buffers, hierarchy and semantic node names survive.
    for index, material in enumerate(original['materials']):
        role = shared_role(material['name'])
        doc['materials'][index] = palette(role)
        mappings.append({'slot': index, 'source_name': material['name'], 'role': role})
    encoded = json.dumps(doc, separators=(',', ':'), sort_keys=True).encode()
    encoded += b' ' * (-len(encoded) % 4)
    target.write_bytes(struct.pack('<4sII', b'glTF', 2, 28+len(encoded)+len(binary))
                       + struct.pack('<I4s', len(encoded), b'JSON') + encoded
                       + struct.pack('<I4s', len(binary), b'BIN\0') + binary)
    return mappings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-root', type=Path, default=ROOT)
    args = parser.parse_args()
    out = args.output_root / 'public/assets/passenger-vault/material-budget'
    source = ROOT / 'public/assets/passenger-vault'
    if out.resolve() in (source.resolve(), (source/'materials').resolve()):
        raise ValueError('Output must not overwrite prior assets')
    out.mkdir(parents=True, exist_ok=True)
    manifest = {'schema': 1, 'status': 'budget candidate only; visual gate incomplete; NOT INTEGRATED RUNTIME',
                'source_script_sha256': sha(Path(__file__)), 'source_sha256': {},
                'mapping': {}, 'files': {}, 'package_families': list(FAMILIES),
                'material_policy': 'Five unchanged chamber/carrier roles plus three shared neutral ancillary roles. Not finished ancillary PBR.',
                'pixel_evidence': 'INCOMPLETE: ancillary pixels changed; previous captures do not validate this package.'}
    for family in FAMILIES:
        src = source / ('materials/wear-' + family + '.glb' if family in FAMILIES[:2] else family + '.glb')
        target = out / (family + '.glb')
        manifest['source_sha256'][str(src.relative_to(ROOT))] = sha(src)
        if family in FAMILIES[:2]:
            target.write_bytes(src.read_bytes())
        else:
            manifest['mapping'][family] = consolidate(src, target)
        manifest['files'][target.name] = {'sha256': sha(target), 'bytes': target.stat().st_size}
    (out/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
