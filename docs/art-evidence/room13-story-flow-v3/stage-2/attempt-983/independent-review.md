# Room13 independent stage2 review

Verdict: PASSED for rough main models placed on the accepted layout. No blocking stage2 defect found. This is not final room art, human acceptance, release approval or a live-combat verdict.

## Evidence reviewed

I loaded both original candidate PNGs with vision and compared them with the accepted attempt982 layout image and brief.

- Overview: `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-2/attempt-983/13-coolant-plant-overview.png`
- Desktop: `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-2/attempt-983/13-coolant-plant-gameplay.png`
- Accepted layout: `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-1/attempt-982/layout-draft.png`

Both candidate PNGs decode at 1280 by 900. Their SHA256 values match the manifest. The manifest contains two unique Room13 view rows. These are actual room images, not blank, loading or wrong-room frames.

The reviewed candidate is dirty source over `4a91675a0eb0baf71b728e327cd1f2bd4f041e21`, not that commit alone. I rehashed all 90 entries in `source-pin.json`; none differed from the working tree. All three source snapshots match their current files. I read `implementation-report.md`, the source pin, scoped implementation and tests, the registration diff, capture metadata, attempt982 brief and the two workspace production policies.

## Placement and pixels

The accepted arrangement survives. The upper pair are long cylindrical exchanger masses with broad end plates and bearing supports. The lower pair have a round pump body, a short coupling and a separate horizontal motor. These silhouettes remain distinguishable in the desktop image. Their plinths ground them and mark the retained rectangular solids. I see no floating main object, displaced installation or machinery projecting into an adjacent walking lane in the supplied views.

The smaller central service saddle sits between the two installations. Both images show the two vertical service spines and paired cross-links terminating against the saddle sides. The accepted six-path network is recognizable as one connected installation. No new exposed overhead pipe blocks the central walking space. The room overview shows open floor around the outer equipment and on both sides of the saddle's north/south bypasses, with the descent marker at the right. The desktop frame crops the far exit, so the overview supplies that placement evidence.

This meets the stage2 requirement for roles, intended scale, neighboring objects and route allocation. It does not yet communicate the whole life-support story without context. That is a later visual development task, not a reason to reject a rough blockout.

## Independent technical checks

Run in `/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3`:

- `npx vitest run tests/CoolantPlantBlockout.test.ts tests/ShipEnvironments.test.ts`: 30 tests passed in two files, exit 0, reported duration 1.15 seconds.
- `git diff --check`: exit 0.
- A separate CPU-only Vite SSR probe constructed the actual Three models, recorded bounds before flattening, after `appendEnvironment`, and after the production `DepthRenderer.bakeWorld`. All five models retained matching bounds within 0.00001 world units. Their horizontal extents match the accepted collision rectangles. Approximate maximum heights were 2.224 for exchangers, 1.651 for pumps and 0.828 for the saddle. Tiny negative floor bounds were floating-point noise, not a placement defect.
- The same probe combined all five models and the service network, then ran production batching. It produced six material meshes. This is a CPU batching result, not a GPU frame-time measurement or total scene draw count.

The focused route tests call production geometry queries. They pass both installation circuits, both saddle bypasses and entry-to-exit paths at radii 16 and 28. They accept the legal central shot segments and reject the straight shot through the saddle. The service tests verify the six accepted coordinates and their flush height. These are controlled model and geometry tests, not live pursuit or combat tests.

The only tracked runtime diff is the exact coolant-plant registration and its room-local replacement of generic maintenance grates. The new builder and test are untracked candidate files covered by the pin. No topology, objective, collision, camera, HUD, shared material, AI or lighting file changed. Other template IDs retain their prior branches, including the tested service-shaft-landing control. This supports source-level preservation of other rooms, including Rooms1-7. I did not recapture every room and do not claim whole-campaign visual regression coverage.

## Concrete defects and limits

1. Minor test defect at `tests/CoolantPlantBlockout.test.ts:21`: `[world,bake(world)]` evaluates the mutation before the loop and contains the same group twice. It does not independently test before-bake bounds as claimed. The separate probe above directly checked all three states and found no candidate geometry failure. Fix the test in later authorized code work by recording or asserting the pre-bake bounds before calling `bake`.
2. The bright service covers dominate the darker machinery in both images and can initially read as diagram lines. The central saddle still reads as a generic square equipment box. These are concrete visual weaknesses to address during room visuals and model iteration. The current shapes and connections are sufficient for rough placement; detailed finish, valves, wear and stronger functional cues are not accepted here.
3. The full rectangular plinth communicates the retained solid footprint, but bounds containment alone does not prove that every blocked projectile at every height intersects rendered machinery. The accepted layout explicitly retains the low saddle as shot-blocking. No new collision mismatch against that contract was established, and no three-dimensional projectile-to-mesh audit was performed.
4. The capture manifest labels these controlled simulations with staged legal actors, an inactive encounter director, no boss, no campaign progression and no DOM HUD. Its fixed-step shot and damage metrics are not live-combat evidence. I launched no GPU capture. HUD overlap and phone visibility are not art gates for this review.
5. The implementation report records a passing full test suite, build and evidence checks. I independently reran the focused tests and geometry probe only. I do not present the writer's broader runs as my own.

No runtime, pin, image, manifest or historical artifact was edited. This report is the sole review deliverable. Parent review, publication and receipt handling remain separate.
