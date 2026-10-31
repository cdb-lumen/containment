# Room13 overall attempt988 technical report

Technical checks passed on unchanged source. Fresh final overview and desktop PNGs are ready for independent and parent visual review. This is not an overall art verdict, human acceptance or release approval.

## Source and scope

- Worktree: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3`
- Branch: `art/coolant-plant-v3`
- HEAD: `bf052d56a44a86852faa0d593f50c835bd188fc0`
- Local origin/main reference: `7a3f262886104fb024de9684958b3f85a8859f34`
- Local graph check: 0 behind, 8 ahead. No fresh fetch was performed by this subagent. Parent supplied fresh-base and permit checks.

`source-pin.json` records the exact tree, timestamp and SHA256 for 337 tracked runtime, harness, asset, test and configuration files. `source-verification.json` records unchanged HEAD, zero mismatches, clean git status and no remaining temporary harness directories. The final verification rechecked all 337 hashes and clean status.

Read the worker prompt, production policy, guard documentation and room routing. No runtime or test source changes were made. Reused attempt986 `validate.py` unchanged, with destinations derived from its new directory. Reused `verify-evidence.py` with its comparison target changed to repaired stage4 attempt987. Only attempt988 evidence and local scripts were written. No publication, receipt, guard call, guard edit, commit, push, merge, deployment or shared-service change occurred.

## Commands and results

`commands.json` contains exact argv, cwd, exit codes, elapsed times and log paths. All commands below ran in the worktree above.

| Command | Result |
| --- | --- |
| `npx vitest run tests/CoolantPlantBlockout.test.ts tests/ShipEnvironments.test.ts tests/StoryRoute.test.ts tests/unit/expeditionGeometry.test.ts tests/unit/authoredTopology.test.ts tests/SafeRoomLoading.test.ts` | Exit 0. Six files, 58 tests passed. |
| `npm test` | Exit 0. 772 Vitest tests passed, one skipped. Two Node tests passed. All invoked Python asset suites reported OK. |
| `npm run build` | Exit 0. TypeScript and Vite passed. Existing main-bundle size warning remains. |
| `npm run test:room-evidence` | Exit 0. 22 Node tests passed. Ragdoll CPU self-test passed 33 checks. |
| `git diff --check` | Exit 0. |
| `node scripts/room-evidence.mjs --rooms=coolant-plant --gameplay-all --verify-all --viewport=desktop --quality=high --out=/home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-5/attempt-988/capture` | Exit 0. Two fresh PNGs. |
| `python3 /home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-5/attempt-988/verify-evidence.py` | Exit 0. PNG decode, dimensions, hashes and prior-stage comparison passed. |

Orchestration commands were `python3 /home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-5/attempt-988/validate.py` and `python3 /home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-5/attempt-988/finalize-technical.py`. Both exited 0. The latter reran and logged image verification, added prior-overall comparisons and rechecked source cleanliness.

No executed test or capture failed. Full `npm run verify`, built-app smoke, mobile capture, live campaign playthrough and continuous combat recording were not run. Unrelated release dependencies remain outside this task.

## Fresh image manifest

Both images decoded at 1280x900. Flat final files are byte-for-byte copies of this run's capture output.

| File | SHA256 | Bytes |
| --- | --- | --- |
| `final-overview.png` | `a7078d4475eeb15be8850964a4b2a122a1e1535bc578675f52542769cbfd9874` | 472460 |
| `final-desktop.png` | `68f545047c9e714e3598730e05188da5fad8dba1fb0c12d532006f4a97e491f4` | 880167 |

Originals are `capture/13-coolant-plant-overview.png` and `capture/13-coolant-plant-gameplay.png`. Raw records are `capture/manifest.json` and `capture/inventory.json`. `image-manifest.json` includes source HEAD, decoded sizes, hashes, metrics, errors and exact prior-attempt comparisons.

Both images differ from overall attempt986. The freshly rendered overview is byte-identical to stage4 attempt987 overview, so it is not novel relative to that repair. The desktop differs from both previous attempts.

These are controlled simulation images, not live gameplay. The harness stages legal actors, verifies a spawn-to-exit route through production updates and performs fixed-step production combat. Encounter director is inactive. There is no boss, campaign progression, DOM HUD or real input test. Overview uses a fitted camera. Desktop retains production camera and high-quality composition.

Both captures verified 328 legal traversal checks with exitDistance 0. Desktop recorded 25 fixed steps, four shots, damage 48, 100 legal checks and three active enemies. Overview recorded 66 draw calls and 97855 triangles. Desktop recorded 69 draw calls and 97723 triangles. Both report zero browser errors, WebGL error 0 and no context loss. Raw duplicate-module abort URLs are retained in the manifests, subject to the unchanged harness rule requiring the exact URL also to have completed.

## Physical checks and pixel inspection

Read the current coolant builder and its focused tests. Passing checks cover all five retained collision footprints before and after batching, assembly floor bounds and height limits, six flush service paths, radius16 and radius28 circuits, both saddle bypasses, required exit routes, shot blockage, exact room registration and material batching. The repair regression checks pump-facing orientation, extruded strainer housing and cut rim. These checks do not certify every pipe-to-shell connection or every detail's support. Name-presence assertions are not hydraulic-continuity tests. Below-deck pipes remain represented by flat covers, and the strainer is an intentional open cutaway.

Inspected both final PNGs from disk. They show valid room renders, not browser error overlays. Both lower pump faces show curved housings, with motors behind them and open strainers beside the suction bends. The four skids and central life-support saddle remain legible. No obvious floating main assembly or main-model clipping is visible in these two views. Small connection details still need independent art judgment. The overview includes the exit and full outer routes. The desktop crops the exit and some room edges. The northern wall pipe projects beyond the right end of its backing panels in the overview, unchanged from the prior shell. This is a visual observation, not a demonstrated collision failure.

## Cleanup

The capture harness closed its browser and server and removed its temporary `.room-evidence-*` directory. `logs/processes-after.log` and `logs/ports-after.log` show no remaining Chromium or room-evidence process. The unrelated containment-boons Vite process on port5193 was already present and remains untouched. Build output remains in ignored `dist`. The worktree remains clean at the pinned HEAD.

Independent overall visual review, parent verdict and any authorized publication remain with the parent agent. No acceptance or budget state was changed.
