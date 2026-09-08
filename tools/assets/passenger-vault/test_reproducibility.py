"""Full clean-root rebuild, artifact checks and decoded PNG reproducibility."""
import hashlib
import json
import shutil
import struct
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path('tools/assets/passenger-vault')
PUBLIC = Path('public/assets/passenger-vault')


def decoded_png(path):
    raw = path.read_bytes()
    assert raw[:8] == b'\x89PNG\r\n\x1a\n'
    pos, compressed = 8, bytearray()
    width = height = channels = 0
    while pos < len(raw):
        size = struct.unpack_from('>I', raw, pos)[0]
        kind, payload = raw[pos+4:pos+8], raw[pos+8:pos+8+size]
        if kind == b'IHDR':
            width, height, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', payload)
            assert depth == 8 and color in (2, 6) and (compression, filtering, interlace) == (0, 0, 0)
            channels = 3 if color == 2 else 4
        elif kind == b'IDAT':
            compressed.extend(payload)
        pos += size + 12
    scan = zlib.decompress(compressed)
    stride = width * channels
    assert len(scan) == height * (stride + 1)
    previous = bytearray(stride)
    digest = hashlib.sha256()
    for row in range(height):
        offset = row * (stride + 1)
        method = scan[offset]
        current = bytearray(scan[offset+1:offset+1+stride])
        assert method <= 4
        for i in range(stride):
            a = current[i-channels] if i >= channels else 0
            b = previous[i]
            c = previous[i-channels] if i >= channels else 0
            p = a+b-c
            distances = [abs(p-a), abs(p-b), abs(p-c)]
            paeth = (a, b, c)[distances.index(min(distances))]
            predictor = (0, a, b, (a+b)//2, paeth)[method]
            current[i] = (current[i] + predictor) & 255
        digest.update(current)
        previous = current
    return {'width': width, 'height': height, 'channels': channels, 'pixels_sha256': digest.hexdigest()}


def main():
    clean = Path(tempfile.mkdtemp(prefix='passenger-fix-clean-'))
    print('CLEAN_ROOT ' + str(clean), flush=True)
    (clean / SOURCE).mkdir(parents=True)
    (clean / PUBLIC).mkdir(parents=True)
    for path in sorted((ROOT / SOURCE).glob('*.py')):
        shutil.copy2(path, clean / SOURCE / path.name)
    for name in ['README.md', 'references.md']:
        shutil.copy2(ROOT / SOURCE / name, clean / SOURCE / name)
    shutil.copy2(ROOT / PUBLIC / 'CREDITS.md', clean / PUBLIC / 'CREDITS.md')
    commands = [
        ['blender', '--background', '--factory-startup', '--python-exit-code', '1', '--python', str(clean / SOURCE / 'build.py'), '--', '--output-root', str(clean)],
        [sys.executable, str(clean / SOURCE / 'test_artifacts.py'), str(clean)],
        ['blender', '--background', '--factory-startup', '--python-exit-code', '1', '--python', str(clean / SOURCE / 'test_geometry.py'), '--', '--output-root', str(clean)],
    ]
    for index, command in enumerate(commands):
        with (clean / f'check-{index}.log').open('w') as log:
            result = subprocess.run(command, cwd=clean, stdout=log, stderr=subprocess.STDOUT)
        print(json.dumps({'command': command, 'exit_code': result.returncode}), flush=True)
        assert result.returncode == 0, str(clean / f'check-{index}.log')
    first = json.loads((ROOT / SOURCE / 'manifest.json').read_text())
    second = json.loads((clean / SOURCE / 'manifest.json').read_text())
    for key in ['geometry_hashes', 'placements', 'validation', 'roundtrip']:
        assert first[key] == second[key], key
    glbs = {}
    for name in ['chamber.glb', 'row-carrier.glb']:
        a, b = ROOT / PUBLIC / name, clean / PUBLIC / name
        assert a.read_bytes() == b.read_bytes(), name
        glbs[name] = hashlib.sha256(a.read_bytes()).hexdigest()
    pngs = {}
    paths = sorted((ROOT / SOURCE / 'evidence').glob('*.png'))
    assert len(paths) == 6
    assert len(list((clean / SOURCE / 'evidence').glob('*.png'))) == 6
    for path in paths:
        pixels = decoded_png(path)
        assert pixels == decoded_png(clean / path.relative_to(ROOT)), path.name
        pngs[path.name] = pixels
    report = {'clean_root': str(clean), 'passed': True, 'geometry_hashes': first['geometry_hashes'],
              'glb_binary_sha256': glbs, 'decoded_pngs': pngs, 'blend_byte_identity_claimed': False}
    (clean / 'reproducibility.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2), flush=True)


if __name__ == '__main__':
    main()
