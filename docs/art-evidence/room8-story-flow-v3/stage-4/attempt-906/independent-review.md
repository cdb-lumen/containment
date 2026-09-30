# Independent Room8 stage 4 review

Verdict: passed for important-model iteration in context.

Recommendation: stage_complete true for the stage 4 art/code review. The worker must still satisfy the contract's publication and remote-byte verification requirements before advancing. This review does not grant final-room acceptance, release approval, or stage 5 acceptance.

## Scope and evidence

I read map-model-production.md, story-flow-v3/brief.md and the Room8 entry in src/game/roguelike/storyRooms.ts. The canonical objective remains "Fight around the sealed breach." The story remains "Alien growth follows the boarding scar. Hull seal intact."

I directly inspected these original PNGs with vision:

- before-desktop-stage3-pinned.png
- desktop-in-scene.png
- before-overview-stage3-pinned.png
- overview.png
- completed-model-contact-sheet.png

All five image hashes match artifact-checks.json. The before images also match the stage 3 image bytes in local Git HEAD e54d86af8c1d3bea95d86dce3982cd2dc1d6604c. Both runtime source hashes in capture-result.json match the candidate worktree. All recorded current source pins match their files. The contact sheet is labeled as crops of actual after renders, not separate model-view captures or whole-room acceptance.

These are paused, staged Chromium art views. The capture script uses the normal desktop camera and HUD for desktop-in-scene.png and a capture-only fitted camera for overview.png. The metadata records a legal player pose at 590,620, high quality, no WebGL error, no lost context, and no recorded page/request errors. Static images and this metadata do not prove live combat, frame pacing or traversal. HUD overlap and mobile visibility are not gates here.

## Visible result

The central assembly remains closed. A continuous plated base surrounds the raised green body. No new black opening or view into space replaces the hull seal. The diagonal scar remains the room's dominant object, with open floor around it in the before and after overview.

The body loses the repeated orange crown blocks. Interrupted pale ribs and unequal terminations break up the previous cage-like repetition. The green colonies along the near seam now connect through a visible low root instead of reading only as separate evenly spaced beads. Their placement supports growth following the scar rather than unrelated growth scattered across the routes.

The torn rim changes from large bright plate fragments to smaller notched metal edges with rusty outlines. The freight container gains corner fittings and dark fork-socket marks at its base. The paired outbound loads sit on a visible slatted pallet with skids and front buckles. These are readable changes in the room view, not details visible only in source. The east fixture gains pale edge strips that separate its posts from the dark floor.

I see no obvious new floating freight or model detail projecting into the open circulation space in these views. That is a bounded visual finding, not an exhaustive collision certification.

## Remaining visible flaws

- The boarding body still has a smooth, broad, faceted green flank and a regular transverse-rib vocabulary. It can still read as a manufactured ribbed capsule before it reads as alien growth. The variation improves it but does not eliminate that ambiguity.
- The bright near-edge tears repeat as small triangular teeth. Their regular spacing looks decorative in the overview, and the far-edge tears become thin rust-colored marks. The damage does not yet have a strongly varied rupture silhouette.
- The seam colonies are connected, but the branching into the main body is much less obvious at normal desktop scale than the exposed root between the rounded lumps. The contact sheet makes that improvement easier to see than the whole-room image.
- The east fixture remains a sparse, dark, cross-like structure. Its new strips improve separation, but do not make its purpose immediately legible without room context.

These are retained art-quality concerns for overall validation. They do not negate this stage's demonstrated model refinement, intact seal, or preserved layout. Do not report them as fixed.

## Code and tests

I inspected the live Git diff, the preserved renderer patch, and Room8Models.test.ts, Room8Placement.test.ts and Room8Visuals.test.ts. Runtime changes are confined to breachedBay in AuthoredRooms.ts. A direct comparison confirms the source outside that function is identical to HEAD. Topology, story, navigation, HUD, camera and shared gameplay source remain unchanged in the recorded pins.

The batching limit changes from less than 22 to less than 26 only for breached-loading-bay in both affected AuthoredRooms tests. Other tested rooms retain less than 22. Four separately owned local finishes explain the increase: seam growth, torn metal, freight supports and east-fixture cladding. This is a disclosed room-local rendering-budget adjustment, not a relaxation of movement or collision assertions. It does not establish runtime performance by itself.

The new model tests check growth and torn-edge vertices inside the sealed scar, freight-support vertices inside existing freight rectangles, grounded support bounds, clearance between the clad east posts, finite geometry and material disposal. They also check that these material names do not appear in the sampled other rooms. Existing placement tests retain sampled north/south route clearance for radii 16, 28 and 38, navigation reachability and moveCorpse movement along those routes. Those checks are useful bounded geometry regressions, not a live actor/combat playthrough. Existing seal tests raycast the raised seal at specified points.

The concave torn profiles use ShapeUtils.triangulateShape rather than a simple triangle fan. Their height is linear in the profile depth, so this patch does not introduce the nonlinear post-triangulation bend pattern that can create an unintended diagonal fold.

I reviewed the preserved execution logs rather than rerunning a browser or build against the frozen worktree. focused-tests.log reports 3 files and 11 tests passed. npm-test.log records 83 Vitest files passed, 1 skipped, and 770 tests passed, 1 skipped, followed by the separate node:test and asset checks. build-final.log records successful TypeScript checking and Vite production build, with a chunk-size warning. The unfocused vitest-final.log is not green: it reports one failed suite because scripts/cryo-model-preview.test.mjs is a node:test file with no Vitest suite. The supported npm test command explicitly excludes that file from Vitest and runs it through node --test. That discovery failure is preserved and is not evidence of a Room8 product regression.

The preserved source.patch contains the renderer change only. I inspected the batching-test delta directly through Git and the new test directly from the worktree; the new test matches its evidence snapshot. The renderer-only patch should not be described as the complete test-inclusive diff.

## Handoff

Accept this bounded stage 4 review and proceed to stage 5 only after publication checks pass. Stage 5 must make its own whole-room judgment, including the visible ambiguity and repetitive damage listed above, collision agreement and affected movement. No runtime source, test, capture, browser process or publication state was changed by this review. The only file written was this report.
