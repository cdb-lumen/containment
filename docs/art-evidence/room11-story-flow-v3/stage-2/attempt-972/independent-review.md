# Room11 stage 2 independent review

Verdict: FAIL for the complete rough-model-placement gate. The theatre arrangement and route reservations pass. Occupied cryo recognition does not pass in the retained views. This is a silhouette and symbol-readability finding, not a demand for finished materials.

## Evidence reviewed

- Source commit `18c16502102755c91220bf8d533c6198ee83e8dc`. The inspected worktree was clean and HEAD matched this commit.
- Both original images inspected with the vision tool: `capture/11-diagnostic-gallery-overview.png` and `capture/11-diagnostic-gallery-gameplay.png`.
- Both PNGs are 1280 by 900. Their SHA-256 hashes match their respective manifest entries. The manifest contains exactly these two capture results.
- Commit diff, room-specific tests, production geometry code, capture manifest and log, red and green test logs, build log, typecheck log, and production-validation script and output.

## Visual findings

| Requirement | Decision | Retained-pixel evidence |
| --- | --- | --- |
| Systems theatre and curved consoles | Pass | Two low curved instrument banks face the north display. Their interrupted arc and central opening remain obvious in both views. The repeated recessed dials read as consoles rather than unrelated barriers. |
| Physical ship-section | Qualified pass | The raised pedestal, stepped deck plates, left end frame and pointed right hull edge establish a physical sectional model. It is not a flat wall screen. Ship identity is weaker than the theatre arrangement, since the long parallel plates also resemble a systems rack. |
| Purge connections | Qualified pass for rough connections | Amber branches visibly span the deck levels and meet a common left spine. This communicates a connected system. The pixels alone do not identify the system specifically as purge or communicate its lethal consequence. |
| Occupied cryo symbols | Fail | The small teal-framed rectangles above the rear deck read first as generic instrument screens. The gameplay view resolves a pale dot and short bar in each, but that is not a clear occupied berth or cryopod silhouette. The overview weakens this further. Code names cannot supply missing recognition. |
| Scale and visible routes | Pass within this evidence | The consoles are low relative to the actors. The model is a focal display rather than room-filling machinery. The overview exposes side passages, a broad rear cross-aisle, a central opening and a clear apron before the model. Enemies occupy part of the center in gameplay without hiding the main display. |

Keep the console placement and route layout. Before accepting stage 2, give the miniature occupied berths a clearer enclosing pod shape and a readable reclining-person silhouette at the existing gameplay framing. Preserve the visible connection to the deck network. More surface detail alone would not address this failure.

## Code and validation

The commit registers the models only for `diagnostic-gallery` and replaces its interior topology with three sealed furniture polygons. Meshes carry solid-owner IDs. Tests check approved footprints, shell and anchors, routes at radii 16 and 28, blocked interiors, model registration, transformed vertex containment and Room12 exclusion.

The green log reports 39 passing tests across three files. The initial red log failed before test execution because a fixture path was missing. The subsequent valid red log reached five room tests and failed four. The build completed, including TypeScript checking, with a large-chunk warning. The separate typecheck log is empty and does not independently establish an exit status.

Production-validation output reports all sampled walkable nodes reachable at both radii: 2059 of 2059 at radius 16 and 1993 of 1993 at radius 28. Its script checks routes, breach offsets and a 20-unit grid using production geometry. These are supplied execution records, not tests rerun by this reviewer.

Vertex containment establishes that models fit inside their collision footprints. It does not prove exact collision-to-surface agreement or projectile-height agreement. The inspected room tests contain no dedicated projectile/mesh comparison.

## Limits

The manifest labels the evidence controlled live simulation. It records staged actors, a completed spawn-to-exit traversal, a short combat step sequence, empty error arrays and no WebGL errors or context loss. It also explicitly excludes the DOM HUD, real touch input, active encounter director and campaign progression. These images therefore do not prove normal HUD visibility, phone-scale recognition or sustained combat usability.

No runtime files, GPU state, publication state or capture evidence were changed. Only this review was written. No judgment is made on final materials, lighting polish or later-stage finish.
