# Room14 final evidence supplement

## Verdict

PASS for stage 2 rough placement only. The fresh final evidence resolves the source mismatch recorded in `independent-review.md`. This is not final art acceptance, live gameplay verification, a full verifier pass or release approval.

I inspected both original PNGs in `final-evidence` with the vision tool, independently recomputed source and image hashes, checked the retained final test and build logs, and read the current `tests/unit/ServiceShaftLanding.test.ts`. This supplement follows the earlier review and is not a blind review. I did not rerun the test suite, build or capture.

## Final pixels

The overview still shows the west spine connecting the north and south balcony arms around the shaft. The shaft extension separates the eastern landing from the south arm. The recessed counterweight, paired guides, amber rollers, upper sheaves and foreground X brace form one machinery group inside the shaft. They do not fill the circulation space or read as another equipment-rack row.

I inspected the changed desktop image directly rather than carrying forward the old desktop verdict. The player and three staged enemies remain visible on the north platform, separate from the machinery. The counterweight and its frame remain readable together. The western junction stays small and beside the shaft rim, with a dark socket and cyan detail below it. No rough-placement blocker is visible in either final frame.

The previous limitations remain. A sheave partly covers the local-access sign. Dark rear supports and cable runs merge with the shaft shadow. The junction's disconnected state is not an immediate overview-scale story read. The desktop crops the eastern landing and outer room edges, so the overview supplies the complete arrangement. These frames do not establish readability during a full encounter, lower-deck progression, HUD visibility or touch behavior.

## Pins and retained evidence

Read-only verification found all 89 entries in `source-pins.json` matching the current worktree. The external capture adapter also matches its recorded SHA-256. In particular, `src/render/ServiceShaftLanding.ts` now matches `a00466dcaee40110306db8f12d372a1ec774e3bc6702f9d59ce70dc9efea7003`. The old mismatch is resolved for this fresh capture, not retroactively for the old capture.

Both final originals decode at 1280 by 900. Their recomputed SHA-256 values match `verification.json` and the final manifest:

| Final image | SHA-256 |
| --- | --- |
| `final-evidence/14-service-shaft-landing-overview.png` | `4677c7d1809215b142afdabc09c75fef77579c8829b27df20cb28a36979c56c4` |
| `final-evidence/14-service-shaft-landing-gameplay.png` | `39791d9d10e0b8b9cad454cf68b899269707951b9e29454b529f38c72db4bcc1` |

Decoded overview pixels equal the prior overview exactly. Desktop pixels differ. The final manifest contains the two requested views, each with an empty error list, zero WebGL error and no lost context. Its `pixelReview` fields remain `pending`; this supplement records the independent verdict without altering the manifest.

A read-only replay of the verification script also confirmed that the two changed topology snapshots differ from HEAD only for `service-shaft-landing`. Source hashes, rather than the base HEAD label alone, identify the uncommitted captured runtime.

## Test and build evidence

`tests-verified.log` records 81 passing Vitest files, one skipped file, 765 passing tests and one skipped test. The subsequent Node tests pass, and the Python checks complete with `OK` through the final bundle-runtime checks. `build-verified.log` records successful `tsc --noEmit` and Vite production build. The large-chunk warning remains. These are verified retained results, not a new independent execution.

The focused test retains canonical anchors, radius-based C-route sweeps, legal occupancy checks, pickup collection, fixture containment, floor-ray probes and batching/disposal checks. Its pursuit case moves the marine through the route with actual updates, then holds the marine still until health plus armor decreases. It checks actor occupancy throughout the wait and still requires the brute to reach north of y=540. This tests actual contact rather than requiring a slower brute to arrive on the marine's schedule.

`tests-final.log` retains the earlier y=706.2274916584244 assertion failure. `pursuit-diagnostic.log` demonstrates the brute continuing around the route, but that diagnostic itself failed after reaching the fixture's unsupported defeat transition, `Expected combat phase; received starting-boon`. It is not a passing test. The final test stops at first contact damage and does not establish campaign defeat behavior.

Earlier import, topology, snapshot and capture failures remain in their original logs. The canonical capture's `No live player movement` failure was not erased. The external adapter reverses only the fixture's initial movement northward, away from the shaft, while retaining its assertions. These images remain controlled simulation evidence with staged actors, fixed-step combat and the production renderer. The encounter director is inactive, with no campaign progression, DOM HUD or real touch input.

Only this supplement was written. No runtime, tests, logs, pins, manifests or original images were changed. No GPU job was started.
