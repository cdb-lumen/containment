# Independent review, Room10 stage4 attempt965

Reviewer: independent read-only Hermes subagent.

Verdict: FAIL for the model iteration as submitted. The dish is more legible and its support is clearer, but its ceramic surface is convex toward the receiver and arena, contrary to the stated concave reflector construction. This is a model defect, not an overall-room, HUD or mobile rejection.

## Findings

- FAIL, dish construction. In `src/render/TransmissionChamberRoom.ts:91-95`, the positive-height lathe profile rotated by negative PI/2 puts the center at world z84 and the rim at z66. The receiver is south of both, near z101. The center therefore bulges toward the receiver rather than receding behind the rim. Positive south-facing normals do not establish concavity. The new test checks material visibility and normal direction, not bowl depth, so it passes this wrong construction.
- PASS, visible assembly improvement. The overview changes a dark, apparently detached oval into a pale reflector with a distinct rim, side bearings and converging receiver braces. The cheek plates visibly connect to the retained crossbeam and grounded legs. No gross floating assembly is apparent in the overview. This is a visual connection judgment, not a mechanical strength or exhaustive watertightness test.
- PASS, feed iteration. The collar bands and dark separators give the central feed a readable assembled edge in the native desktop images. The open center and restrained blue indicator survive. The surrounding waveguides, desk and floor remain visually consistent.
- PASS, unchanged resource limits. The limits remain strictly below 90 meshes and 15000 triangles. Actual use is not unchanged: before is 65 meshes and 6348 triangles, after is 73 meshes and 8692 triangles. Every capture row reports those respective values, and the independent CPU budget assertions pass.
- PASS, bounded source preservation. Git initially showed changes only to the Room10 renderer and its test. The renderer diff changes the dish, receiver supports and feed collar, adding one local material. Existing tests were not weakened. Layout, topology and authored registration hashes match before and after. The retained before renderer equals HEAD. All five after source pins match the current files.

## Checks actually run

From `/home/chernodubv/dev/.cron-worktrees/containment-rooms/transmission-chamber-v3`:

- `npx vitest run src/render/TransmissionChamberRoom.test.ts`: one file, nine tests passed. Coverage includes reviewed routes and anchors, fixture footprint containment, grounding, shell bounds, disposal ownership and unchanged resource ceilings.
- `git diff --check`: passed.
- Independent CPU Three.js rays against the exact authored ceramic lathe profile and transform: radii 0.01, 18, 40, 60 and 72 hit world z83.99944444444445, 83, 79, 73 and 67.75. All normals face positive z. These measurements demonstrate the outward bulge despite the passing normal test. No renderer or GPU was started.
- Verified all eight original PNG hashes against their capture manifests. Each before/after pair has identical recorded camera and player state. Both manifests record no errors or aborted requests. These are retained capture results, not a fresh browser run by this reviewer.

Candidate renderer SHA256: `a5e3e0d0e136845682e440c954e5863cfbcf8e5caa08c97f9bc8bc2ecbdc2c92`.

Candidate test SHA256: `7a5f0ad64027532f28a21bcc2fc02e56759a0f3307defd60c58b2aa8367dbaa5`.

Base HEAD: `676ed44c5ba9c37088f5ba13b5644e3e100d5345`.

## Pixel evidence inspected

All paths below are relative to this review directory. Each original was opened with `vision_analyze`, not judged from filenames or metrics.

| View | Before | After |
| --- | --- | --- |
| Entry | `before/desktop-entry-static.png` | `after/desktop-entry-static.png` |
| North | `before/desktop-north-static.png` | `after/desktop-north-static.png` |
| South | `before/desktop-south-static.png` | `after/desktop-south-static.png` |
| Overview | `before/overview-static.png` | `after/overview-static.png` |

Capture records: `before/capture-result.json` and `after/capture-result.json`. Baseline source: `before/TransmissionChamberRoom.ts`.

## Limits and disposition

These are static staged Chromium captures, not combat or campaign acceptance. The desktop images crop most of the dish above the frame. They establish the feed improvement and some support detail, while the overview supplies the full dish comparison. The overview uses a capture-only fitted camera. HUD overlap and mobile visibility are not art gates. No publication, remote-byte verification, full build, GPU work, runtime edits or commits were performed by this reviewer.

Read `async-rollout-worker-prompt.md`, `map-model-production.md` and `production-guard.md`. Publication and any guarded follow-up belong to the parent. Preserve this failed candidate and its evidence. Correct the bowl depth relative to the arena-facing receiver and add a depth-order assertion before claiming the dish construction passes. This review does not authorize a new attempt or acceptance.
