# Room16 stage2 independent review

Verdict: FAIL for stage2 as submitted. Rough placement is substantially readable, but a bounded projectile/model mismatch remains. This is not a final room-art verdict.

## Evidence reviewed

I inspected both actual original PNGs with the vision tool, not thumbnails or a contact sheet:

- `capture/16-swarm-junction-overview.png`
- `capture/16-swarm-junction-gameplay.png`

Both are 1280 by 900. Their SHA256 hashes match their respective manifest entries. The manifest contains exactly two unique image results, both for Room16, with empty error arrays. All 92 entries in `capture-source-pins.json` matched the checkout when independently checked.

I read the stage0 sourced brief, stage1 layout and README, the four runtime source changes, the new Room16 tests, both changed test files and both snapshot diffs. The snapshots change only the Room16 template entry. Runtime and tests were read-only during this review.

These are controlled simulation images with production rendering and a staged combat interval. They are not ordinary playtest, DOM HUD, mobile, touch or campaign-progression evidence. The gameplay image retains the production camera and composer. The overview fits the room. No HUD or mobile gate was applied.

## Visual findings

The rough-placement portion passes in these two views. Northwest, northeast and south root directions remain distinct. The dark center recess reads as a cavity within the metal distributor. Broad charcoal plates and pale transverse bands separate the roots from the floor. The southern root stops above the staged player, leaving a broad west/east combat band and open southern floor. The overview also shows the northern bypass. These are visible clearances, not proof of arbitrary live enemy routes.

The roots are connected by the low continuous bed. The shoulders do not convincingly express torn attachment yet, but I do not classify their exposed bed as an actual floating/disconnected model. The flush metal extensions continue the service directions beyond the cut ends. Their thinness is acceptable for this rough stage.

The overview shows a far-wall directional beam, right arrow and downward supports. The gameplay frame crops the gantry out, so that image cannot validate its support or damage. In the overview the beam reads mostly intact. The dark end treatment is weak evidence of a damaged gantry. `SwarmJunction.ts:66-69` creates a full continuous beam and places the dark end inside its extent, rather than removing or displacing a broken section. Before detailed materials, strengthen the broken-end silhouette and make its intended attachment explicit. This is a secondary model-read finding, not a demand for finished wear or texture work.

## Blocking technical finding

The sealed polygon blocks a horizontal production shot where the visible southern root has no geometry at the renderer's fallback projectile height.

Independent CPU probe:

```json
{"phase":"pre","from":{"x":500,"y":350},"to":{"x":700,"y":350},"renderHeight":0.95,"clearProductionShot":false,"meshHits":[]}
{"phase":"post-equivalent-material-bake","from":{"x":500,"y":350},"to":{"x":700,"y":350},"renderHeight":0.95,"clearProductionShot":false,"meshHits":[]}
```

The probe imports the actual `swarmJunctionBlockout`, `createExpeditionGeometry` and `hasClearExpeditionShot`. It casts a Three mesh ray over that same finite segment. Its second phase reproduces the production material-bucket merge, not a call to the private renderer method. The existing focused tests separately exercise the actual production bake.

`DepthRenderer.ts:285` uses `.95` as the fallback projectile render height. This probe does not assert that every player projectile has that height, since player muzzle data can override it. The mismatch is nevertheless present at an actual renderer-supported projectile height. `SwarmJunction.ts:32-47` builds a low bed and plates, while the Room16 topology treats the whole footprint as a sealed shot blocker. The new coherence test at `SwarmJunction.test.ts:48-57` checks downward top rays against occupancy. That is useful footprint coverage, but it cannot detect horizontal projectiles passing above low geometry.

Resolve the room-local visual/query contract before claiming technical stage2 acceptance. Either provide rough geometry that communicates the retained blocking contract or explicitly scope and verify a query change. Do not silently change shared physics or weaken the occupancy tests. This is a bounded CPU construction finding, not a recorded live-combat failure.

## Checks that passed

Independent command from the supplied checkout:

```sh
./node_modules/.bin/vitest run src/render/SwarmJunction.test.ts tests/unit/authoredTopology.test.ts tests/unit/roguelikeRooms.test.ts tests/unit/awakeningTopology.test.ts tests/unit/passengerBlockout.test.ts --maxWorkers=2
```

Result: 5 test files passed, 79 tests passed, exit 0, duration 2.50 seconds.

The checks cover the exact stage1 footprint and anchors, planned swept routes at radii 16 and 28, sampled connected usable space, a hash of every other room template, pre/post production-bake footprint checks, and three repeated resource lifecycles. Source geometries, baked geometries and owned materials dispose once in those tests. Shared `MAT.steel` is not disposed. The implementation marks its own materials for disposal and its source geometry for bake-time release. The direct-child flattening matches the existing material batching path. I found no additional ownership defect in this bounded review.

The renderer dispatch is restricted to environment `infested` and exact template ID `swarm-junction`. Other source room definitions, camera, combat, materials pipeline and capture scripts are unchanged in the reviewed diff. `git diff --check` passed. The changes to topology assertions and snapshots are specific to the new Room16 solid rather than broad relaxation for all rooms.

## Limits and preserved failures

The parent reports a completed full test suite, build and canonical capture after the implementation child timed out during npm test. I did not rerun the broad suite or build, and do not replace that earlier timeout with a claim that its run passed. My focused run passed. My additional horizontal-ray check found the mismatch above. The probe emitted Node's experimental-loader warning and exited 0; exit 0 indicates probe execution, not coherence success.

I did not launch a GPU job, edit runtime or tests, change the index, commit, publish, merge, deploy or write a receipt. Final room acceptance, live multi-direction pursuit, unrestricted attack readability, mobile and HUD behavior remain outside this stage review. The only review artifact created is this file.
