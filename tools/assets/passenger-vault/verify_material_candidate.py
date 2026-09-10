"""CPU audit of the exact recovered candidate, including clean-root regeneration."""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import zlib

ROOT = Path(__file__).resolve().parents[3]
ASSETS = ROOT / 'public/assets/passenger-vault/materials'
RECOVERY = ROOT / 'tools/assets/passenger-vault/materials/recovery'
EVIDENCE = ROOT / 'docs/art-evidence/passenger-materials/current'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    manifest = json.loads((ASSETS / 'manifest.json').read_text())
    assert manifest['source_script_sha256'] == sha(ROOT / 'tools/assets/passenger-vault/materials.py')
    for name, digest in manifest['source_sha256'].items():
        assert sha(ASSETS.parent / name) == digest, name
    for name, record in manifest['files'].items():
        path = ASSETS / name
        assert sha(path) == record['sha256'] and path.stat().st_size == record['bytes'], name
    for name, record in manifest['textures'].items():
        data = (ASSETS / name).read_bytes()
        assert data[:8] == b'\x89PNG\r\n\x1a\n'
        offset, compressed = 8, bytearray()
        while offset < len(data):
            size = struct.unpack_from('>I', data, offset)[0]
            tag = data[offset+4:offset+8]
            payload = data[offset+8:offset+8+size]
            assert zlib.crc32(tag+payload) & 0xffffffff == struct.unpack_from('>I', data, offset+8+size)[0]
            if tag == b'IDAT':
                compressed.extend(payload)
            offset += size+12
        decoded = zlib.decompress(compressed)
        width, height = record['size']
        stride = 1+width*3
        assert len(decoded) == stride*height
        assert all(decoded[y*stride] == 0 for y in range(height))
        rgb = b''.join(decoded[y*stride+1:(y+1)*stride] for y in range(height))
        assert hashlib.sha256(rgb).hexdigest() == record['sha256_rgb'], name
    with tempfile.TemporaryDirectory(prefix='pv-material-clean-') as temporary:
        subprocess.run([sys.executable, str(ROOT / 'tools/assets/passenger-vault/materials.py'), '--output-root', temporary], check=True)
        generated = Path(temporary) / 'public/assets/passenger-vault/materials'
        assert {p.name for p in generated.iterdir()} == set(manifest['files']) | {'manifest.json'}
        for name in [*manifest['files'], 'manifest.json']:
            assert sha(generated / name) == sha(ASSETS / name), name
    evidence = json.loads((EVIDENCE / 'manifest.json').read_text())
    assert evidence['scriptSha256'] == sha(ROOT / 'scripts/passenger-material-evidence.mjs')
    assert evidence['assetManifestSha256'] == sha(ASSETS / 'manifest.json')
    expected = {(platform, view, stage) for platform, views in [('desktop', ['opening', 'F1', 'south-loop', 'full-room', 'closeup']), ('portrait', ['opening', 'F1', 'south-loop', 'full-room'])] for view in views for stage in ['neutral', 'material', 'wear']}
    results = evidence['results']
    assert len(results) == len(expected) == 27
    assert {(r['name'], r['view'], r['stage']) for r in results} == expected
    assert len({r['file'] for r in results}) == 27
    assert {p.name for p in EVIDENCE.glob('*.png')} == {r['file'] for r in results}
    cameras, inventories = {}, {}
    for result in results:
        data = (EVIDENCE / result['file']).read_bytes()
        assert hashlib.sha256(data).hexdigest() == result['sha256']
        assert struct.unpack_from('>II', data, 16) == tuple(result['viewport'][k] for k in ['width', 'height'])
        snapshot = result['snapshot']
        key = result['name'], result['view']
        assert cameras.setdefault(key, snapshot['camera']) == snapshot['camera']
        assert inventories.setdefault(key, snapshot['inventory']) == snapshot['inventory']
        inventory = snapshot['inventory']
        assert len(inventory) == 20
        assert len({(i['family'], tuple(i['translation'])) for i in inventory}) == 20
        assert sum(i['family'] == 'chamber' for i in inventory) == 16
        assert sum(i['family'] == 'carrier' for i in inventory) == 4
        assert sum(i['closedLids'] for i in inventory) == 16
        assert sum(i['upwardCueSegments'] for i in inventory) == 96
        assert not snapshot['errors'] and not snapshot['contextLost']
    preserved = json.loads((RECOVERY / 'preservation.json').read_text())
    for name, digest in preserved.items():
        assert sha(ROOT / name) == digest, name
    provenance = json.loads((RECOVERY / 'provenance.json').read_text())
    for name, digest in provenance['sha256'].items():
        assert sha(ROOT / name) == digest, name
    report = {'status': 'CPU audit passed; independent pixel review pending', 'asset_files_verified': len(manifest['files']), 'decoded_maps_verified': len(manifest['textures']), 'clean_root': 'all GLB, PNG and manifest bytes matched', 'screenshots_verified': len(results), 'matched_camera_groups': len(cameras), 'physical_inventory_per_frame': {'chambers': 16, 'carriers': 4, 'closed_lids': 16, 'upward_mesh_segments': 96}, 'preserved_files': len(preserved), 'asset_manifest_sha256': sha(ASSETS / 'manifest.json'), 'evidence_manifest_sha256': sha(EVIDENCE / 'manifest.json'), 'wear_acceptance': 'unproven', 'whole_room_material_budget_pass': manifest['whole_package_material_budget_pass']}
    (RECOVERY / 'verification.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
