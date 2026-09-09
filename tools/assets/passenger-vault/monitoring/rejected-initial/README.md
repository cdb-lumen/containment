# Monitoring pair construction handoff

Source-only candidate, independent review pending. No material, runtime, shipping-camera or release acceptance is claimed.

## Delivered

Two newly authored west-facing consoles occupy MN `x1040..1160,y240..320` and MS `x1040..1160,y560..640`. Both have a full 3.75 by 2.5 m deck-contact plinth, closed service faces, a supported worktop, enclosed sloping instrument bed and exposed broad display. Nominal scale is 32 game units per metre. Imported height is 1.21 m north and 0.96 m south, about 38.72 and 30.72 game units. South has shorter walls, bulkhead and electronics packs. Plate gauges, display dimensions and plinth thickness are unchanged, with no transform squash.

Each GLB contains 22 named closed meshes, 264 triangles and three neutral materials. North is 32,472 bytes; south is 32,504 bytes. Meshes remain unbatched for construction inspection. Display geometry is blank neutral clay, not final live-state graphics. There are no textures, bodies, alarms, new interactions or topology edits.

Original console geometry is authored in `../monitoring.py`. It reuses only generic box, material, import/export, BVH and render helpers from accepted `../distribution.py`. Full-room assembly reads accepted chamber, carrier and distribution GLBs without invoking their writers. The equipment plan and passed story/layout reviews control construction. No downloaded geometry or texture input, and no PR58 asset, is used.

## Exact files

Repository-relative sources:

- `tools/assets/passenger-vault/monitoring.py`
- `tools/assets/passenger-vault/test_monitor_geometry.py`
- `tools/assets/passenger-vault/test_monitor_artifacts.py`
- `tools/assets/passenger-vault/test_monitor_reproducibility.py`
- `tools/assets/passenger-vault/test_monitor_provenance.py`

Outputs:

- `public/assets/passenger-vault/monitor-north.glb`
- `public/assets/passenger-vault/monitor-south.glb`
- `tools/assets/passenger-vault/monitoring/north.blend`
- `tools/assets/passenger-vault/monitoring/south.blend`
- `tools/assets/passenger-vault/monitoring/north-closed.png`
- `tools/assets/passenger-vault/monitoring/north-cutaway.png`
- `tools/assets/passenger-vault/monitoring/south-closed.png`
- `tools/assets/passenger-vault/monitoring/south-cutaway.png`
- `tools/assets/passenger-vault/monitoring/room-placement.png`

All five current renders completed and were inspected by the author. They are 1200 by 800 orthographic Cycles CPU renders, 16 samples, seed 0, without denoising. Cutaways hide the top assembly, near wall and one service face. Remaining instrument cheeks lose their supporting worktop only in this diagnostic hidden-part view. The complete room contains four accepted carriers, sixteen chambers, both accepted distribution units and exactly MN/MS, with no console placeholders. The floor and walls are source context, not runtime exports.

`manifest.json` records all nine artifact byte hashes, sizes and imported geometry counts. `reproducibility.json` records both GLB binary hashes and all five decoded RGBA hashes. `provenance.json` binds sources, preserved earlier package files and the base revision. Logs remain in this directory.

## Executed commands

Run from the exact worktree:

```sh
cd /home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout
PYTHONDONTWRITEBYTECODE=1 blender -t 6 --background --factory-startup --python-exit-code 1 --python "$PWD/tools/assets/passenger-vault/monitoring.py" -- --output-root "$PWD"
PYTHONDONTWRITEBYTECODE=1 blender -t 6 --background --factory-startup --python-exit-code 1 --python "$PWD/tools/assets/passenger-vault/test_monitor_geometry.py"
PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_monitor_artifacts.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_monitor_reproducibility.py
npm test
npm run build
PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_monitor_provenance.py
git diff --exit-code HEAD -- . ':!package.json'
git diff --check
```

Build, geometry tests, artifact check, reproduction, npm test and npm build exited zero. Blender is 4.0.2. The clean root is `/tmp/passenger-monitor-clean-jhrfe9xw`. Its builder used that root's absolute script path and explicit `--output-root`; all three clean-root commands passed. Both generated GLBs match bytes exactly; all five decoded PNGs match. Four accepted input GLBs also match. Blend binary identity is not claimed because saved files carry session metadata.

`npm test` retains every earlier command and appends only the CPU monitor artifact test. Vitest reported 493 passed and one skipped across 59 passed files and one skipped file. Both Node tests and all four Python artifact suites passed. `npm run build` completed with the existing large-chunk warning. No full verifier or browser job was run.

## Validation and limitations

The Blender validator uses actual imported triangle vertices and world-space BVHs. Per variant it checks exact named inventory, baked unit scales, finite vertices, full envelope, positive-volume welded manifold meshes, nine deck rays, twelve support contacts, eighteen closed service-face samples, six instrument-side samples and eleven first-hit display/latch exposure rays. Support is tested with opposed rays through the plinth, walls/bulkhead, worktop, trays and instrument bed. These are sampled construction checks, not a structural or fabrication certification. Internal electronics are simplified enclosures, not completed wiring or thermal design.

Sixteen destructive faults are rejected after fresh GLB imports: buried display, floating base, floating worktop, missing bulkhead, buried latch, inset service panel, scale mismatch and duplicate inventory, each in both variants. The CPU suite checks hashes, exact manifest and node inventories, actual binary positions transformed by exported translations, finite envelope, triangle indices/counts, normals and absent animation/images. It is not a substitute for the Blender support tests.

`red.log` proves the pair was initially absent. `edge-probe-failure.log` preserves an initial exact-edge display ray rejection; the final ray uses an interior sample instead of a numerically ambiguous triangle boundary. `enclosure-red.log` rejects the old inventory before adding instrument side closures. Current `build.log`, `geometry-tests.log` and `clean-0/1/2.log` describe the final candidate.

Earlier tracked assets, scripts, evidence and runtime files are unchanged. Only `package.json` is an existing tracked-file edit, limited to the appended CPU test. No commit or push was made. The author has finished all renders and reproduction and released the heavy-job slot. Independent review is the next gate. Material separation, live-state graphics, service ergonomics at actor scale, shipping desktop/portrait visibility, draw-call batching, runtime loading, behavior and full release verification remain open.
