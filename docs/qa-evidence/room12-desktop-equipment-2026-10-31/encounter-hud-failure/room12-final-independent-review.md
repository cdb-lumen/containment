# Room12 native encounter — independent final evidence review

The capture establishes successful encounter/reward/onward and clean sampled movement geometry, but **fails broad marine-visibility qualification**. Its internal recorder pass only covers ammo/viewport clearance; actual pixels reveal story-panel and health/armor-panel obstruction. Preserve this distinction and the recording.

## Concrete visibility findings

- **P2, frame199:** expanded dialogue covers almost the entire marine at body bounds x115.923869..156.832960, y219.758473..302.269047. The character is difficult to locate behind the translucent text panel and nearby enemies. Frame200's real Skip collapses dialogue, revealing much more of the marine while retaining status/objective. This source predates the reviewed movable status column.
- **P2, frame495:** marine bounds x136.768896..177.677987, y32.915175..115.425749 are inside the viewport, but the fixed upper-left health/armor panel hides the helmet/torso; principally lower legs are visible below it. Moving the status column alone does not fix this pose. A targeted vitals obstruction repair and matched witness are required before claiming that the marine remains visible throughout combat.

These are observed overlay obstructions, not a demonstrated Room12 model/collision defect. Do not infer that the later HUD stack fixes both without evidence. Enemy meshes can also overlap HUD or extend beyond the upper viewport; all-enemy visibility is not certified.

## Verified provenance and video

Capture `/workspace/room12-desktop-final` pins `bfc0126838187bb4820dca5d3f17d47579690cf4`. Independently verified all286 recorded source hashes against that commit, identical clean before/after source records, video SHA and saved harness SHA `0243ee0ac443a597e1d5a569870ebc7d6442ac3e735acf0fb8287f628f43e653` (`campaign-desktop-visibility.mjs`). There are662 PNG frames; full ffmpeg decode succeeds and independent ffprobe counts662 frames at1280×900.

Terminal encounter is reward,26 kills, zero remaining, followed by actual Coolant plant entry. Full-resolution reward/onward images show legible native Infirmary supply interaction and the next room. This is a seeded valid-build/default-resource fixture with ordinary production encounter semantics, fixed50ms main-frame stepping and suppressed external font CSS. Prior rooms are fixture construction, not played encounters; no device-FPS or historical replay claim follows.

## Independent geometry and HUD bounds checks

Loaded the exact source through CPU-only Vite SSR and independently checked raw manifest actor occupancy and all adjacent sweeps with production geometry:4495 enemy sweeps,661 player sweeps, errors[]. Results are `/workspace/room12-independent-trace-verification.json`, diagnostic script `/workspace/check-room12-trace.mjs`. No chord exception was needed. This validates recorded snapshot chords; it does not claim instrumentation of every within-frame substep.

Independently recomputed body/viewport containment and body/ammo intersections for all661 playing frames: zero failures. Ammo stays right throughout. The minimum body top is32.915175 atframe495. The actual vitals obstruction there demonstrates why these two rectangle checks alone are insufficient for a general visibility claim.

## Skip and model observations

Inspected full-resolution frames199,200,495,640 plus reward/onward. Frame199 visibly contains the expanded authored safety-record dialogue and Skip control; frame200 removes dialogue while leaving status/objective readable, and combat continues. The harness uses a real mouse click atframe200, asserts game.storySkipped and presentation hidden, preserves nonempty status/objective, and requires a playing frame at/after the click. Manifest records all of those checks successful. This is meaningful native Skip evidence, not simply a programmatic hidden flag.

The pale sealed recorder remains a prominent focal object; the corrected service lid and loose plug are visible in the gameplay images. The earlier failed34d panel hardware-intersection candidate remains failed and is not requalified by this source. These sampled combat views supplement the previously reviewed matched mechanical/static evidence; they do not grant human art approval.

## Remaining integration and acceptance work

This report pins bfc only. Subsequent HUD/current-main integration requires explicit source fidelity and relevant validation. The fixed-vitals witness is outside the existing status-column fix and remains unresolved. Full desktop gameplay visibility, human art approval and final delivery are not accepted by this report. No renderer was launched or shipping source changed during review.
