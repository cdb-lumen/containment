# Independent code and pixel review

## Verdict

MUST-FIX before code-review acceptance. The retained four-row geometry and both diagnostic images look consistent with the passed spec. Two validator/provenance defects remain in the tooling. Neither finding alleges missing geometry in the current images or accepts runtime release.

Reviewed HEAD `3bf42361b9229ccbe6c70ce5dc77696b9db0c2ee` plus the uncommitted candidate identified below. Scope is only the source-only four-carrier, sixteen-closed-chamber installation, before the distribution family.

## Must-fix findings

### 1. Inventory assertions validate constants, not installed inventory

`room_fit.py:120` initializes `chambers=16, carriers=4`. `validate` never asserts four unique row IDs or derives these counts from installed rows. `test_room_fit.py:20-24` then asserts those constants. A missing entire row can evade the geometry suite's positive inventory test.

I reproduced the empty-row case without Blender or geometry mocks: compiled the unchanged `validate`, `check_routes` and `ROUTES` AST nodes, supplied the retained eight solids, and replaced only `bpy.context.view_layer.update` with a no-op. Calling `validate({'rows': [], 'solids': solids})` returned `passed=True`, `carriers=4`, `chambers=16`, `mesh_objects=0`, `placed_triangles=0` and zero contact/probe counts. No mesh branch executes in this case. This proves a control-flow defect, not a Blender geometry result.

The downstream artifact test would reject that empty-row receipt through orientation/contact assertions. That defense does not make the standalone geometry validator or its inventory test correct. The actual retained manifest contains four rows and sixteen chamber records, independently counted here.

Required fix: derive inventory from the assembled object groups, assert exactly A/B/C/D4 once each, four nonempty chamber groups per row, matching named groups and nonempty carrier groups. Report the derived totals. Add missing-row and missing-chamber negative tests with explicit inventory failures. Make the CPU artifact contract cross-check row IDs and per-row chamber record counts rather than relying only on summary counters.

### 2. `--skip-renders` can falsely bind old pixels to new source hashes

`room_fit.py:229-235` always rewrites `manifest.json`, including current source hashes and every existing output PNG hash, even when `--skip-renders` bypasses rendering. In an existing output root, changing a valid placement/render parameter and running with this flag can bless the old images under the new source hash. `test_room_fit_artifacts.py` verifies those hashes but cannot detect that mismatch. In a fresh root, the same flag writes a manifest with no image files.

Required fix: validation-only execution must not overwrite the render manifest. Print the validation result or write a separately named validation-only receipt with no image-provenance claim. Alternatively reject skip-render execution when it would issue a render manifest. Add a cheap regression asserting that validation-only operation cannot replace an existing image manifest or create a render-complete receipt. This finding is from direct control-flow inspection; I did not mutate the retained artifacts to demonstrate it.

The current clean-root receipt and matching images provide evidence against this problem having occurred in the reviewed candidate. It remains an exposed provenance failure for the next run.

## Code audit otherwise

- The fixture imports actual approved GLBs and transforms their mesh vertices, not proxy bounds. Copies share mesh data and use translation plus proper Z rotations. The approved inputs have no parent nodes, so retained parent relationships do not distort this particular copy path. GLB inspection found 27 chamber meshes and 20 carrier meshes, with triangle primitive mode throughout. Counting polygons as triangles is valid for these immutable imports, not a general Blender-mesh guarantee.
- Every imported vertex is checked against its row envelope and height cap. Chamber bounds also fit fixed chamber reservations. Pairwise disjoint chamber AABBs conservatively exclude inter-chamber intersections. This does not establish arbitrary carrier/chamber self-intersection freedom or structural certification.
- Orientation uses the actual status-recess vertex centroid and rear-union object origin. With these fixed GLBs the union origin is the intended reference. It is not a general geometric centroid measurement for replacement assets. Wrong southern rotation has a dedicated negative test.
- Support rays query transformed BVHs in opposing directions at both cradles, checking plinth/cradle/pan heights. Service rays check both union/rod and rod/manifold ends. The latter explicitly permits up to 0.011 m penetration, not an air gap. Retained results report 64 support and 64 service interfaces. Plinth extents and 140 paired top/bottom grid probes test the continuous approved slab. Finite probes alone cannot prove that an arbitrary replacement mesh has no small holes; the immutable prior geometry gate matters.
- Radius-28 route checks conservatively inflate all eight source-derived rectangles. For axis-aligned segments the AABB overlap predicate checks the complete segment, including endpoints, not sparse samples. Boundary endpoint checks also cover each complete straight segment. The declared route paths and access paths yield 12 and 34 segments. This is reserved-solid geometric clearance, not runtime navigation. Because actual row geometry is constrained inside those solids, the conservative approach is sound for this slice.
- Seven retained negative cases cover orientation, overhang, plinth shrinkage, support lift, disconnected service, inter-chamber overlap and route blockage. The missing inventory cases above are the substantive gap. Fixed coordinates and exact topology-text parsing are deliberately narrow and fail closed for source changes; they are not reusable topology parsing infrastructure.
- The canonical `npm test` diff appends the new CPU artifact test after the existing suite. I ran that new test directly: one test passed, exit 0. It does not run Blender regressions or validate reproduction history, and the README correctly separates those commands. Full npm results were read from the retained log, not rerun here.

## Independent pixel inspection

