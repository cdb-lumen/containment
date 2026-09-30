# Room8 stage5 attempt944 technical evidence

Status: capture and focused technical checks passed. Independent overall art review and publication remain with the parent. This is not a final stage verdict or release approval.

## Scope and source

- Branch `art/breached-loading-bay-v3`, HEAD `2502fe91f79f3a8635bca08a09be2a4309f32055`.
- Worktree `/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3`.
- Read the production contract, guard contract, current task, human queue, canonical brief and current `src/game/roguelike/storyRooms.ts`.
- Canonical objective remains `Fight around the sealed breach.` Story remains `Alien growth follows the boarding scar. Hull seal intact.`
- No runtime, art, collision, floor, shared camera or HUD source changed. All 223 pinned tracked source, public asset and configuration files match the pre-capture hashes. HEAD and clean Git status are unchanged. The five canonical workspace input hashes also match.
- Viktor's attempt909 scar acceptance stands. Floor pads remain unchanged and their human question remains open and nonblocking. This report does not cosmetically rejudge either.
- No receipt, routing, guard, repository evidence, commit, publication, merge or deployment was written.

## New PNG evidence

All four originals are 1280 x 900. They are static checkpoint runtime evidence, not gameplay. The capture booted the actual unmodified application, loaded Room8 through Continue and route controls, used the actual Skip story handler, then paused simulation and staged legal player coordinates. Desktop views use the shipping camera and HUD. The overview uses a capture-only camera fit. Its HUD remains visible.

| Original | Staged player | Coverage |
| --- | --- | --- |
| `desktop-entry-static.png` | 240,320 | Western approach, freight staging and upper route into the room |
| `desktop-north-static.png` | 570,150 | Northern loop alongside the sealed scar |
| `desktop-south-static.png` | 590,620 | Southern loop, freight supports, floor pads and east-side approach |
| `overview-static.png` | 1020,360 | Whole-room shell, both routes, freight and east fixture |

The prior attempt909 capture staged 650,650 and used overview offset 0,36,26. These captures use distinct legal positions and an overview offset of 0,48,18 to expose more floor plan and route coverage. They were rendered fresh, not copied or relabeled. SHA256 verification found four unique images, none matching any of the 24 prior distinct story-flow PNG hashes.

I opened and inspected all four native originals. They show the rendered room, not loading, blank or transition states. The overview includes the full room perimeter. The desktop captures deliberately use the ordinary framing, so some perimeter lies outside the viewport. No new obvious floating or clipping defect was identified in this bounded inspection. Independent visual judgment remains pending.

Every row reports the correct room, legal radius16 player placement, high quality, loading false, nonzero draw calls, WebGL error0 and no context loss. Capture reported zero page, console or request errors and zero aborted requests.

## Commands and results

Run from the worktree above. Evidence directory is `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/breached-loading-bay/story-flow-v3/stage-5/attempt-944`.

```sh
EVIDENCE=/home/chernodubv/.hermes/workspaces/containment-art-roadmap/breached-loading-bay/story-flow-v3/stage-5/attempt-944
python3 "$EVIDENCE/prepare.py"
node --check "$EVIDENCE/capture.mjs"
node "$EVIDENCE/capture.mjs" > "$EVIDENCE/capture.log" 2>&1
npx vitest run src/render/Room8Placement.test.ts src/render/Room8Visuals.test.ts src/render/Room8Models.test.ts src/render/AuthoredRooms.test.ts --reporter=verbose > "$EVIDENCE/focused-tests.log" 2>&1
npx tsc --noEmit > "$EVIDENCE/typecheck.log" 2>&1
python3 "$EVIDENCE/verify-evidence.py"
```

All commands exited 0. Vitest passed 26 tests across 4 files, with no failures or errors. TypeScript emitted no diagnostics.

The existing focused tests exercised:

- Both accepted route polylines sampled at intervals no greater than four world units with actor radii16,28,38.
- Runtime navigation reachability for player spawn, exit and breach points.
- `DepthGame.moveCorpse` collision sweeps along both route polylines at all three radii, including endpoint and no-block assertions.
- Outbound pallet blocker occupancy, continuous raised hull seal mesh-ray samples and containment of growth and torn-metal vertices inside the sealed scar.
- Welded growth connectivity, seal-contact perimeter and flank mesh rays.
- Freight support containment and ground contact, east opening clearance, flush finite floor relief, finite model vertices and owned material/resource disposal.
- Room-local material isolation and authored room batching/disposal assertions.

These are focused code-level checks. They are not evidence of live player traversal, projectile behavior in combat or full-campaign survival. No test or acceptance assertion was weakened.

## Cleanup and retained files

The capture closed its owned Chromium and Vite instances. Independent verification found capture PID404650 absent, capture port5173 closed and no owned Chromium, capture or esbuild process remaining. The unrelated Vite PID1074861 on port5193 remains untouched.

Retained evidence includes `prepare.py`, `capture.mjs`, `capture.log`, `capture-result.json`, `source-pins-before.json`, `focused-tests.log`, `typecheck.log`, `verify-evidence.py`, `verification.json`, this report and the four PNG originals. The evidence-local `.vite` cache contains generated dependencies, not production edits.

## Limitations

Chromium software WebGL with hash-verified cached font responses, not native-device or network-delivery evidence. Simulation was paused through an external RAF hold. Player positions were staged rather than reached through inputs. No combat, enemy crowd readability, mobile, HUD acceptance, timing, campaign or release claim. Browser room state `playing` identifies the loaded application state, not continuous gameplay. Historical phone/HUD and shared lifecycle issues remain outside this task.
