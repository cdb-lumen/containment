# Room13 overall technical validation

Technical checks passed on unchanged source. Fresh overview and desktop PNGs are ready for parent review. This report does not grant an overall art verdict, human acceptance or release approval.

## Source

Worktree: /home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3
Branch: art/coolant-plant-v3
Commit: 7ce0bd6a5287fb79d1f352f31e823dc06bf226cb

source-pin.json records the commit, tree, local origin/main reference and SHA256 of 337 runtime, test, harness, public asset and configuration files before execution. source-verification.json confirms unchanged HEAD, no source hash mismatches and clean git status after capture. The origin/main value is a local reference, not a fresh remote fetch claim. No runtime or scoped test edits were made.

## Images: controlled simulation

Both originals are 1280x900. Flat final files are exact byte copies of fresh harness output, not relabeled historical images.

- final-overview.png, original capture/13-coolant-plant-overview.png. SHA256 b982af57a2692c55998db4c6b3dfeaff408b0e21f2c9adc6a805e190e0224fa7. Freshly rendered, but byte-identical to stage4 attempt985 overview. Do not count this as novel bytes.
- final-desktop.png, original capture/13-coolant-plant-gameplay.png. SHA256 3ed754365ebfdb77ed36f63ff62781fe5cbda69276bb01810104a3aeed860da8. Different bytes from stage4 attempt985 desktop.

image-manifest.json records decoded sizes, bytes, hashes, prior-image comparison, errors and metrics. capture/manifest.json and inventory.json retain the raw harness records. Pillow decoded both images and matched each harness hash.

These images use controlled simulation with staged legal actors, fixed-step production combat, high-quality production rendering, inactive encounter director and no DOM HUD. Overview uses the harness fitted camera. Desktop retains production composition. Neither image demonstrates an ordinary live campaign encounter, full playthrough or real input handling.

## Commands and results

All repository commands ran in the worktree above. commands.json preserves exact arguments, cwd, exit codes, duration and log paths. Logs are outside the repository under this attempt's logs directory.

1. `npx vitest run tests/CoolantPlantBlockout.test.ts tests/ShipEnvironments.test.ts tests/StoryRoute.test.ts tests/unit/expeditionGeometry.test.ts tests/unit/authoredTopology.test.ts tests/SafeRoomLoading.test.ts`: exit 0, six files and 56 tests passed.
2. `npm test`: exit 0, 770 Vitest tests passed and one skipped, followed by two passing Node tests and all invoked Python asset suites passing. The unrelated passenger-vault asset checks are broad regression evidence, not coolant-specific mesh validation.
3. `npm run build`: exit 0. Vite retained its chunk-size warning for the main bundle.
4. `npm run test:room-evidence`: exit 0, 22 Node tests passed and the ragdoll CPU self-test reported 33 checks passed.
5. `git diff --check`: exit 0.
6. `node scripts/room-evidence.mjs --rooms=coolant-plant --gameplay-all --verify-all --viewport=desktop --quality=high --out=/home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-5/attempt-986/capture`: exit 0, two PNGs.
7. `python3 /home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-5/attempt-986/verify-evidence.py`: exit 0, image decode/hash/size checks and prior-attempt comparison completed.

The harness traversed spawn to exit with 328 legal checks and exitDistance 0. Desktop combat performed 25 fixed steps, four shots, damage 48 and 100 legal checks with three active enemies. Overview had 66 draw calls and 95163 triangles. Desktop had 69 draw calls and 95053 triangles. Both reported no browser errors, WebGL error 0 and no lost context. Duplicate-module abort URLs remain in the raw manifest, accepted only by the existing exact-URL-also-completed harness rule.

## Source inspection and physical limits

Read CoolantPlantBlockout.ts, CoolantPlantBlockout.test.ts, ShipEnvironments.ts, ShipEnvironments.test.ts and the capture harness. Existing coolant tests exercise all five solid footprints before and after batching, floor contact at assembly bounds, height limits, six flush service paths, radius16 and radius28 circuits, both central bypasses, required exit routes, shot blockage, neighboring-room registration and material batching. ShipEnvironments tests exercise cached geometry/material survival and owned baked geometry disposal.

The tests named for pump connection and expansion-vessel connection are weaker than their names imply. They check named objects and shaft/motor center alignment, not every pipe-to-shell contact or hydraulic continuity. Whole-assembly bounds at floor level do not prove that every small detail has support. No exhaustive connected-component, mesh intersection or per-detail support test exists here. No such pass is claimed and no tests were added or changed.

The below-deck network is represented by flat covers rather than modeled buried pipes. The cutaway strainer is deliberately open, not a sealed pressure vessel. These are art abstractions, not a mechanically certified plant. Source inspection found no new route intrusion or footprint mismatch. No coolant-owned external textures or meshes are introduced by the procedural builder.

I inspected both original images. The four main skids sit on the floor, the central saddle remains low, and the flush connections leave both bypasses legible. I saw no clear floating main model or main-model clipping. The high desktop angle compresses the volute profile and makes the strainer half-shell harder to read than its cage. The overview shows the far exit; desktop crops it. The northern wall pipe visibly projects beyond the right end of its backing panels, an existing shell termination detail for parent visual review, not a demonstrated collision failure. No overall physical/model certification follows from these two views. Independent and parent art review remain separate.

## Failures, omissions and cleanup

No executed test or capture command failed. One execute_code attempt was blocked by unattended policy before it ran. The same local image verification was then performed through a saved Python script and ordinary terminal without changing policy. An out-of-range file read returned empty and was corrected with an in-range read. No failed evidence was deleted.

No full `npm run verify`, built-app smoke, mobile capture, live campaign playthrough, continuous combat recording or full browser resource lifecycle test ran. The existing unrelated release dependencies remain outside this validation.

The harness removed its temporary .room-evidence directory and closed its browser and server. Post-run process and listener snapshots are logs/processes-after.log and logs/ports-after.log. No Chromium or room-evidence process remained. The unrelated containment-boons Vite process on port5193 was left untouched. Build output remains in ignored dist. Source stayed clean.

Only local attempt evidence, logs, validation scripts and this report were created. No guard calls, receipts, commits, push, publication, approvals, merges or vault writes occurred. Parent owns independent review and publication.
