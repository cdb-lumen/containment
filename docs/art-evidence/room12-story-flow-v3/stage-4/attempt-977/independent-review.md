# Corrected independent review of Room12 stage 4 attempt977

## Verdict

Accept the material-budget correction and the bounded recorder readability improvement. Do not mark stage 4 fully complete. The required sealed archival recorder with an inspection window is still not established by the geometry or pixels. This is useful partial work, not final room-art acceptance or release approval.

The historical independent pass in the parent attempt is invalid. It missed an unauthorized material-cap increase from 6 to 7. This review covers the corrected source independently and grants no technical or artistic waiver.

## Scope and source identity

I read the complete final Git diff against HEAD ce78d278704fc75aaf0a8bf62547f1b19daf226c, not just the budget-fix delta. It contains two renderer files and their two test files. No collision, story, HUD, shipping-camera or shared renderer source changed. The preserved candidate.diff is byte-identical to the live diff. All 93 source-pins.json file hashes match the worktree. All four copied candidate sources match the worktree, and all four before-sources match that exact baseline commit.

SHA-256 pins:

| Artifact | SHA-256 |
| --- | --- |
| Final diff | 5f6ffcbc11a5b4f5b77c6602ad1446bd941049f826e5aa207a2054b4eb6db030 |
| source-pins.json | 79f72d959f0483c11c6c6a6fe943bbf3ea5cf486a55be410a9f3d7f3fbef64bb |
| src/render/SafetyInterlockArchitecture.ts | e9ef517178e3a528d74d1d152cb08431a42c85debac2825c202820365f4aad17 |
| src/render/SafetyInterlockBlockout.ts | 26fed81e5e6cddfd3aa6aafacd6d37adce944c85de78887f59d93f89b589dc5e |
| tests/SafetyInterlockArchitecture.test.ts | 7320335c887cadc4b781fa12500374dc54d4fb30c207cd86b415e5d5d189eedd |
| tests/SafetyInterlockBlockout.test.ts | 3edd8d411c63c307046df69adca095ab0402d1d3ab0c3d301a094b92286efe89 |
| after-overview.png | 6a3990ba1c5a1f5c888c8fff3ecbfebf9aaf61d1b8a560b7f47043729dde6c0a |
| after-in-scene.png | a6796e5ff559abe24694fc89084e0fce88293878596d41a6d50755066d510e47 |
| model-contact-sheet.png | 30009352ac3fc340f3c3620e5e098bffe9d3fad0d3df00d1d2c529564284e33d |
| channel-motion-sheet.png | ca4da8c3c9f8a9eb803adc6e22248eec7a517995abccc26ac6042db0cb86788c |

## Visual findings

I inspected both corrected native 1280x900 after originals, the model contact sheet and the channel-motion sheet. The top-level after images are byte-identical to their originals under after/. All six pinned before/after/sheet hashes match. I used the contact sheet for the visual before comparison, not a separate inspection of each full-size before original.

The recorder now communicates a tape mechanism more clearly. Concentric windings, the tape span and guide posts replace two relatively plain disks. The larger seated plate carries readable LOCAL RECORD / BEFORE AWAKENING text in the in-scene original and enlarged crop. The overview text is much smaller and does not establish general gameplay readability. Ivory body and reel surfaces show no visible inscription leakage. The seal strap and small seal provide a stronger tamper-seal cue for the plate. The separated AI housing and lower contactor remain distinct objects with open floor between them.

The recorder still reads as exposed reels in an open dark recess. SafetyInterlockBlockout.ts lines 19 to 33 explicitly construct an exposed tape path. The mesh named inspection-window is a dark backing below the reels, not a pane covering them. There is no enclosing cover above the mechanism. A gasket and raised rim do not prove a sealed inspection window. The plate's seal cue does not seal the recorder's open mechanism. The new test's phrase 'sealed pre-awakening plate' is stronger than its assertions, which check object names, seating and label data rather than enclosure construction. Passing that test cannot satisfy the sealed-recorder requirement stated in the review brief for issue33.

