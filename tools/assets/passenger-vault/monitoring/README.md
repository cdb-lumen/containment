# Monitoring pair repair handoff

Construction gate FAILED after independent re-review. [Final review](final-review.md) accepts the joint and support repairs, but service-panel opening remains unproven. The panel intersects the central bulkhead by 30 mm by 40 mm; removing it from a ray test does not prove an opening path. The parent independently reproduced that overlap in both GLBs. This package is preserved for recovery, not accepted equipment. Worker `9b8013f7b737` is paused after the bounded recovery failed. No materials, runtime or release acceptance.

## Repaired construction

- R1: lower side walls now butt against the back wall instead of extending through its outer faces. Instrument cheeks butt against a sloped rear cover. Imported opposed end rays test joint contact; exterior rays require a single owner on either side of each joint. Both closed renders no longer show the rejected rear black strips. Cameras, helper lighting and neutral material values are unchanged.
- R2: the display sits directly on the bezel, and the bezel sits directly on the instrument bed. Opposed imported-triangle rays test both contacts at nine positions. Four more samples test pack-to-tray contact. The exact 1 mm display gap and 100 mm raised-pack mutations now fail on measured support gaps, not inventory or visibility.
- R3: the broad display and electronics now occupy the west service edge. The display is 1.88 m across the face and 0.60 m deep, local x `-1.75..-1.15`. Its near and far edges are 0.125 m and 0.725 m behind the west edge at x `-1.875`. Both electronics packs have the same 0.725 m maximum depth from that edge. The instrument bed occupies only the west 0.925 m, rather than requiring service across the deep rear worktop. A 2.05 m source-only reference and 0.725 m dimension line appear in both cutaways. The imported validator also checks unobstructed west rays to the packs with the corresponding service face omitted for inspection.

The reference depicts maintenance adjacent to the cabinet, not operation from the fixed gameplay centres. It fits outside the west solid face. Fixed centres remain `1000,280` and `1000,600`; no gameplay pose, standing envelope, interaction, aisle-consuming hinged door or layout change was added. The 0.75 m maximum is this candidate's bounded maintenance-depth criterion, not a claimed anthropometric standard or fabrication certification. The reviewer must judge the delivered arrangement. The diagnostic hides service panels; it does not claim a simulated panel-removal sequence.

MN remains `x1040..1160,y240..320`, MS `x1040..1160,y560..640`. Both retain the 3.75 by 2.5 m deck-contact footprint. Imported heights are 1.21 m north and 0.96 m south. South has independently shorter walls, bulkhead and electronics packs. The plinth and plate gauges are unchanged and all imported scales are one. Each GLB contains 22 closed named meshes, 264 triangles and three neutral materials. North is 32,092 bytes; south is 32,132 bytes. No textures or operating graphics belong to this construction gate.

## Current files

Sources are under `tools/assets/passenger-vault/`:

- `monitoring.py`, original deterministic console authoring and evidence builder.
- `monitor_contract.py`, imported support, butt-joint and west-reach checks.
- `test_monitor_geometry.py`, positive imports and 30 fresh-import destructive cases.
- `test_monitor_artifacts.py`, CPU binary GLB and evidence integrity checks.
- `test_monitor_reproducibility.py`, explicit clean-root build and comparison.
- `test_monitor_provenance.py`, earlier-family and rejected-snapshot preservation audit.

Final exports:

- `public/assets/passenger-vault/monitor-north.glb`
- `public/assets/passenger-vault/monitor-south.glb`

Editable files and all five final PNGs are under `tools/assets/passenger-vault/monitoring/`:

- `north.blend`, `south.blend`
- `north-closed.png`, `north-cutaway.png`
- `south-closed.png`, `south-cutaway.png`
- `room-placement.png`

All five PNGs were rebuilt and visually inspected after the repair. They are source-only 1200 by 800 orthographic Cycles CPU renders, 16 samples, seed zero, no denoising. Cutaways hide the worktop, display assembly, near side and one service face. The scale proxy and dimension line are diagnostic objects, absent from both GLBs and editable asset files. Closed views establish the actual display geometry. Full-room evidence reads the accepted 16 chambers, four carriers and two distribution units, then installs exactly the monitoring pair. It does not invoke any earlier family's writer.

`manifest.json` binds all nine final artifacts and imported measurements. `reproducibility.json` records matching GLB bytes and all five decoded PNG hashes. `provenance.json` binds current sources and confirms 79 earlier tracked package files remain byte-identical to base `eddc188008f40ac172ff1c2c06936069baa4be0c`.

## Rejected evidence

`rejected-initial/` preserves 29 original files, including the independent FAIL, original sources, both GLBs, both Blender files, all five PNGs, manifest and logs. `snapshot-sha256.json` records their original bytes, verified by the provenance test. Its README describes the rejected snapshot only. The top-level `independent-review.md` retains that historical verdict with an explicit status note. Neither document accepts this repair.

`repair-red.log` records the new imported-joint check failing against the initial GLB with an 80 mm overlap. `geometry-tests.log` records both repaired imports passing and all 30 mutations failing. Added cases per variant cover the 1 mm display gap, 100 mm pack gap, 80 mm lower and upper overlap, 10 mm lower and upper separation, and a still-supported but inaccessible pack. Existing destructive cases remain intact. Contact tests operate on transformed imported triangles, not object labels or expected bounds alone.

## Executed verification

From `/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout`:

```sh
PYTHONDONTWRITEBYTECODE=1 blender -t 6 --background --factory-startup --python-exit-code 1 --python "$PWD/tools/assets/passenger-vault/monitoring.py" -- --output-root "$PWD"
PYTHONDONTWRITEBYTECODE=1 blender -t 6 --background --factory-startup --python-exit-code 1 --python "$PWD/tools/assets/passenger-vault/test_monitor_geometry.py"
PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_monitor_reproducibility.py
npm test
npm run build
PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_monitor_provenance.py
git diff --check
```

All commands exited zero. Blender is 4.0.2. The clean root is `/tmp/passenger-monitor-clean-m_ygzp4e`. All three clean-root commands passed, using the copied builder's absolute path and explicit output root. Both new GLBs reproduce byte-for-byte; all five PNGs reproduce decoded pixels. Four accepted input GLBs also match. Blender file byte identity is not claimed because save metadata varies.

Final logs are `build.log`, `geometry-tests.log`, `reproduction.log`, `clean-0.log`, `clean-1.log`, `clean-2.log`, `npm-test.log`, `npm-build.log` and `provenance.log`. The CPU artifact check ran both in clean-root verification and `npm test`. The production build retains its existing large-chunk warning.

Only the existing `package.json` test-command append is a tracked-file change. Earlier assets, runtime, topology, camera and global lighting files are unchanged. No browser smoke, full verifier, commit or push was run. Parent owns independent re-review and publication. Materials, live-state graphics, runtime loading and behavior, shipping-camera evidence and release gates remain open.
