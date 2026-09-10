# Material candidate reproduction

This separate material layer covers chamber and row-carrier only. It preserves the accepted construction geometry at base `9f2f37a9b77dd44aef72296144feb26631c70091`. Construction source, original GLBs and historical evidence remain unchanged. Read the material-specific [credits](../../../../public/assets/passenger-vault/materials/CREDITS.md), not the original geometry-only credits, for these maps.

## Build order

Run from the repository root with its locked Node dependencies installed. Python 3 uses only the standard library. The editable scene was imported with Blender 4.0.2. Node must satisfy `package.json`, at least 22.12.0. Capture uses the repository's Vite, Three.js and Playwright versions and installed Playwright Chromium, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

```sh
python3 tools/assets/passenger-vault/materials.py
blender -b --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/material_scene.py
python3 tools/assets/passenger-vault/test_materials.py
npm test
npm run build
node scripts/passenger-material-evidence.mjs docs/art-evidence/passenger-materials/new-review
python3 tools/assets/passenger-vault/verify_material_candidate.py
```

The last command audits the retained `current/` capture, not `new-review/`. Never reuse a historical evidence destination. The generator accepts `--output-root PATH` for clean-root CPU reproduction. Its inputs always come from the accepted GLBs beside this repository's material output directory. The verifier creates an empty temporary output root and compares every generated GLB, PNG and manifest byte, then removes only that temporary directory.

`materials.py` appends UV and PNG buffers and assigns PBR materials. It does not rebuild construction geometry. Six alternative GLBs cover neutral, material and wear stages for two families. Twelve original 256×256 RGB PNGs provide base color and packed ORM for shell, carrier and metal. Gasket and status use factors. No normal map is delivered. `manifest.json` records encoded file hashes, decoded RGB hashes, channel meanings, color spaces, geometry input hashes and the final generator hash.

`material_scene.py` imports the actual wear GLBs and produces `material-fixture.blend`, with editable linked mesh instances, UVs, shader nodes and packed images. `blender-import.json` checks finite positions, normals and UVs and imported image color spaces. This is a downstream editable review scene, not the authoritative byte-identical export path. Saving Blender files can vary bytes across versions/runs. The recovery provenance receipt records exact retained script, blend, import-receipt and import-log hashes. The existing successful import was retained because recovery changes did not alter the imported assets or scene script.

## Current evidence and receipt reconciliation

Use `docs/art-evidence/passenger-materials/current/manifest.json` and its 27 frames. The root-level older capture remains untouched and is superseded for current source/inventory claims. `recovery/previous-asset-manifest.json` preserves the stale generator receipt before regeneration. The final generator rebuild reconciles source provenance; the clean-root audit compares all resulting bytes. Recovery did not substitute a new script hash into old screenshots. It reran the complete matrix from the final frozen capture script in the new `current/` directory.

`recovery/provenance.json` identifies exact candidate source/document/import files. `recovery/verification.json` and `verification.log` contain the independent CPU count/hash/camera/regeneration audit. `preservation.json` pins shipping source, historical construction inputs and historical evidence before recovery. Logs in `recovery/` are fresh; sibling earlier logs are historical authoring attempts.

## Acceptance boundaries

NOT INTEGRATED RUNTIME. The isolated Vite fixture replaces row blockouts only, disables the encounter and teleports the actor. Opening/F1/south-loop use shipping framing; full-room and closeup use diagnostic projections. Portrait is Chromium emulation, not physical-device evidence.

Inventory means 16 physical closed chamber instances, four carriers and six named upward mesh segments per chamber. It does not mean 16 pixel-readable live-state cues. Camera equality, no WebGL errors and valid PNGs are mechanical checks, not pixel acceptance. Prior spec inspection observed shell/carrier/status contrast; the refreshed pixels require independent review. Causal wear, four-role PBR identification and portrait occupancy readability remain unaccepted.

The candidate has five materials. The whole package currently has twelve signatures against an eight-material ceiling, so that gate fails. Placed all-family geometry is 76,050 triangles and wear-stage plus existing-family GLBs total 1,658,400 bytes. The 2,097,152-byte texture estimate assumes future content sharing across GLBs and RGBA8 mip allocations, not measured shipping memory. Without sharing it doubles. Diagnostic renderer draw counters and five merged fixture meshes do not prove the 48-added-main-pass ceiling. Distribution, monitoring and finish material work is outside this slice. Whole-room budgets, integration, gameplay, lifecycle, performance and release remain open.
