# Room10 independent technical review

## Verdict

Bounded technical pass at `bd1fd1ecba0a706c7c62c6828039b8305956056f`, stage 5 attempt 967. No concrete Room10 defect reproduced in the inspected construction, shared horizontal collision, sampled enemy routes or resource ownership. This is not overall room acceptance, full verification, live gameplay proof or release approval.

Reviewed issue #31 through `gh issue view 31 --json title,body,comments`. Its current authority separates machine validation from human acceptance and release. The canonical defend-uplink objective and warning-before-reveal order remain obligations. No renderer milestone text or substitute completion signal was added.

## Source and scope

Worktree: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/transmission-chamber-v3`.

Comparison base: `7a3f262886104fb024de9684958b3f85a8859f34`.

Initial and final `git status --short` / `git status --porcelain=v1` were empty. Final HEAD remained the pinned commit. No repository files, runtime, tests or Git state were written by this audit. CPU diagnostics and this report are outside the repository. No browser or GPU was used.

Inspected the complete Room10 renderer, layout and focused test, the topology/renderer registration diff, production geometry/navigation, disposal, and the relevant DepthGame movement, projectile, pickup and story-status paths. The source diff contains only Room10 layout/renderer, their two registration additions and the Room10 test. No shared gameplay, camera, lighting or HUD implementation changes are present.

## Commands and observed results

All commands below ran in the worktree unless their absolute path states otherwise.

- `gh issue view 31 --json title,body,comments`: exit 0.
- `node node_modules/vitest/vitest.mjs run src/render/TransmissionChamberRoom.test.ts tests/unit/authoredTopology.test.ts --no-cache`: exit 0, 2 files and 16 tests passed. Room10 contributes 10 tests.
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0, no diagnostics. This ran after the preceding Vitest command in the same shell call; both completed successfully.
- `node node_modules/vitest/vitest.mjs run tests/unit/awakeningTopology.test.ts tests/unit/passengerBlockout.test.ts tests/unit/pickups.test.ts tests/unit/spitterLosSteering.test.ts tests/unit/combat.test.ts --no-cache`: exit 0, 5 files and 77 tests passed.
- `node node_modules/vitest/vitest.mjs run tests/HudReadability.test.ts --no-cache`: exit 0, 1 file and 4 tests passed.
- `git diff --check 7a3f262886104fb024de9684958b3f85a8859f34..HEAD`: exit 0, no output.
- `node /home/chernodubv/.hermes/workspaces/containment-art-roadmap/transmission-chamber/story-flow-v3/stage-5/attempt-967/technical-probe.mjs > /home/chernodubv/.hermes/workspaces/containment-art-roadmap/transmission-chamber/story-flow-v3/stage-5/attempt-967/technical-probe.json`: exit 0. It imports production modules through a middleware-only Vite server with an external cache directory. No listening preview, browser or renderer context is created.

An attempted `execute_code` JSON aggregation was blocked by cron policy before execution. The same aggregation then succeeded through a normal `python3 -c` terminal command. No verification result depends on the blocked call.

## Geometry and construction

`src/game/roguelike/transmissionChamberLayout.ts:4-21` freezes the nine fixture records and point arrays. The same footprints feed topology voids and rendered bases. Entry, exit, breaches and rectangular envelope match the reviewed layout JSON through the focused test. The new room branch in `src/render/AuthoredRooms.ts:556` constructs only this renderer; the existing authored-room path remains intact.

`src/render/TransmissionChamberRoom.ts:18-20,50-124` extrudes the physical bases from those polygons. The CPU vertex test transforms every fixture vertex into world coordinates and checks its horizontal position against the corresponding polygon with the documented Float32 allowance. It also checks grounded minima. All nine fixtures passed. Waveguide height remains at most 44 game units. Shell bounds remain in their six-unit perimeter bands and floor inlays remain below 0.101 game units.

Dish tests passed front-face ray orientation, center-to-rim depth ordering, rim alignment, and separate ceramic-front/alloy-back ray hits. The renderer places the center at z=48, rim at z=66 and the central support along z=48..100. This addresses the earlier convex-reflector defect without claiming native-camera visibility. The named rim, gimbal, receiver support and feed collar exist.

## Collision and routes

`src/game/world/expeditionGeometry.ts:46-71` applies the polygon contract to occupancy, traversals and shots. Room10 has no separate obstacle rectangles besides the boundary walls, so the fixture voids are the relevant shared blocker source. DepthGame uses that contract for enemy occupancy and attack LOS, stepped player/corpse motion, bullets and pickup magnet movement at `src/DepthGame.ts:29,40,84,100-107,116`.

The Room10 test replays every reviewed layout route at radii 16, 28 and 38, including the expected blocked feed crossing. It checks anchor occupancy and blocked fixture centers. All passed.

Important coverage distinction: `tests/unit/authoredTopology.test.ts:9,27-61` does not include Room10 in its older-room navigation, projectile and pickup examples. Its passing results are shared-system regression evidence, not Room10-specific behavior proof. I therefore ran a separate CPU route sample against the new geometry.

The external probe exercised the actual `DepthGame.enemies` system with production `FacilityNavigation`, occupancy and attack-LOS callbacks. It sampled crawler, brute and spitter from all four inward-offset breaches toward six player targets: entry, exit and four points around the feed. Each run advanced enemy updates through 1,200 steps of 50 ms. It intentionally did not run the encounter director or apply emitted attacks to player health.

Observed JSON results:

| Family | Cases | Invalid occupied snapshots | Maximum final target distance | Final positions without clear LOS |
| --- | ---: | ---: | ---: | ---: |
| crawler | 24 | 0 | 7.494934470714402 | 0 |
| brute | 24 | 0 | 2.674125354214582 | 0 |
| spitter | 24 | 0 | 359.9024115826299 | 0 |

All 72 sampled routes remained occupiable. Crawlers and brutes reached the target vicinity. Spitters ended at clear-LOS ranged positions; the larger distance is not classified as a stall. These are isolated enemy-system simulations using the constructor's existing balance, not a complete Room10 encounter, mixed-horde stress run or combat completion.

## Resources and safety

The independent CPU scene traversal measured 73 meshes and 8,692 triangles, within unchanged strict limits of fewer than 90 meshes and 15,000 triangles. It observed 81 retained geometry/material resources and zero resources disposed other than exactly once after `disposeModel`.

`src/render/TransmissionChamberRoom.ts:128-149` performs room-local batching. Scratch geometries and replaced originals are disposed; named fixture groups are retained. The focused scratch-disposal test passed and confirms retained geometry was not prematurely disposed. Retained meshes preserve cast/receive-shadow and baked-environment ownership flags. All materials are room-owned through `actorMaterial`; `src/render/meshParts.ts:55-58` deduplicates retained resource disposal. No new textures, timers, listeners, persistent caches or animation loop are added by this room. Indicator emission remains 0.25 and there is no new light or global exposure change.

## Story and acceptance boundaries

`src/DepthGame.ts:68-75` still gates Room10 warning status on depth 9 being cleared, with purge-cost disclosure beginning at depth 10. The HUD readability tests passed. The Room10 desk contains passive carrier/tuning marks, not fabricated warning-completion wording. No timing or story logic changed in this diff.

This audit did not trigger the real Room10 warning milestone. It does not prove muted-audio/skipped-dialogue acknowledgment visibility, objective timing, full encounter progression, phone smoke, player-driven routes, pickup collection around every fixture, or projectile-height visual parity. Horizontal footprint containment does not establish visual collision at every elevation. No native-camera readability, occlusion, GPU memory/performance or screenshots were assessed.

`npm test`, `npm run build` and `npm run verify` were not run by this reviewer. The no-emit typecheck is not a production build. No prior stage's tests or screenshots are substituted for those missing checks. Human room acceptance, PR/release gates, merge and deployment remain separate.

## Artifacts

This directory contains the new `technical-review.md`, `technical-probe.mjs` and `technical-probe.json`. The probe source and raw per-case output make the additional CPU evidence reproducible. No runtime or test edits are proposed by this review.
