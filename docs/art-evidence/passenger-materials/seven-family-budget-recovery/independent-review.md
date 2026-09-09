# Independent seven-family fixture review

## Verdict

The retained recovery set is valid bounded evidence of the seven-family presentation fixture. All 34 requested frames are present and usable for that narrow claim. No retained frame was downgraded for a blank, loading, browser-error, or visibly wrong-room state.

The material gate remains **not passed**. Pale ancillary equipment still reads as neutral geometry. Causal wear, distinct material response, equipment-role readability, and pixel-readable passenger live cues remain unproven. This report does not approve finished materials, shipping integration, gameplay, or performance.

Reviewed worktree HEAD was `e8dfe5b11edcbe6f1314aa0939be47be370ae009`, with the capture script modified and its helper, declaration, and unit test untracked. These dirty inputs are part of the reviewed state, not contents attributed to HEAD.

## Coverage and integrity

| Requested view | Desktop 1280x900 | Portrait 390x844 |
| --- | --- | --- |
| opening | before, budget | before, budget |
| F1 | before, budget | before, budget |
| north-loop | before, budget | before, budget |
| south-loop | before, budget | before, budget |
| monitor-north | before, budget | before, budget |
| monitor-south | before, budget | before, budget |
| full-room | before, budget | before, budget |
| distribution-closeup | before, budget | not requested |
| monitor-closeup | before, budget | not requested |
| finish-closeup | before, budget | not requested |
| Total captured | 20 | 14 |

CPU verification independently reconstructed the requested tuple set and checked exact equality with the manifest. There are 34 unique state tuples, 34 distinct file paths, and 34 distinct SHA-256 hashes. The PNG directory contains exactly the manifest's PNG set. Every image decoded, matched its requested dimensions, and matched its recorded hash. There are no missing requested states and no not-captured rows.

All 232 recorded source hashes match the current files, including the capture script and runtime helper. Script SHA-256 is `489b034b11e6f5179d8301c02381ff2cc977e41829231d73fab730eac66351a8`. Both `git diff HEAD --name-only -- src public` and `git status --porcelain -- src public` returned no changes. The review also checked for untracked nonignored files in those paths and found none. This establishes unchanged shipping files relative to HEAD, not an audit of ignored files.

The manifest records `complete: true`. Its `independentReview` and all 34 `pixelReview` fields still say `pending`. This report supplies the independent verdict without altering the capture record. Publication must link this report or explicitly reconcile those review fields; `complete` alone is not material acceptance.

## Inventory and placement

Each snapshot contains 25 unique family-plus-translation entries: 16 chambers, four row carriers, and one each of distribution-north, distribution-south, monitor-north, monitor-south, and service-finish. Every snapshot totals 76,050 imported triangles and records 27 merged fixture meshes in both stages.

The review recomputed every inventory translation from the manifest placement's game-unit position divided by 32, Y rotation, and local offset. All match within 1e-8. Carrier anchors are x 420 and 780 at z 300 and 580; the southern rows rotate by pi. Each row has four chamber offsets at x -2.34375, -0.78125, 0.78125, and 2.34375, with local z 0.25. Distribution anchors are 600/80 and 600/800, with the southern unit rotated by pi. Monitor anchors are 1100/280 and 1100/600. The service-finish kit remains at the authored origin.

Bounds are finite and have positive extents except the intentionally flat service-finish Y extent. Each chamber inventory entry records one closed lid and six named upward cue segments; other families record zero. These are mesh metadata, not a count of visible or legible live cues.

All 17 before/budget pairs have identical recorded camera, player, and inventory values. The shipping-framing views retain zoom 1 and the documented camera offsets of 26 vertically and 19 along Z. Full-room and closeup views are diagnostic projections. Chamber and row-carrier GLBs are byte-identical between before and budget, so this comparison cannot establish a new chamber or carrier wear improvement.

## Pixel review

All 34 retained PNGs were inspected through four CPU-generated labeled contact sheets. Native-size representatives additionally inspected were `desktop-full-room-budget.png`, `desktop-monitor-closeup-budget.png`, and `portrait-north-loop-budget.png`. Contact sheets were review aids under `/tmp/passenger-review-*.jpg`; originals were not edited.

