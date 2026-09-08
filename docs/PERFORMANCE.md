# Performance pass — September 6, 2026

## Findings and changes

The earlier pass removed CPU corpse baking, but live boon events still validated the entire event ledger and copied its arrays on every shot/hit. Work grew with encounter length. A live resolver now keeps the same deduplication, depth, per-chain and encounter limits using Set/Map lookups. Its effect-command generator is shared with the original pure reducer; differential tests check that both produce identical commands and state across mixed combat events. Checkpoint and public reducer input validation remain intact.

SkeletonUtils cloned a distinct 122-bone skeleton for each of the marine's 22 mesh parts. Equivalent skeletons now share one skeleton within each actor; materials likewise share four actor-local copies. Different actors retain independent bones/materials. Marine aim/socket calculations update only the required ancestor paths rather than repeatedly forcing the entire rig hierarchy. Disposal releases shared actor resources once.

Enemy rigs and materials now return to a bounded pool after corpses clear or rooms change. Loading prepares two normal rigs and one elite for each standard species, plus the queen. Common animation actions, all five weapon poses, textures, screen-output shader variants with/without shadows, and initial GPU buffers are prepared before the title becomes interactive. Shader preparation uses the actual screen output configuration: compiling only an offscreen target would prepare different color/tone-mapping variants. New pool misses may still construct a rig; no claim that every spawn is allocation-free. Pools retain at most four idle rigs per species/elite key.

Reverse navigation reuses its queue, adjacency and expanded obstacle rectangles. Slab collision queries no longer allocate nested arrays per segment. Settled corpses stop doing collision movement checks.

## Graphics workload

- Presentation targets 60 Hz on 60/120/144 Hz displays. Elapsed time is retained; missed frames do not create a backlog of catch-up renders.
- High is the default on desktop and touch, with bloom, shadows and DPR up to 1.5.
- Low is manually selected, caps DPR at 1 and disables shadows/postprocessing.
- Automatic quality and frame-budget downgrades have been removed. WebGL recovery reapplies the selected quality. Reloading starts at High.
- Hidden tabs stop rendering. WebGL loss handling remains in place.

## CPU measurements

Measured in the same Node test environment using production model geometry/animations with textures removed for Node loading. Values below are milliseconds per operation, medians. These are CPU microbenchmarks, not browser FPS or GPU timings.

| Operation | Before | After |
|---|---:|---:|
| Late-encounter boon event (events 1900–1999) | 0.828 | 0.005 |
| New enemy rig + first animation | 2.385 | 2.064 |
| Reused prepared enemy rig + first animation | — | 0.029 |
| Marine + 18 enemies: animation, matrices and skeleton updates | 1.790 | 1.396 |
| Navigation goal change | 0.370 | 0.143 |
| Marine skeleton instances | 22 | 1 |

The late-event median fell approximately 99.4%. Reusing a prepared rig cost approximately 98.8% less than constructing one in the baseline. Neither percentage is an overall game speedup. Raw p95/max data are retained in `performance/before.json` and `performance/after.json`; some post-change maxima are higher because these short, shared-host runs include scheduling/GC noise. They do not prove elimination of worst-case frame gaps.

Reproduce the CPU report from the project directory:

```sh
PROFILE_GAME=profile.json npm test -- tests/performance-profile.test.ts
```

## Verification and diagnostics

Regression coverage checks pure/live event equivalence, history isolation and safety limits, skeleton independence, single resource disposal, pooled corpse revival, 60/120/144 Hz pacing, and manual High/Low quality selection and recovery. Existing combat, all 48 boons, collision, navigation, weapon alignment, health-bar and checkpoint tests remain part of the full suite.

For future device diagnosis, `window.__containmentPerformance` returns a local snapshot on demand: recent frame times, update CPU times, render-submission CPU times, frames over 50 ms, effective quality, all-pass draw calls/triangles, geometry/texture counts and context-loss state. A fixed 120-sample ring records numbers; it does not write logs, send telemetry or add gameplay UI. Render-submission timing is not GPU execution timing.

No physical MacBook, Safari, or browser performance trace was available in this pass. Browser testing was not performed. First-time room construction, audio decode, driver behavior and device-specific GPU limits can still produce pauses; the changes target reproduced CPU scaling defects and identified rendering costs.
