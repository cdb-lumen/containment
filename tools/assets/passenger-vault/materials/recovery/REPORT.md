# Material recovery deliverable

Recovered at base `9f2f37a9b77dd44aef72296144feb26631c70091`, uncommitted. No push or shipping source changes. This is bounded material evidence progress, NOT INTEGRATED RUNTIME. Wear and the full materials gate remain open.

## Exact current candidate

- Asset manifest: `public/assets/passenger-vault/materials/manifest.json`
  SHA-256 `2868457c3104a3d6044bee78b08499facc7c3f067c2f64695f5e9052139dedce`.
- Evidence manifest: `docs/art-evidence/passenger-materials/current/manifest.json`
  SHA-256 `686671c2cf5aad4e040a9c21572021c79d76936509208f56e2e27846e113b09a`.
- Source/import/document hashes: `tools/assets/passenger-vault/materials/recovery/provenance.json`.
- Independent CPU receipt: `tools/assets/passenger-vault/materials/recovery/verification.json` and `verification.log`.

The old root-level evidence is unchanged. Its source hash/inventory deficiencies are not retroactively repaired. The old asset receipt is preserved in `recovery/previous-asset-manifest.json`. Regeneration refreshed the final generator receipt; all 18 previous GLB/PNG file hashes remain identical. The complete new capture ran after the last capture-script edit.

## Fresh verification

- Capture command exited 0. All 27 requested PNGs exist with unique matrix entries, verified SHA-256 and viewport dimensions. Nine camera groups match across neutral/material/wear. All frames contain physical inventory for 16 closed chambers and four carriers, with 96 upward mesh segments in total. These are instance/mesh counts, not readable-cue counts. No browser/WebGL errors were reported. Renderer is ANGLE SwiftShader, not a physical-device performance result.
- Clean-root stdlib generation exited 0. All six GLBs, twelve PNGs and the complete manifest reproduced byte-for-byte. The independent verifier decoded and checked all twelve RGB map hashes and CRCs, plus construction source hashes and source receipt hashes.
- `python3 tools/assets/passenger-vault/test_materials.py` exited 0, two tests passed. Export positions, normals, indices and nodes match accepted construction; UV bounds, material bindings and embedded PNG signatures pass.
- `npm test` exited 0. Vitest reported 515 passed and one skipped across 60 passed files and one skipped file. The two Node tests and all invoked Python/Blender CPU contract suites passed.
- `npm run build` exited 0. Existing oversized-chunk warning remains.
- `git diff --check` exited 0. The independent preservation audit verified 381 unique pinned shipping-source, historical construction and older evidence files unchanged.

## Recovery edits

Modified `scripts/passenger-material-evidence.mjs` to assert unique per-instance inventory, one lid and six upward segments per chamber, finite positive bounds, and diagnostic-only interpretation of inventory/draw counters. Regenerated only the material asset manifest receipt; GLB/PNG bytes did not change.

Added `tools/assets/passenger-vault/verify_material_candidate.py`, scoped material `README.md`, material `CREDITS.md`, the `current/` evidence set, and recovery provenance/verification/log/report files. Retained the existing editable `material-fixture.blend`, `material_scene.py`, import receipt and import log with exact hashes. The earlier package.json test addition and author-created material sources remain intact. No construction source, original GLB, historical evidence or shipping runtime was edited.

## Pixel triage and open gates

Reviewed contact sheets covering all refreshed frames for blank/loading/wrong-state triage. All show the intended fixture. Neutral-to-material shell/carrier separation and closeup cyan waveform contrast are visible. Material and wear still look alike at this inspection scale. Portrait opening/F1 clip equipment on the right; the HUD obscures southern equipment. These reduced sheets do not replace the parent's independent full-resolution code/pixel acceptance.

Causal wear, full four-role PBR identification and portrait live-cue readability remain unaccepted. Five candidate materials coexist with twelve current whole-package signatures, exceeding the eight-material ceiling. The unchanged all-family totals are 76,050 placed triangles and 1,658,400 GLB bytes. The 2,097,152-byte texture estimate assumes future inter-GLB sharing; it is not measured shipping allocation. Five merged fixture meshes and diagnostic renderer counters do not establish the 48-added-main-pass ceiling. Other-family materials, whole-room budgets, integration, gameplay, lifecycle, physical-device performance and release remain open.

Parent owns independent final review and publication. Use the new `current/` manifest, not the preserved older receipt, for current candidate claims.
