# Room15 stage4 attempt1009 independent review

Verdict: FAIL for bounded stage4 model acceptance. The new resin is visible across the housing, but its grip and the tendon brace's two anchors still do not communicate clearly at native gameplay scale. This is a visual failure, not a rejection of the established lathe or room layout.

## Evidence and scope

Read map-model-production.md and attempt1008/independent-review.md. Loaded all five requested originals with vision: before-gameplay.png, before-overview.png, after-gameplay.png, after-overview.png and model-contact-sheet.png. The four scene images are 1280 by 900. The contact sheet is 1000 by 740 and explicitly labels its enlarged crops and native-size crops. Native scene images drive this verdict. Enlargement supplies context, not a substitute acceptance view.

The changed object is the northwest lathe, at the upper left of gameplay. The upper-right gantry is not the target. Before images are byte-identical to attempt1008's after images. All 164 current source hashes match source-pins.json. Reviewed the actual worktree diff against HEAD 7e24f3f386bd8dafb1e862f1b915f5a74bde8f1f. Only src/render/InfestedWorkshop.ts and tests/InfestedWorkshop.test.ts are modified.

These are controlled simulation stills without the DOM HUD. They are sufficient for this bounded model review, not live traversal or final room validation. The retained verification record describes deterministic readiness, not complete serialized camera and actor equality. HUD absence and missing mobile evidence are not art failures under the policy.

## Native visual findings

### Resin gripping the housing: fail

The prior lower-edge fringe has become a broad, plainly visible pale covering. This fixes the visibility problem. In after-gameplay.png it covers much of the left yellow housing and hides its dark inset. In the overview the covering remains visible.

Its shape now reads more like adjacent flat vertical strips or a draped slab than an alien membrane gripping a casting. Long straight seams dominate the covering. The top ends in a stepped edge against the yellow face, while the lower edge reaches the bed without a clear flared attachment. I cannot independently read the intended roof fold and gripping contact from the native image. The contact sheet makes the strips larger but does not make that wrap unambiguous. This is a different defect from the old fringe, not a claim that nothing improved.

A future authorized change should clarify the broad membrane's turn around an exposed housing edge and its spread into the bed. Preserve visible yellow housing around that connection. More narrow seams would reinforce the current strip-like read.

### Tendon brace and anchors: fail

The pale diagonal span above the stock is much easier to locate now. Its upper-left end visibly overlaps the arm near the hinge. However, the broad lower-right tip reads as a projecting tongue. The small pale/yellow patch below it does not clearly establish an anchored connection back into the machine foot. At native gameplay scale I cannot trace a continuous load-bearing brace between two identifiable attachments. The overview compresses this into a diagonal strip over the arm and does not resolve the foot anchor.

This is not a finding that the geometry necessarily floats. It is a finding that the supplied pixels do not communicate the claimed two-ended attachment. Keep the improved exposed span, but make the foot contact readable instead of relying on overlap hidden behind the tip.

### Cut insulation: fail for the complete damage read

The copper-colored cut end is now visible above the diagonal brace, and a dark torn piece projects to its right. That is an improvement over attempt1008. The upper copper end reads as a small rectangular mark, while the dark return and peeled flap merge with the rear machinery and shadow. I cannot resolve one continuous supply line interrupted by an open cut, with its separate peeled sheath, in the native gameplay image. The enlarged sheet reveals more of those parts, but native pixels still leave their relationship ambiguous. This remains a secondary defect, not the sole basis for failure.

### Lathe, supported stock and broken guard: bounded pass, preserve

The silver chuck, horizontal copper stock, central gripper/carriage and yellow right-hand tailstock still form a recognizable lathe. The stock remains visually seated along the working axis without obvious floating. The jagged yellow guard above the left housing still reads as broken rather than ordinarily opened. The resin obscures more housing detail, but these defining mechanical relationships survive in gameplay and overview. Do not undo the stock alignment or replace the broken silhouette while addressing the attachments.

## Code and CPU checks

Ran independently in the supplied worktree:

```sh
git status --short
git diff --stat
git diff -- src/render/InfestedWorkshop.ts tests/InfestedWorkshop.test.ts
npx vitest run tests/InfestedWorkshop.test.ts tests/ShipEnvironments.test.ts
git diff --check
git rev-parse HEAD
```

The focused run passed 37 tests across 2 files. git diff --check passed. A separate Python check verified all source pins, image dimensions and before-image equality with attempt1008. Final status still lists only the two candidate files above.

The runtime diff changes the web's local normals, UV scale and raised seam, extends resin across the headstock, exposes the tendon span, adds cuffs and relocates the severed supply pieces. The diff preserves the stock and guard construction. No camera, HUD, shared gameplay or topology edit appears in it.

New tests check resin extent above the roof, tendon anchor containment in owner bounding boxes, brace size, cuff existence, and supply-piece bounding-box intersection and separation. These strengthen structural coverage without weakening existing assertions. They do not prove exact mesh contact or native readability. In particular, cuff existence is not a check that both cuffs visibly bridge the membrane and mechanical owners. Passing CPU tests cannot reverse the visual failures.

## Boundaries and remaining issues

No runtime edit, commit, publication, GPU job or recapture was performed. This review creates only independent-review.md. Parent full-suite, build and room-evidence success are recorded in verification.json, not independently rerun here.

Existing route corner and radius48 failures remain unresolved and unwaived. They were not rerun in this focused review. No full browser, movement, projectile, collision, live combat, release or human acceptance is claimed. This review does not grant another attempt or alter the retained budget. Preserve the candidate and prior evidence regardless of any later routing decision.