- The full-room desktop frame visibly contains four banks of four pale closed chambers, dark row bases, north/south distribution masses, east-side monitor masses, and connecting flush markings. This supports room composition and the presence of the imported families when read with the verified inventory.
- Opening, F1, loop, and monitor views show the staged player at distinct inspection positions. Before/budget pairs are closely matched visually, consistent with the paired metadata. Unique hashes do not by themselves prove a meaningful material improvement.
- `desktop-monitor-closeup-budget.png` shows a pale monitor enclosure with a recessed rectangular face and repeated diagonal surface pattern. It does not establish a readable functional display or convincingly differentiated finished materials. The paired contact-sheet view is similarly pale.
- Distribution and finish closeups retain the pale strip equipment and feed markings. These are useful diagnostic views, not proof that wear or material roles survive normal gameplay framing.
- In the native portrait north-loop view, small dark chamber panels and cyan marks are visible, but six individual upward cues per passenger cannot be certified from these pixels. HUD panels cover portions of equipment, and side rows are clipped by the narrow viewport. Those conditions limit readability claims; they do not invalidate a capture of the requested shipping framing.
- Portrait full-room is a reduced diagnostic overview with substantial surrounding black space. It is not evidence that all equipment is readable at ordinary portrait play scale.

## Code review

Reviewed `scripts/passenger-material-evidence.mjs`, `scripts/passenger-material-fixture.mjs`, `scripts/passenger-material-fixture.d.mts`, and `tests/unit/passengerMaterialFixture.test.ts` without executing tests or builds.

The recovered batching key separates family, loaded material UUID, and geometry attribute signature. The signature includes indexed status, sorted attribute names, item sizes, normalization flags, and typed-array constructors. This avoids both the prior incompatible-attribute merge and the older material-name aliasing behavior. GLB JSON inspection confirmed that both monitor variants contain primitives with and without TEXCOORD_0. The preserved failure reports exactly an attribute-count mismatch while merging monitor-north. All inspected assets use triangle primitives and have no skins or morph targets, which keeps the current use within the helper's bounded assumptions.

The source transform guards exact occurrence counts for the reserved-equipment loop and temporary feed markings, and acts only in the temporary Vite build. The output reservation refuses existing destinations. Staging loads all seven actual paths for each variant, removes the reserved blockout equipment, applies matched service-finish polygon offset, and freezes simulation between paired renders. Capture assertions check inventory, pairing, GL errors, dimensions, and source stability. No blocking code defect was found for this completed capture set.

Nonblocking hardening gaps remain:

1. The test called "loads all seven actual candidate files and the matched pre-budget package" reads GLB headers only for budget files. It checks before-family keys but not before-path values or file headers. The independent source/hash inspection covers the present set, not future regression protection.
2. Geometry-key tests cover a missing UV attribute, cloning, and indexed status. They do not exercise actual `mergeGeometries` or distinguish item size, normalization, and array-type changes. The key is not a general skinned, morph, interleaved, or multi-material mesh merger.
3. Main-loop removal uses unguarded `replaceAll('requestAnimationFrame(frame);','')`, unlike the guarded authored-room transform. Current source has the expected calls; future drift could defeat the freeze without an explicit contract failure.
4. Build, preview startup, and the initial manifest write occur before the browser cleanup try/finally. Failures there can leave temporary build output, and a manifest-write failure after preview startup can bypass server cleanup. This did not invalidate the completed recovery set, but failure-path ownership is incomplete.
5. The source-hash ledger includes the runtime helper but not its declaration or the unit test. Do not describe the manifest as hashing every reviewed dirty file.

## Preserved failure and limits

`../seven-family-budget/failure.json` remains intact. It reports `Merge failed monitor-north` and `THREE.BufferGeometryUtils` rejecting inconsistent attribute counts. Its SHA-256 at review was `11d015a14c558673cbe8ff87cc62478a39ccbbb8c0cc890801ac9df6e1671710`. That attempt remains failed, separate from this complete recovery.

The recorded runtime is Chromium using ANGLE Vulkan SwiftShader, high quality. This is direct browser evidence of a locally transformed, inactive, teleported fixture. It is not shipping gameplay. Portrait uses Chromium mobile emulation, not native-device or Mobile Safari evidence. Recorded snapshots contain no WebGL errors or context loss; this reviewer did not rerun the browser or independently observe its error stream.

No GPU work, test suite, build, capture rerun, commit, or push was performed. Performance counters include composer and shadow work and do not certify isolated shipping draw-call or memory budgets. Motion, reachability, combat readability, touch usability, device behavior, and causal wear acceptance were not exercised. The parent owns test/build verification and publication.
