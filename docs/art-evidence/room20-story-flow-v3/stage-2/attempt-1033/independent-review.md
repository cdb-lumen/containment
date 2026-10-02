# Room20 stage2 independent review

Verdict: PASS for stage2 rough models placed on the approved layout. No blocking source or focused-test failure found. This is not finished-room acceptance, human acceptance, release approval or verification of the fatal sequence.

Reviewer: independent read-only Hermes subagent. Review performed on 2026-10-02. Read the current worker prompt, map-model-production.md, production-guard.md, stage1 attempt1032 brief and live issue42. Scope is rough primary silhouettes at intended scale inside the canonical void, with distinct coolant, power and restraint assemblies. HUD and mobile visibility are not acceptance gates.

## Source and scope

Reviewed worktree HEAD ab440d2ebe9d5dce33b224127ddc45ae38287ca5 against local origin/main 7a3f262886104fb024de9684958b3f85a8859f34. No fetch or Git ref write was performed. Remote-base freshness remains the parent's responsibility.

The tracked comparison contains only prior Room20 stage0/stage1 evidence and the AuthoredRooms.ts import plus reactorFloor replacement. The two untracked candidate files, OverloadDraft.ts and OverloadDraft.test.ts, were read in full. No other runtime changes appear. Shared engine, gameplay, camera, HUD, lighting and other-room implementations are unchanged. The reactorFloor call remains exclusive to overload-floor. Removing equipment's reactor call does not remove canonical blockers because this room's obstacle list is empty.

Canonical topology, spawn, four breaches, empty obstacles, compatibility coordinate and story source remain byte-identical to origin/main through the unchanged source paths. The candidate adds no exit sign, evacuation arrow, pod, hazard or gameplay mechanic. The current source matches every file pin in the capture's source-after.json, and source-before.json equals source-after.json. Review pins also match the captured source. See source-pins.json and scope-and-evidence.json.

## Independent CPU execution

All outputs were written to this sibling directory, never to the candidate originals or manifests.

- `node_modules/.bin/vitest run src/render/OverloadDraft.test.ts --cache=false`: 4 passed, zero failed.
- `node_modules/.bin/vitest run src/render/AuthoredRooms.test.ts --cache=false`: 14 passed, zero failed.
- `node --experimental-strip-types --experimental-loader ./ts-loader.mjs ./check-routes.mjs`: 179 passed assertions, zero failures, zero errors. The checker and loader are exact copies from stage1 attempt1032 and import current production geometry.
- `git diff --check origin/main`: no whitespace findings.

The new tests inspect actual transformed mesh vertices against all four reservations and the void. They check support depth, triangle and bound preservation through both batching steps, six material meshes and single disposal of the tracked resources. The route rerun checks radius16 and radius28 occupancy, reversible retreat-loop segments, spawn connectivity, diagram connectors and negative controls for the void, external space, concave notch and injected obstruction.

No test was changed or weakened. No full test suite, build, GPU job or browser was run by this reviewer. Node emitted an experimental-loader deprecation warning, not a failed route assertion.

## Original-image review

Loaded both original PNGs separately through the vision tool. Both decode at 1280 by 900 and show the intended room rather than a loading screen or runtime error.

| Original in ../attempt-1033 | SHA256 |
| --- | --- |
| 20-overload-floor-overview.png | d99c9b4f39edfcb525d4f0ba91bb8b4f2b2d9272e4661f2bfbd5f0850ace0ffb |
| 20-overload-floor-gameplay.png | aac11427d7002ecf380fae19c50569bbe34a6c186adf5eeded1e5084b4af4d81 |

The overview shows the whole three-lobed deck and the central well. The left coolant head has paired thick pipes with pale sleeves. The right power head has three bronze blades held by pale crosspieces. The front restraint head has two broad cheeks around a central bronze piston and dark jaw. The central reaction column and stacked rings remain a separate vertical focal form. Their spacing and different construction distinguish the three heads without relying on labels. They occupy the void rather than the surrounding retreat deck.

The desktop image preserves those distinctions at its closer production camera scale. The coolant header, bus blades and restraint cheeks remain visible with staged actors on the south deck. The reaction column is taller than the heads; the heads read as substantial installations beside the player rather than small floor props. No added assembly visibly roofs the deck or spills across the well edge. Foundations descend into the well, though the dark lower space does not demonstrate every support contact.

These are controlled simulation captures, not a live campaign recording. The manifest explicitly reports no DOM HUD, inactive encounter director, no boss and no campaign progression. Overview uses room-fit framing. Desktop retains production camera/composition. Both rows report empty errors, webglError 0 and no context loss. Those renderer results are the writer's recorded capture evidence, not independently rerun GPU checks.

## Concrete remaining issues and limits

1. The new test named "places distinct Room20 service heads" asserts role metadata, not silhouette distinction. It could pass if the geometry became visually identical while names stayed unchanged. Actual pixels establish distinction for this candidate; that test alone must not be treated as a future visual guarantee.
2. Mechanical continuity remains rough. The restraint connector at OverloadDraft.ts line51 is a short isolated run from z480 to z460 at height -18, rather than a demonstrated complete attachment to the core and jaw. The imagery does not prove a functioning load path. This is model-iteration work, not a blocker for the approved placement stage.
3. The narrow core and plain supports are blockout forms. Segmented coil shoes, developed under-deck braces, localized wear and resolved joints are not delivered by this pass. Do not call the installation finished.
4. Static column emission is deliberate. Real overload-state lighting, dense-combat readability, near/far approach coverage, dynamic crowd routing, projectiles and the fatal ending were not independently exercised. The existing no-escape story is preserved in source, not proven by this capture fixture's traversal to the compatibility coordinate.
5. The void test relies on the current convex polygon and winding. It is appropriate for the unchanged canonical void, not a general concave-polygon containment test.

The bounded stage2 goal passes. Further production should retain the distinct silhouettes and open deck, then resolve construction and sequence lighting under later permits. Parent visual review, publication readback and any receipt remain separate responsibilities.

## Reviewer writes

Only this external attempt-1033-independent directory was created or written. It contains this report, copied route checker and loader, CPU logs/results, source pins and the compact scope/image inventory. Repository source, candidate images, candidate manifests, guard state and publication state were not modified. No commit or publication was made.
