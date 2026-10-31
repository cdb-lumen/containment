# Room12 layout draft

Stage 1, attempt 974. Author drawing only. No runtime edits, detailed models, commit or publication. Independent and parent review remain separate.

## Source decision

The retained room is a 1200 by 880 rectangle with three rectangular obstacles, spawn 100,440, exit 1100,440 and four breach anchors. `storyRoomTemplates.ts` lines 18 and 29-35 define these values. `authoredRoomTopologies.ts` contains no safety-interlock-station override. `expeditionGeometry.ts` lines 24-40 establish bounds and exterior perimeter walls. The older brief's "offset double chamber" is an intention, not present geometry. This draft does not invent that boundary or change the existing reservations.

`source-hashes.json` retains the canonical rollout manifest checks, stage0 brief hash comparison, current worktree source hashes and font hashes. The three pinned template/story files match the rollout snapshot byte for byte. The actual authored topology source is also copied and hashed. Current worktree HEAD is recorded separately from the canonical rollout commit.

## Assignment and story

- Upper west, x330 y210 size160x140, becomes the sealed local mechanical recorder. Its south-facing viewing center is 410,395. This is the focal point, not a generic AI console.
- Upper east, x700 y210 size160x140, becomes disconnected AI-side housing with empty south-facing socket marks. The 210-unit floor interval between reservations stays open. No cable or new wall bridges it.
- Lower center, x480 y580 size240x120, holds split contactor jaws and a separate local battery symbol. All marks stay inside the retained reservation. The contactor gap is a visual gap within an existing solid footprint, not a navigable opening.

The objective is unchanged. LOCAL RECORD, BEFORE AWAKENING: Rescue impossible. AI acknowledged. Survival promise issued afterward. This is deliberate deception, not merely failed rescue. The reveal remains after the war and fatal-purge warnings and before coolant descent. Muted or skipped presentation must retain passengers alive, purge kills everyone and AI knowledge before awakening. These are story requirements, not behavior established by this drawing.

No lock puzzle, repair, battery swap, lever operation, network reconnect, irreversible choice, Destroy ship control or armed-overload state is proposed. Viewing centers and route lines are diagram annotations, not new interactions or floor solids.

## Focused checks

Run `python draw-layout.py` and `python verify-layout.py` beside `sources/`. Pillow 12.3.0 and the hashed DejaVu fonts produced the PNG. No GPU, random generation or external media is used.

The geometry proof in `geometry-checks.json` uses exact rectangular cell decomposition. It insets the room by the actor radius, expands each obstacle by the same square radius and partitions at every expanded edge. Free open cells connect only across a shared positive-length edge. This is a conservative continuous center domain, not a sampled grid. Each tested radius has one connected component. This excludes small circular corner slivers and does not claim an exhaustive exact circular-domain classification. Square expansion also matches the rectangle sweep in `canTraverseExpedition`, whose code was inspected, not executed.

The direct route, north and south bypasses, three viewing approaches and four breach ingress lines are tested as continuous axis-aligned sweeps at radii16 and28. Minimum raw clearances are 90 for direct, 70 north, 60 south, 45 viewing approaches and100 for breach lines. All exceed radius28. All spawn, exit, breach and viewing anchors are inside the connected conservative domain. Breach marks represent exact template anchors, not enemy bodies. The runtime's 56-unit inward spawn offset is not drawn or simulated.

`verification.json` includes repeat-render byte equality, PNG decoding, source integrity, symbol containment and negative controls. An obstructed route must fail clearance. A test-only full-height wall must disconnect the domain. No test mutation is saved to geometry or runtime files. Logs retain actual output.

## Author visual inspection

Inspected `room12-layout.png` using the image tool after rendering. The full boundary, three reservations, four breach anchors, entry and exit are visible. Recorder and AI assignments read separately across open floor. The lower reservation reads as contactor plus local battery. Text and coordinates remain legible in the full-resolution PNG. The whole-room diagram is flat and deliberately avoids detailed mechanical modeling. Grid, dimension line, routes and viewing circles are explanatory marks, not proposed barriers.

## Limits

This is a static layout and source-derived geometric check, not native gameplay evidence. Combat, actual pathfinding, enemy spawn offsets, camera/HUD framing, muted/skipped progression, material quality, lighting and final model readability remain untested. No stage pass, human acceptance, release readiness or remote publication is claimed. Shapely was unavailable in the initial environment check. The final proof uses Python standard-library geometry and Pillow instead, with no dependency installation.
