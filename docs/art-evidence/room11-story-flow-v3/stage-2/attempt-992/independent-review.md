# Room11 stage2 attempt992 independent review

## Verdict

PASS for rough occupied cryopod identity and placement. This is stage2 acceptance of the bounded model correction, not approval of finished materials, the full room narrative, or release readiness.

I inspected both original PNGs with the vision tool before reading source construction details. I also inspected a crop of the in-scene cutaway to check the small silhouettes. I did not read or inherit attempt992's author review.

## Visual findings

- `overview.png` shows four separate, elongated cyan-rimmed berths on the top tier of the north cutaway. Pale round heads and lengthwise bodies distinguish these from the round console instruments below. The clipped shell ends and dark interior make the group read as miniature occupied berths rather than a row of empty indicator lights.
- `desktop-in-scene.png` gives the stronger occupancy read. Each berth has a head at the left and a pale body extending right, with dark breaks between the body and surrounding parts. The repeated resting orientation inside individual shells is sufficient for a rough occupied cryopod model. The figures remain schematic, not detailed passengers.
- Placement passes. The berths sit within the upper deck assembly, share its orientation, and have visible small amber connections toward the deck line. The stepped decks, common amber spine at the left and pedestal remain legible. Nothing in these views makes the pods appear to be loose floor props or separate consoles.
- The two low curved console banks frame the central space without hiding the north display. The staged actors do not occlude the pod row in either supplied frame. The overview retains visible open floor around the furniture and through the interrupted console arrangement.

Small-scale limits matter. In the overview, individual limbs are near the pixel limit and some pale body pieces merge. The in-scene original supports a simple head-and-body reading, but the crop is needed to inspect the limb construction comfortably. I am not claiming that every limb or each passenger's living state is independently readable at a glance. Nor do these pixels alone explain that the amber network is a destructive purge system. Those limits do not block this stage2 identity and placement check.

## Brief and scoped code review

I read `stage-1/attempt-971/layout-brief.md` for the prior requirement: a physical north ship cutaway, occupied cryo symbols linked to its common bus, a south-facing reading apron, and two interrupted low console banks. The occupied pods are miniature contents of the cutaway, not full-size beds placed in the room.

The current Git diff changes only `src/render/DiagnosticGalleryModels.ts` and `tests/DiagnosticGallery.test.ts`. The renderer replaces rectangular pod markers with wider clipped-end shells and dark insets, moves the heads within those shells, and adds distinct torso, arm and leg meshes. The four pod centers and feed connections are unchanged. No topology, shared lighting, camera, HUD or interaction change appears in this diff.

The added regression checks all four berths for extruded shell geometry, elongated bounds, contained body parts, head separation and a gap between legs. Existing checks retain the approved solid footprints, route clearance, model registration and Room12 exclusion. These are geometry safeguards, not a substitute for the pixel review. I found no blocking defect in the scoped change.

## Independent verification

- Both original images are 1280 by 900 and match their SHA256 values in `capture-summary.json`.
- All 208 recorded source hashes match the worktree. HEAD matches pinned commit `f6c224b4c61ddec38b464da0539c9905232f33fb`.
- Ran `./node_modules/.bin/vitest run tests/DiagnosticGallery.test.ts`. Result: 1 test file passed, 7 tests passed, exit code 0. Output is saved in `logs/independent-focused-tests.log`.
- `git diff --check` passed. The tracked modified-file list remained the same two source/test files; I made no source edits.
- `verification.json` records successful full tests, build, evidence tests and capture. I read those recorded exit codes but did not independently rerun those broader jobs.

## Evidence boundary

This is controlled staged simulation evidence without a DOM HUD. The capture metadata describes a room-fit overview and production camera/composition for the in-scene view, fixed-step combat, an inactive encounter director and no campaign progression. I did not run a fresh capture or live play session. There is no mobile, touch or HUD acceptance claim and none is a gate for this requested review. Materials, glass treatment, passenger detail, full narrative comprehension and broader gameplay acceptance remain outside this verdict.
