# Flush distribution construction result

Candidate ready for independent source-only review. No runtime integration, equipment/material acceptance, whole-room gameplay approval or release claim.

Base remained `0a56af7711aa92ccea634acbbda7ef84e018bb27`. The bounded verifier hashed all 678 prior tracked files before and after execution and found none changed. Git tracked diff is empty. All additions belong to this kit. Nothing committed or pushed.

## Deliverable

- `public/assets/passenger-vault/service-finish.glb`, 42,520 bytes, SHA-256 `85517cc282d247b4a09d0daf3c56405b80f2417a5da1675e3186080ceb1337b6`.
- Original CC0 authoring source `tools/assets/passenger-vault/service_finish.py`.
- Independent imported-mesh contract and negative controls in `test_service_finish.py` beside the source.
- `verify_service_finish.py` runs generation, roundtrip tests, clean-root reproduction, the focused Passenger Vault layout suite and production build.
- This directory contains `manifest.json`, `verification.json`, one combined `verification.log`, and neutral `top.png` / `oblique.png` at 1200 by 880.

The package has 13 connected mesh objects, 1,026 triangles and two neutral materials. All vertices lie exactly at height zero. Adjacent panel faces own seams and cover markings without raised edges, grooves, overlaps or a replacement floor. No geometry above or below the deck, collision registrations, lights, VFX, textures or animations are added.

Four feeds follow x420/780, north y120..248 and south y632..760. Short necks connect them under the distribution reservations to headers centred at y100 and y780. Console contacts at y280 and y600 meet the east channel. The channel occupies x1162..1166 inside the wall footprint, not the inset x1148 diagram annotation on the walkable floor. It remains within the 1200 by 880 envelope. Native GLB axes are X=x/32, Y=height/32, Z=game-y/32, with no node transforms or recentering.

The kit is a zero-thickness finish layer representing protected underfloor routing. It does not claim to model hidden plumbing. Later runtime integration must choose a coplanar decal or floor-merge strategy. This construction does not introduce an epsilon lift or floor cuts.

## Verified results

`python3 tools/assets/passenger-vault/verify_service_finish.py` exited 0. Exact commands, output and source/evidence hashes are in the receipt and combined log.

- Imported GLB contract: 9 tests passed in the checkout and 9 passed in the clean root. Checks cover complete unique inventory, actual native metre coordinates, flush level, winding, triangle area, internal boundary edges, 325 surface rays and connected footprints.
- Negative controls reject each missing row feed or console, raised geometry, recessed geometry, displaced route footprint, the channel moved onto the floor, a cut console connection, an empty mesh and a deleted surface triangle.
- `npx vitest run tests/unit/passengerBlockout.test.ts`: 18 tests passed. Existing topology, solids, routes and operator-space behavior remain under their existing contract. The new finish's globally zero-height geometry cannot add a volumetric obstruction to the 160-unit crossing/spine, 120-unit rear aisles or radius-28 standing spaces.
- `npm run build`: exited 0. The existing large-chunk warning remains; no browser smoke was run.
- Clean source-only rebuild at `/tmp/passenger-service-finish-clean-b82aq8kk` used copied author/test sources and an explicit output root, with no previous equipment assets as inputs. GLB bytes, decoded PNG pixels and manifest geometry/source fields matched. PNG container byte identity is not claimed because Blender embeds timestamps.
- Both final PNGs were visually inspected. The full rectangular envelope is uncropped, four feeds and the east channel are visible. Tiny console-wall contacts are established by imported geometry tests, not claimed readable at room scale. The grey rectangles are flat PNG-only reservation silhouettes for all eight solids, not finished or imported equipment. The wall footprint is exposed to show the normally concealed channel.

## TDD and resolved execution issues

The test was written before the author. Its first Blender execution exited 1 with all 9 tests failing on the expected missing `service-finish.glb` assertion. After authoring, all 9 passed, including mutation controls.

Initial Workbench rendering aborted with missing `libEGL.so.1`, exit 134. Final source uses CPU Cycles with render-only flat neutral materials applied after GLB export and reimport. Exported materials are not emissive. An initial oblique frame clipped corners; its camera was widened, both final frames regenerated, reproduced and inspected. An overly strict whole-manifest reproduction comparison failed on timestamp-bearing PNG metadata; the final verifier validates each manifest's hashes and compares decoded pixels plus geometry/source fields instead.

Independent review is still required. Materials, installed-equipment presentation, runtime coplanar handling, whole-room gameplay, production-camera evidence and release verification are later gates.