Avoiding transparent sorting is an implementation choice, not an authorized exception to the intended object. A later revision needs a visibly closed inspection enclosure while preserving the recorder identity and the original budget. This review does not prescribe transparency as the only possible solution.

The channel sheet shows regular, separated slot marks through the sampled pan without obvious conflicting faces. Source and the CPU test support the fix: slots occupy y .016 to .020 above channel tops at .012. All nine motion files have matching hashes and unique filenames. The four symmetric return pairs are byte-identical. These are discrete frozen-scene camera samples, not proof of continuous motion stability in live play.

## Actual budgets and ownership

A fresh CPU-only probe constructed all three reservations with a mocked canvas context, used production appendEnvironment and bakeWorld, and observed disposal events. Results are retained in independent-cpu-probe.log.

| Reservation | Meshes before baking | Triangles | Materials before / after baking |
| --- | ---: | ---: | ---: |
| Recorder | 29 | 2970 | 6 / 6 |
| AI housing | 11 | 1356 | 4 / 4 |
| Contactor and battery | 15 | 1708 | 4 / 4 |

The original per-reservation cap is 6 and remains 6 in the full final test diff. No existing assertion was removed. The browser-present canvas path also stays at 6. The inscription shares the recorder-owned ivory material, not global MAT. Its unchanged color, metalness and roughness multiply a white texture swatch for non-label faces. Fixed UVs sample its center, mipmaps are disabled and the legend retains full UVs. The separate lamp material and its emissive properties remain unchanged.

The recorder has 13 remapped geometry clones plus its new legend plane. The shared meshParts cache is not modified. The probe warmed that cache before constructing the measured models and verified existing cached UV arrays stayed unchanged. Material disposal occurs once per used material after real baking. The recorder texture receives one dispose event through the ivory material listener.

There is a narrower geometry-lifetime limitation. DepthRenderer.bakeWorld copies input geometry, removes the original meshes and explicitly disposes original geometry only when environmentUV is set. These new clones and the legend do not have that flag. The probe observed zero disposal events for all 14 original owned geometries at bake or subsequent world disposal. The merged render geometry follows the normal world-disposal path. The source originals are CPU-side inputs before the normal first render and can become garbage-collectable, so this is not evidence of a GPU leak. It does mean the current tests do not prove explicit cleanup of every newly owned geometry through batching. Do not describe the whole geometry lifetime as fully verified.

Retained capture metrics report 78 overview and 85 in-scene draw calls, unchanged from baseline, with 874 additional triangles in either comparison. Corrected totals are 90329 and 90629 respectively. The separate motion fixture reports 83 calls, not 85. These are retained measurements, not a fresh GPU run by this reviewer.

## Verification and limits

Fresh independent command:

`npx vitest run tests/SafetyInterlockBlockout.test.ts tests/SafetyInterlockArchitecture.test.ts`

Both files passed, 15 tests passed. The rerun is retained in independent-focused.log. Git diff --check passed. The fresh probe completed successfully using Vite's CPU SSR module loader in middleware mode, without listening or launching a browser. The repo remains at the same four modified source/test files.

The retained full-test.log reports 82 Vitest files passed, one skipped, 774 tests passed and one skipped. Retained build and evidence-test outputs support the producer's wider verification claims. I did not rerun the full suite, production build, browser smoke or GPU captures. The screenshots contain controlled staged actors and no DOM HUD. They do not establish campaign traversal, touch readability, full story delivery, live combat acceptance or performance across devices. The new label dates the local record; it does not independently verify all stage-4 story requirements.

Probe setup encountered unavailable esbuild and then external-path resolution for three. The final CPU loader used an explicit alias to the repository's existing Three module and succeeded. The automatic single-file TypeScript lint wrapper reported TS5112 before execution. That wrapper result is not a production typecheck failure or a claimed typecheck pass. No dependency was installed and no runtime source was edited.

Only this review, independent-cpu-probe.ts and its output log, and independent-focused.log were added under budget-correction. No commit, publication, receipt or historical review was changed. Publication and disposition remain with the parent.
