# Room12 attempt1003 independent review

## Verdict

Failed against the second revision requirements for the retained images inspected in this review. The open AI service door does not read as an opened panel at the unchanged production camera. The equipment gains useful housing depth, but deliberate disabling remains ambiguous. Current source also differs from the preserved source associated with these pixels. Passing CPU tests cannot resolve either problem.

This is a bounded independent review, not human acceptance, release approval or live gameplay verification. No GPU, browser capture, runtime source edit, acceptance, merge or guard command was performed by this reviewer.

## Evidence inspected

All four original PNGs were opened through vision:

- `before/12-safety-interlock-station-desktop-static.png`
- `before/12-safety-interlock-station-overview.png`
- `after/12-safety-interlock-station-desktop-static.png`
- `after/12-safety-interlock-station-overview.png`

The AI assembly in the after desktop image was also inspected as a native crop. That crop is inspection of existing pixels, not new camera evidence.

Both manifests contained two unique view rows. All four PNG hashes matched their manifest entries when checked. Before images were independently confirmed byte-identical to the corresponding attempt999 capture PNGs. Before and after camera records matched exactly within each view. The desktop view uses production framing. The overview uses a fitted camera and cannot stand in for production framing. Both are static staged production-renderer evidence without DOM HUD or real input. The harness explicitly stages the player at 600,440 and does not record live combat.

At inspection, both after PNGs were byte-identical to `first-pixel-review` PNGs. This matters because implementation continued during review. A `.room-evidence-mJnrjG/` directory appeared in the final repository status check. Later replacement images require another review and do not change this verdict retroactively.

## Visual findings

1. **Opened service panel: failed.** In the after desktop PNG, the AI assembly at upper right still reads as an exposed board inside a rectangular tray. The purported door is a narrow dark strip behind the upper rim, with tiny hinge-like protrusions. There is no clearly separated broad panel face, readable open-door silhouette or obvious hinge-to-door relationship. The overview makes this cue smaller still. Exposed circuitry was already present before this revision, so it does not demonstrate the requested new intervention.

2. **Obvious pulled AI connection: failed for the requested clarity.** Two dark circular sockets and a separate rectangular connector are visible at the AI assembly's front. That is a useful isolation cue, and it belongs to the AI equipment rather than the recorder. However, the lead in the inspected pixels is dark and closely follows the right chassis edge. The connector can read as another mounted control. Its exposed pins and continuous pulled-cable route are not obvious at normal view size. The crop helps identify a small separation but does not make deliberate disconnection obvious in the full scene.

3. **Layered housings and recesses: meaningful improvement, partial pass.** Copper side rails, darker socket recess with front lips, recorder corner guards, lower contactor cradles and a battery guard add physical depth and protection. These changes are more substantial than bolts or labels. The AI recess and lower guards are visible in the matched pair. The unreadable door still prevents full functional assembly readability.

4. **Local wear: partial, insufficient visual communication.** Small pale marks are confined to the front access lip, plug grip and recorder control. There is no uniform grime treatment. At normal size, these marks mostly resemble small clean rectangular fittings rather than wear from servicing. Source names establish placement intent, not a convincing worn finish.

5. **Sealed recorder focal point: pass for the inspected static composition.** The pale recorder at upper left is the strongest equipment focal point against darker supporting assemblies. Its reel window and broad enclosure remain intact. The new framing does not suggest a broken or opened recorder. A staged enemy overlaps its lower-right edge, but the enclosure and reel identity remain readable. No HUD occlusion or live combat conclusion follows from this view.

## Source fidelity and test review

Repository HEAD was `290ff5cd25ad77b0229b565e184650f399866147`, the requested baseline. Tracked changes were confined to `src/render/SafetyInterlockBlockout.ts` and `tests/SafetyInterlockServiceCorrection.test.ts`, with new `tests/SafetyInterlockSecondRevision.test.ts`. No tracked camera, lighting, HUD, shared engine, room topology or story edit appeared in the inspected diff.

The four canonical source snapshots in workspace `rollout-sources` matched every SHA-256 in `second-revision/request.json`. Their stage0 source copies matched as well. This verifies preserved source bytes, not live story presentation.

Current renderer source SHA-256 at the repeated check was `528f6fee31609823fc6f5fc9bb926cce0fdfb884f0e38aa6899990b3f174fbe7`.

It was not byte-identical to `first-pixel-review/SafetyInterlockBlockout.ts`. Differences are directly relevant to the failed requirements: the current door has a different position, opposite tilt, changed panel depth and revised stays; the plug is larger; the disconnected lead is thicker and orange instead of dark; the grip has moved. The inspected after pixels were still identical to first-pixel-review images. Therefore those images do not establish visual success of the current source. Both manifests report baseline HEAD, which is not a pin of dirty renderer bytes.

The new tests check a broad tilted door, hinge bounding-box intersection, board separation, endpoint containment, a socket gap and named protective parts. These are useful CPU geometry checks. Bounding-box intersection of a support with the whole curved lead does not prove actual local support contact. Object presence and world-space door height do not prove screen-space readability. No new test establishes that viewers can recognize the opened door or deliberate disconnection.

The existing service-correction test was relaxed from exact island heights to a range greater than 1.6 and below 2.5. Exact x/z footprint checks remain. A height change is expected for a raised door, but this broader test is not equivalent to preserving exact previous geometry. The preserved `focused-initial.log` contains the original height failure and must remain part of the record.

## Tests executed independently

Command run in the source repository:

```text
npx vitest run tests/SafetyInterlockBlockout.test.ts tests/SafetyInterlockArchitecture.test.ts tests/SafetyInterlockRedesign.test.ts tests/SafetyInterlockServiceCorrection.test.ts tests/SafetyInterlockSecondRevision.test.ts
```

Actual result: 5 test files passed, 35 tests passed, exit code 0. Runtime reported 2.16 seconds. These CPU tests exercised the current working tree, not the older preserved pixel source.

Additional read-only Python checks verified PNG hashes, pair camera records, exact before-image equality with attempt999, first-review/after image equality, canonical snapshot hashes and current source hash. Git status and source/test diffs were inspected.

Existing build, focused-test, evidence-test and overall-probe logs were inspected but not rerun. The build log reports success with a bundle-size warning. The evidence-test log reports 22 passing tests and a separate 33-check CPU result. The overall probe describes CPU route and occupancy checks, not browser gameplay. These supplied results do not override the visual failure or prove fidelity of later source changes.

## Required before a passing review

Make the opened AI panel visibly separate from its housing through the unchanged production camera. Make the loose connector, exposed termination, isolation gap and attached cable route read as one disabled AI connection. Preserve the pale sealed recorder and the useful housing additions. Capture and pin the exact revised source, then obtain a fresh independent pixel review. Keep this failure and its original images available even if the implementation agent replaces the after directory.
