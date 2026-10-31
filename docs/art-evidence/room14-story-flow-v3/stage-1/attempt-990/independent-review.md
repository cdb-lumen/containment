# Independent Room14 stage1 review

## Verdict

PASS for the diagram layout only, with minor presentation and evidence-packaging defects below. This is not gameplay, camera, final-art or human acceptance. No implementation, merge or deployment approval follows from this review.

I inspected the actual `layout-draft.png`, both the full image and a native-resolution plan crop. I read `layout.json`, the initial and corrected verifier scripts, both validation JSON files, `make_layout.py`, `brief.md` and `technical-report.md`. Canonical references were `rollout-sources/room14-brief.json` and the Room14 entry in `rollout-sources/storyRooms.ts`.

## Layout findings

- The exposed shaft reads as non-floor. The polygon reaches the east boundary and prevents an apparent shortcut from the exit landing to the south arm. The west spine connects both arms without a jump gap.
- Entry and exit remain at 100/440 and 1100/440. The four breach anchors and their inward offsets remain on floor. Amber progression crosses the north arm. The south service arm returns through the west junction rather than becoming a second objective.
- The guide, rollers and counterweight occupy the shaft, not the movement corridor. This is a schematic reservation, not evidence of depth or visibility through a shipping camera.
- The inset clearly separates the original three rectangular solids from the proposed shaft. The proposal does not pretend that production already has this topology.
- The objective and story match the canonical source. The AI loss is below the landing. No new reconnect, lift-use, jump or overload mechanic is implied.

## Exact non-blocking defects

1. Cyan is not visibly continuous along the full declared C-route. `make_layout.py` draws cyan first, then draws amber over the shared west-to-north-to-exit segments. Cyan is visible on the south arm and lower west spine, then disappears at the entry junction. The shared route is still unambiguous in the combined diagram and JSON, but the legend's "Cyan: full C service return" overstates what the pixels show. Offset the shared cyan line or label those segments as shared.
2. `brief.md` lists `source-pins.json`, but that file was absent at inspection. The review independently verified source HEAD `798753f86523611501493ff2a1a2ad4f2d8a1a7e` and a clean worktree. Add the promised pins before describing the artifact package as complete.

No blocking diagram geometry defect was found.

## Initial failures and predicate audit

The initial JSON contains 116 passes and seven failures, all baseline checks. Five failures concern the proposed `local_control` approach at 280/405 being tested against baseline solids. Removing proposal-only activity centers from baseline scope is valid. Every activity center remains checked against the proposal.

The other failures were baseline lattice connectivity at radii 28 and 30. Production occupancy uses circle-to-rectangle distance, while traversal uses a rectangle expanded by radius. The corrected checker requires both occupancy and a zero-length sweep before including a graph node. It retains the excluded coordinates in `occupancyOnly`, seven at radius28 and 42 at radius30.

This narrows the baseline claim. It does not repair the real occupancy-versus-sweep discrepancy, and must not be cited as proof that every occupancy-legal baseline point supports movement. For this proposal it waives no observed failure. There are zero excluded proposal nodes at every tested radius. Proposal node totals remain 1650, 1531 and 1528, exactly as in the initial run. Route sweeps, void rejection, activity anchors and navigation checks were not removed or weakened.

## Independent CPU verification

No explicit author-freeze acknowledgement was available, so I did not execute the original file in its writing mode. I ran its complete assertions through `tsx -e` using an in-memory copy. Only the artifact directory expression, output handling and console summary changed. The JSON write became a deep equality assertion against the retained `validation.json`. TSX cache was disabled. No retained artifact or runtime file was rewritten.

The first wrapper attempt stopped at its own safety assertion before launching TSX because the output-write replacement did not match. A line-based replacement fixed the wrapper. The completed run exited zero with 123 passes, zero failures and 45 navigation trips. The complete generated output exactly matched the retained validation JSON. SHA-256 checks of the PNG, layout JSON, verifier and validation JSON were unchanged across the run.

Reviewed SHA-256 pins:

```text
layout-draft.png  7b23b59f4b7eef537faee60b5b6366442f9780c8a186ebd035c64fff553bbdd3
layout.json       4695d5ddde0b5940f66058babb2fc398023e0f98f0a727f86f5b1d00fa876317
validate-layout.ts 54eabf3a5db1dfca607bc789fcb40e51f6c477a66dd95fc027ada53e02b2276b
validation.json   92dfc9ac03600a50d840067870373ab987f3267b3fc8d644f7a3eeb428b07dc0
```

## Technical limits

- The connectivity test uses a 20-unit lattice and selected exact anchors. It does not prove every continuous floor coordinate is connected.
- Navigation trips simulate isolated radius28 pursuit with swept steps. They do not test crowded enemies, dropped pickups, attacks or live player movement.
- Fixture containment samples rectangle interiors every two units. It does not prove all future meshes, curb strokes, rails or overhangs match collision. The schematic vertical guide lines extend beyond the reserved guide rectangle, though they still remain visibly inside the shaft.
- The candidate is an in-memory geometry overlay, not installed room topology. Generic boss-center metadata remains inside the shaft. Integration must audit consumers rather than infer supported boss placement.
- Shipping-camera near and far edges, below-deck detail visibility, lighting, native controls and full-C combat traversal remain unverified. These are later canonical acceptance requirements, not stage1 passes.

Only this review file was created by the reviewer. No GPU job, browser job, repository edit or runtime modification was performed.