I loaded both actual PNGs through vision. Both decode as 1600 x 1200 RGBA; the vision presentation was downscaled to 800 x 600.

- Top view shows four separated bases, four closed chamber lids per base, status ends facing the central crossing and rear rails outside. The crossing, central spine and outer loops remain open. Four neutral reservation blocks are visibly distinct from the installed rows.
- Oblique view shows the same complete inventory, continuous bases beneath the rows and upright diagnostic actors outside the equipment. I see no visible row overlap, floating row or walking-slot treatment between chambers. Small support and manifold contacts are not resolvable well enough here for pixel-only acceptance.

These are usable neutral diagnostic views. Bright lids and simple proxy actors are not material, occupant-status or shipping-camera acceptance. No visual must-fix was identified within this bounded scope.

## Verification and preservation

- All five manifest input hashes and both PNG binary hashes match current files. Independent Pillow RGBA hashes match the reproduction receipt.
- Both GLBs are byte-identical to HEAD. Git diff shows only package wiring and the authorized README addition among tracked changes; fixture source/tests/evidence are new. I did not redo the parent's historical 36-hash audit.
- The existing clean-root manifest remains available and its inputs, solids and validation equal the retained manifest. This reproduction copies approved GLBs rather than rebuilding them. No new GLB-builder or cross-version pixel-determinism claim is warranted.
- All 20 existing `SHA256SUMS` entries matched before this review was written. The retained tests and clean-root logs report eight Blender tests passing; the npm log reports 493 Vitest passes and one skip. These are inspected author receipts.
- Reviewer execution was limited to code/JSON/GLB inspection, AST control-flow reproduction, hashes, PNG decoding, the single CPU artifact test and `git diff --check`, which passed. No Blender, GPU, render, full tests, child agent, source edit, commit or push. Only this review file was created.

Distribution, monitoring, flush kit, underfloor construction, materials, loading/animation, runtime integration, full verifier and 6-10 second video remain open. PR58 and PR48 are not approved for merging. After the two fixes, reconcile evidence/source hashes and obtain follow-up code acceptance. Do not silently reuse this snapshot as approval of changed code.

## Exact reviewed SHA-256 snapshot

Paths are relative to the repository root. This review is not included in its own hash list.

```text
c0d36f3463493439834a12605a92c395372cdceafb4200a03b21bfc4b6ea642e  package.json
fd294983908047ef75a6dcbba5a8de15cd453e9eacf4066ea1e784d90df3d5e5  tools/assets/passenger-vault/README.md
0343f70275beb9eeaafc04dcea3ece23a2acf469670d313e9e5b81609cff03b5  tools/assets/passenger-vault/room_fit.py
ab12fd9a58830896f3146e1487b9997779931abc21020df1a5a7b63f7ef59edd  tools/assets/passenger-vault/test_room_fit.py
c0c7cb25ad8f2df52869fdf724c8473d15ba95efc1bf8523de4473a89911a994  tools/assets/passenger-vault/test_room_fit_artifacts.py
224ea0314b3c5c09dbbc695d58a75632f8381527bd66be8b100b9bd33bdca147  tools/assets/passenger-vault/test_room_fit_reproducibility.py
ffdc418eeb9d1074ff48f874b46ac5dc81f7f12e38c2ce8559a9de9e74a8edfa  tools/assets/passenger-vault/test_reproducibility.py
2691e93413aff1662545afcfc12b0af6954769966f53f8a19bf01fb7aea23b05  src/game/roguelike/authoredRoomTopologies.ts
029a456996061b42355bff6f15a8ce274b9dbbeced00ea76f41fc972b7e8d840  public/assets/passenger-vault/chamber.glb
9e8610aa0de331ad527c26a09752b439bf34935e4c9bb448e3de09138416c11b  public/assets/passenger-vault/row-carrier.glb
c84119cf9db6d0bf7ea58f460471aa558d38bed720d0b5f26c10783c6fe1ad7b  tools/assets/passenger-vault/room-fit/manifest.json
139bd263e4ccda4ed9fd9f504d23f26505761bf8883b1ab42c808c90514c3c55  tools/assets/passenger-vault/room-fit/reproducibility.json
c98650e66e0ac703aae87d6ad32ea2862f4eb201f8571d0e141e4e9f235f16d1  tools/assets/passenger-vault/room-fit/report.md
54efba6e6cf60e5f3d3c63967bd8be49151b96ac4cdf7a9319f038a6414680bb  tools/assets/passenger-vault/room-fit/spec-review.md
5c5f9f535e4043311e8921a0c970254bf94d37a62a650a888d49cee5202edd05  tools/assets/passenger-vault/room-fit/SHA256SUMS
5ec36d9f32a18af759e07f41bc7565acb3003da13785a0cac67e7fb5e3a85eb6  tools/assets/passenger-vault/room-fit/whole-room-oblique.png
11c92fde93f88d322c1f5b86a16508dd370be2d3970a2fce5ab2760bb298c6c4  tools/assets/passenger-vault/room-fit/whole-room-top.png
```

Decoded RGBA SHA-256:

```text
b41839f25b7be4e735ba328c8aa4f33d227f61f4f48bdf50950feac10ccf00b4  whole-room-oblique.png
f7fa8325cad306a30375bb1a43e3010c7b88259f34740e1a59e728b594418caa  whole-room-top.png
```
