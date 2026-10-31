# Room17 stage 4 independent review

Verdict: PASS for the bounded model-iteration stage of attempt 1019. This is not overall room approval, human acceptance or release approval. Stage 5 still needs its own permit and overall validation.

## Visual judgment

I inspected the original before and after gameplay PNGs, the original before and after overview PNGs, and model-contact-sheet.png with vision. All four originals are 1280 by 900. The contact sheet uses enlarged gameplay crops, not another camera. I judged desktop readability from the originals rather than granting credit for enlargement.

The west and east gate heads now read as machinery attached to the shielding banks. The ochre handwheels are recognizable in the native gameplay image. Their location over the gear housings, the exposed portion of the transverse screw, and the raised locking assemblies give the heads a mechanical purpose absent from the flatter before version. The locking bridges have visible legs down to the leaf assemblies. The instrument trays now have visible dark wells and pale frames instead of being buried low on the faces. These are visible changes to important assemblies, not detail that exists only in source.

The overview retains the same banks, central opening, backing cover and room arrangement. It also retains enough wheel and lock silhouette to distinguish the two gate heads from the long shielding masses. I see no new obvious floating assembly or intrusion into the open threshold in these views. That observation is bounded to the captured angles.

The stage passes because the connected gate heads have become recognizable mechanical assemblies at the supplied production gameplay camera scale. It does not require every part to identify its exact engineering function without context.

## Remaining defects

- The raised locks and trays obscure part of each screw. The after image communicates a machine head better, but shows less of the shaft than the before image. The traveling nut and clevis connection is much clearer in source than in the native pixels. Do not claim a fully readable screw-to-leaf force path.
- The long, repeated rectangular shielding banks still dominate the room silhouette. This iteration improves their heads rather than resolving the broader bank-heavy composition. Overall validation should judge whether that hierarchy communicates the room's shielding-gate story.
- The dosimeter wells read as small instrument trays or control plates. Their exact dosimeter identity and scale marks are not independently legible at native gameplay size. The contact-sheet caption supplies that identity.
- The raised wedge reads mainly as an ochre plate between cheeks. Its taper and open-channel construction are easier to see in the enlarged sheet than in gameplay. This remains a simplification, not a claim of mechanically complete gate operation.

These limitations do not erase the visible model-iteration improvement. They must remain explicit in the next review rather than be converted into claims of final room quality.

## Source and collision checks

The current HEAD is f863baf62548c5484947b00474c24b509b9c5eb7. I read the complete changed model and test files and the source diff. Git reports only these dirty tracked files:

- src/render/ShieldingGateBlockout.ts
- tests/ShieldingGateBlockout.test.ts

The stored tracked-source.patch exactly matches the current git diff. Both source snapshots exactly match the current dirty files. I independently hashed all 264 entries in source-pins.json against the worktree and found no mismatches. The baseline runtime pins also match HEAD. The runtime pin map does not include the top-level tests directory, so I verified the changed test separately against its snapshot.

Current model SHA-256: 94259268ba3404dac9804dce30fb3221909090559bfa64579c3be78392b02a35

Current test SHA-256: 170ccb7cddf206557c9530adeaa1496ba3d5299346b32ac9e0d3025663781c04

The change adds local model geometry and a focused test. It does not modify canonical obstacle data, collision queries, room registration, shared materials, camera, lighting, HUD, navigation or other rooms. Canonical collision remains unchanged. The existing containment-annulus model-path assertion remains in place.

I reran this CPU-only command in the specified worktree:

```text
./node_modules/.bin/vitest run tests/ShieldingGateBlockout.test.ts tests/ShipEnvironments.test.ts tests/unit/expeditionGeometry.test.ts
```

Result: exit 0, 3 test files passed, 36 tests passed. The focused model tests check footprint containment before and after batching, gate-reservation bounds, nonnegative height, room-local materials and the unaffected neighboring room path. The new test checks shaft/nut and clevis/nut bounding-box contact, raised lock dimensions, tray exposure dimensions and wheel presence.

Those tests establish bounded geometry contracts, not visual recognition or a working articulated mechanism. Bounding-box contact alone is not an exact surface-contact proof. Unchanged collision plus contained geometry does not establish a complete render-to-projectile correspondence at every height.

## Evidence integrity and limits

I independently verified the hashes of all four originals and the contact sheet. The before and after manifests match on camera, player, enemies and combat for both overview and gameplay. Both candidate rows record empty browser-error arrays, WebGL error 0 and no context loss. These are retained capture results, not a new browser run by this reviewer.

The capture is labeled controlled-live-simulation. It uses legal staged actors, fixed-step production combat and the production renderer. The encounter director is inactive, there is no boss or campaign progression, and no DOM HUD or real touch input. The overview fits the room. The gameplay image retains production camera/composition. The absence of HUD and mobile evidence is not a stage-4 art failure under map-model-production.md.

I read checks.json and the retained test, build and layout log summaries. They record successful builder checks. The build log retains a large-chunk warning. I did not rerun the full suite, build, layout script, capture or any GPU job. My fresh execution claim is limited to the focused 36-test run and the independent source/evidence integrity checks above. This review does not establish live traversal, performance, all-angle clipping clearance or full campaign behavior.

The only deliverable written by this reviewer is this external review file. I did not modify runtime source, receipt or guard state, commit, publish, or record human acceptance.
