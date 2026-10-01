# Room11 stage3 independent review

## Verdict

PASS for bounded stage3 room visuals. No blocking stage3 defect found. This is not stage4 model acceptance, final room acceptance or release approval.

I directly inspected the original `desktop-in-scene.png` and `overview.png`, not an author contact sheet. The parent's favorable impression was supplied in the assignment, so this review was independent inspection, not blind review. I did not use `author-review.md` to establish the verdict.

## Visual findings

The semicircular teal apron joins the two curved console banks and the rear cutaway into one working area. The darker surrounding deck leaves the center readable. The narrow entry spine points toward the central opening without introducing another dominant shape. The overview shows open side circulation and the retained rectangular room envelope.

Muted teal and greyed ivory are consistent across the apron, banks and rear cladding. The pale bank tops remain distinct from the floor. Amber is strongest in the purge diagram. Existing perimeter dashes are secondary rather than a competing arena grid. Rear ribs and the horizontal instrument band give the shell structure without overwhelming the cutaway.

I see no obvious floating architecture, broken shell join or new obstruction in either original. The four occupied berth forms remain visible on the top diagram row. Their fine human detail is not fully legible at whole-room scale, but the stage3 diff does not change those silhouettes.

Non-blocking observations for later work:

- Existing transverse deck lines remain visible outside the apron and across the entry spine. They add some visual busyness, but their low contrast does not defeat the new floor hierarchy.
- The paired dark service runs terminate inside the apron and can read as upright thin rods in the desktop view. The geometry is flush floor detail, not a collision obstruction. Recheck this cue during later in-context refinement if it continues to distract.
- Material age currently reads mainly through the subdued palette. Local wear and stronger object-specific construction cues remain stage4 work, not grounds to fail this shell/material stage.

## Scope and technical review

The dirty source is limited to new `src/render/DiagnosticGalleryArchitecture.ts`, Room11 registration in `src/render/ShipEnvironments.ts`, and the added focused test in `tests/DiagnosticGallery.test.ts`. The Room11 early return intentionally replaces generic environment architecture. No layout, occupied-model, HUD, camera, lighting or gameplay source changes are present in this diff.

Floor bounds stay inside the room and below the test's 0.015 world-unit ceiling. Shell geometry remains at or behind z=0, outside walkable space. Existing tests retain the approved three solids, anchors, radius 16 and 28 routes, and vertex containment of the occupied models.

The new meshes flatten through `appendEnvironment` with their matrices preserved. `DepthRenderer.bakeWorld` groups them by shared material. Room-local materials have `actorMaterial` ownership, so `disposeModel` releases them and the baked geometry during room teardown. This is code-path review, not a fresh GPU lifetime test. No new texture or light resource is introduced. The focused tests do not directly assert Room11 post-bake disposal events, which remains a coverage limitation rather than a demonstrated leak.

## Verification and evidence limits

Fresh command:

`./node_modules/.bin/vitest run tests/DiagnosticGallery.test.ts tests/ShipEnvironments.test.ts --reporter=verbose`

Result: 2 files passed, 33 tests passed, exit 0. DiagnosticGallery's 8 tests passed. Output is retained in `logs/independent-focused.log`. `git diff --check` also passed.

All 209 source hashes in `source-pins.json` matched the current checkout. HEAD matched `2c49a4c0b55f48d211df5bfda40978a6640c63bf`. Both original PNG hashes matched `capture-summary.json`.

The supplied evidence is controlled staged simulation with production rendering and desktop camera composition, no DOM HUD, inactive encounter director and no campaign progression. It is not ordinary live play. Static pixels do not establish full combat, traversal or temporal stability. HUD overlap and mobile visibility are not gates under `map-model-production.md`.

The existing verification manifest reports passing full tests, build and evidence checks. I did not rerun those broad jobs or a GPU capture. No runtime edits or publication were performed.
