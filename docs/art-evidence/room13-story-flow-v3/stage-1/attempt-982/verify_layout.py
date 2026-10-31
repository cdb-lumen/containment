"""Read-only checks on the saved final Room13 diagram and its evidence."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'layout-manifest.json').read_text())
checks = json.loads((root / 'checks.json').read_text())
image = Image.open(root / 'layout-draft.png')
image.load()
assert image.size == (1800, 1320)
assert checks['summary']['failures'] == 0
assert all(r['passed'] for r in checks['results'])
assert checks['summary']['checks'] == len(checks['results'])
assert hashlib.sha256((root / 'draw_layout.py').read_bytes()).hexdigest() == checks['generator_sha256']
assert hashlib.sha256((root / 'layout-draft.png').read_bytes()).hexdigest() == checks['png_sha256']
for filename, expected in manifest['source_sha256'].items():
    assert hashlib.sha256(Path(filename).read_bytes()).hexdigest() == expected, filename
pixels_checked = 0
for name, (a, b) in manifest['service_network']['paths'].items():
    count = int(math.dist(a, b))
    for i in range(count + 1):
        x = round(a[0] + (b[0]-a[0])*i/count) + 50
        y = round(a[1] + (b[1]-a[1])*i/count) + 235
        assert image.getpixel((x, y)) == (85, 201, 237), (name, x, y)
        pixels_checked += 1
assert manifest['service_network']['new_collision'] is False
assert manifest['topology_changes'] == []
assert (root.parent/'attempt-981'/'layout-draft.png').exists() if 'workspaces' in str(root) else True
print(json.dumps({'saved_png_service_centerline_pixels_checked': pixels_checked,
                  'source_pins_verified':len(manifest['source_sha256']),
                  'generator_records_verified':len(checks['results']),
                  'failures':0, 'image_sha256': checks['png_sha256']}, indent=2))
