# Room16 stage2 corrected-candidate independent review

Verdict: PASS for stage2 rough placement. The prior bounded projectile/model defect is resolved, and the gantry now has a readable physical break. This does not approve finished room art or unrestricted gameplay.

## Evidence and scope

I inspected both revised original 1280 by 900 PNGs, plus an original-pixel crop of the overview gantry:

- `capture/16-swarm-junction-overview.png`, SHA256 `d203dc4bc5fa840454e7548af3d283a645d45685d6ddf971ef26f75e7e41ad74`
- `capture/16-swarm-junction-gameplay.png`, SHA256 `318c4e1ad260b0cb4655aa4af4301377beb261ce14f8a89e8ff9a96e4025233d`

Independent checks verified exactly two unique manifest image rows, both PNG hashes, both dimensions and empty result error arrays. All 92 revised source pins match the checkout. Comparing the old and revised pin maps identifies only `src/render/SwarmJunction.ts` and `src/render/SwarmJunction.test.ts` as changed. I read those files, their runtime correction diff, the original failed review, repair notes and retained regression logs.

These images are controlled simulation with staged actors. The gameplay view uses the production camera and composer; the overview fits the room. They are not ordinary gameplay, campaign progression, DOM HUD, mobile or touch evidence. No HUD or mobile gate was applied. Capture execution records exit 0, unchanged source pins and no surviving owned processes. I did not launch another capture.

## Visual judgment

Both views preserve the distinct northwest, northeast and south roots. Pale transverse bands and broad charcoal plates remain visible against the floor. The raised continuous bed now reads as substantial blocking mass rather than a thin floor overlay. Its height does not hide the central dark cavity, the surrounding metal distributor or the three root directions.

The shorter southern root ends above the staged player. The overview shows the north bypass, broad west/east passage and open southern floor. Thin service extensions remain visible beyond the northwestern and northeastern cut ends and below the south root, indicating the neighboring route directions. The staged actors provide a useful scale reference, not a proof of all encounter conditions.

The far-wall gantry remains subordinate to the central organ. In the overview its right arrow points toward a jagged beam end, followed by a visible gap and a lower stub attached to its downward support. This resolves the earlier intact-beam reading at rough-placement scale. The gameplay image crops the gantry out, so gantry acceptance rests on the overview and source checks, not that frame.

The model still has straight, repetitive plates and broad plain sidewalls. Torn shoulders, organic shaping and material wear remain unfinished. Those are later detailing concerns, not a new stage2 blocker. I found no remaining concrete rough-placement defect in the supplied views.

## Technical correction and independently executed checks

From `/home/chernodubv/dev/.cron-worktrees/containment-rooms/swarm-junction-v3`:

```sh
./node_modules/.bin/vitest run src/render/SwarmJunction.test.ts tests/unit/authoredTopology.test.ts tests/unit/roguelikeRooms.test.ts tests/unit/awakeningTopology.test.ts tests/unit/passengerBlockout.test.ts --maxWorkers=2
```

Result: 5 test files passed, 81 tests passed, exit 0, duration 2.47 seconds. `git diff --check` also passed.

The shot regression compares finite horizontal Three mesh rays with `hasClearExpeditionShot` at height 0.95, at y values 120, 140, 180, 220, 260, 300, 350, 365 and 400, from x300 to x900. It runs before and after calling the actual production `DepthRenderer.prototype.bakeWorld`. The y350 row crosses the same southern root implicated in the original failure; y400 is the clear southern control. All pass. Source confirms the full sealed footprint is extruded to 32 game units, with the highest organ fitting at 44.5 game units, below the tested 44.8 cap.

This resolves the demonstrated fallback-height mismatch. It is not an assertion of visual/query equality at every projectile height, weapon muzzle position or arc. No shared query or combat change was required.

The gantry regression passes a downward no-hit ray at x725/y22 and verifies that the lowered end's bounds intersect its support. Source confirms a real removed span instead of the former dark patch on a continuous beam. The overview independently shows the break and surviving support.

The same focused run verifies exact stage1 XY footprint and anchors, radius16/28 routes and sampled connected space, unchanged other-room template hash, pre/post production-bake occupancy coverage and bounds, batching, exact-room dispatch and repeated owned-resource disposal. Comparing source pins confirms the correction did not alter layout, topology, camera or capture code.

The parent's retained `revised-npm-test.log` reports 81 files passed and 1 skipped, with 769 tests passed and 1 skipped. Its remaining output includes the asset checks. `revised-build.log` records successful TypeScript/Vite build with the chunk-size warning. I inspected these logs but did not independently rerun the broad suite or build.

## Preserved failure and limits

The original `../independent-review.md` remains FAIL for its original source and PNGs. `../review-repair-red.log` retains both reproduced failures: an empty fallback-height mesh ray despite blocked production shot, and a hit through the proposed gantry gap. The earlier height-contract failure also remains historical evidence. This corrected-source verdict does not rewrite those results.

No runtime or test edits, GPU job, commit, publication, receipt or PR operation was performed. The only review deliverable created is this file. A helper `execute_code` request was blocked by cron policy; normal read tools and terminal checks completed the review without changing that policy.
