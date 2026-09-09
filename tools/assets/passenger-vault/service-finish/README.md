# Flush distribution construction result

The missing editable source is delivered and verified. Independent re-review is still required. `spec-review.md` retains the original FAIL verdict unchanged. `pre-blend-fix/` preserves the earlier sources, artifacts, receipts, review and README, plus the new regression's expected missing-source failure.

## Deliverables

- `service-finish.blend` contains 13 authored editable quad meshes at room origin, two neutral kit materials and ten source-only diagram meshes. Eight of those are reservation footprints; the other two show the floor and camera envelope. The scene is saved before render-only material mutation.
- `public/assets/passenger-vault/service-finish.glb` contains only the 13 kit meshes. It remains 42,520 bytes, SHA-256 `85517cc282d247b4a09d0daf3c56405b80f2417a5da1675e3186080ceb1337b6`, identical to the pre-fix GLB.
- `top.png` and `oblique.png` are regenerated neutral 1200 by 880 diagrams, not installed-equipment or gameplay evidence.
- `manifest.json` hashes all four artifacts and author/test sources. `verification.json` and `verification.log` record fresh checkout and clean-root verification. `npm-test.log` records the default gate.

The GLB remains a zero-thickness planar cover/seam layer, with 1,026 triangles, 325 surface probes, four row feeds and two console contacts. It has no reservation fixtures, pipes, holes, textures, cameras or animations. The east channel remains at game x1162..1166 inside the wall. Native glTF axes are X=x/32, Y=height/32, Z=game-y/32, without node transforms or recentering.

## Rebuild and verify

From the repository root, with Blender 4.0+, Python Pillow and npm dependencies installed:

```sh
blender -t 6 --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/service_finish.py -- --output-root "$PWD"
python3 tools/assets/passenger-vault/verify_service_finish.py
npm test
```

The full verifier rebuilds twice, including an isolated root with only copied author/test scripts. It reopens each saved `.blend` in a fresh Blender process, validates room-origin flush geometry and editable quad topology, and compares semantic hashes of named objects, transforms, vertices, faces, material assignments and neutral colors. It checks that source materials retain Principled nodes. The saved source is not a render-mutated scene or a renamed GLB.

Fresh verification exited 0:

- Ten Blender tests passed in each root, comprising the nine imported geometry/negative-control tests and the source reopen test.
- Reopened source semantic SHA-256 matched: `9f84cc341124d2cadacdfa013c228ee666380a69bfaa62fe43324ce58d49c114`.
- Checkout `.blend` SHA-256: `70d6502d46db0e48e015fec959d1e212b86d90e1539e9919030bce54be41048e`.
- Clean root `/tmp/passenger-service-finish-clean-q6awl8iu` retained. GLB bytes, decoded PNG pixels and manifest geometry/source fields match. Blender source container bytes and PNG container bytes are not claimed identical; each artifact's own hash is verified.
- Focused layout suite passed 18 tests. Production build exited 0, retaining the existing large-chunk warning.
- `npm test` exited 0: Vitest 515 passed and one skipped, Node two passed, all Python artifact gates passed. The new lean wrapper passed two tests and ran the ten Blender tests in about 1.2 seconds total without rebuilding or rendering.
- Before generation, that wrapper exited 1 because the `.blend` and its required manifest entry were absent. The failure log is retained.

Only `package.json` changes among previously tracked files, adding the required lean `test_service_finish_artifacts.py` gate. The verifier found all 678 tracked files unchanged during its execution. Earlier families' source/runtime assets were not modified. Nothing committed or pushed.

No materials, runtime integration, gameplay, VFX, lighting or release acceptance is claimed. Later integration must choose a coplanar decal or floor-merge strategy. Independent spec re-review and quality review remain separate gates.
