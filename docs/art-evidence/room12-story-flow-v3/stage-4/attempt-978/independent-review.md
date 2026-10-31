# Independent review of Room12 stage 4 attempt978

## Verdict

Accept the sealed-recorder correction for this bounded static model review. The recorder now visibly has a closed inspection cover rather than exposed reels in a dark recess. The six-material cap remains intact. No ownership regression was found. The owned-geometry cleanup gap documented in attempt977 is also corrected.

This is not human acceptance, full stage-4 story acceptance, gameplay verification or release approval.

## Evidence identity and scope

Repository reviewed: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/safety-interlock-station-v3`.

HEAD was `096871ff8e2e1451689ecf6f2499b9ae82053cb6`. I read the complete uncommitted Git diff. It changes only `src/render/SafetyInterlockBlockout.ts` and `tests/SafetyInterlockBlockout.test.ts`. The retained `candidate.diff` matches the live diff byte for byte. All 134 file hashes in `source-pins.json` match the worktree. `git diff --check` passed. Final Git status retains only those same two modified files.

I loaded and visually inspected all three requested image files directly. Both after originals are byte-identical to their corresponding captures under `after/`. All image hashes match the retained pins.

| Inspected artifact | SHA-256 |
| --- | --- |
| after-in-scene.png | 33431d068c91140bfe19cbdde79ba98e9a1bca87efa061e6689ff78101d3df50 |
| after-overview.png | 27d3753be53ca824d650b8386d30065d4fd0ddd29399fb7534a9969f3021bca8 |
| model-contact-sheet.png | 82f9c8cf70b004ef51a9720b78497a20ea66ae302915be16c30a2b6fefc05a53 |

I also read `attempt-977/budget-correction/independent-review.md`. Its two relevant unresolved findings were the exposed recorder mechanism and incomplete explicit disposal of recorder-owned input geometry through batching. I judged the new pixels before reading that prior verdict. The current contact sheet labels and before/after ordering were visible, so this was not a blind review.

## Visual findings

In the native in-scene original, the recorder is the ivory object at upper left. A continuous blue-gray pane covers both reels and the connecting tape path. The thicker pale perimeter, dark attachment blocks near the upper corners and orange bridge over the lower-right frame establish a closed lid. The mechanism now reads as visible through a cover, not as an uncovered tape deck. The body remains seated on its base.

The native overview preserves that closed rectangular cover and twin-reel identity at room scale. The recorder remains separate from the dark AI housing on the right and the contactor/battery below. There is no visible new encroachment into the surrounding floor routes.

The contact sheet's enlarged original pixels make the change explicit. The previous black open recess and high-contrast copper reels become a continuous tinted inspection surface bounded by a raised frame. The right-side bridge connects the lid edge visually to the existing seal assembly. The inscription remains distinct from the lid and reads LOCAL RECORD / BEFORE AWAKENING in the enlargement. No visible inscription contamination appears on the ivory frame or reel rims.

The cover reduces contrast in the reel centers and tape span. This is a tradeoff, not a blocker: both reels remain recognizable, and the continuous tint helps communicate enclosure. The overview inscription is too small to establish general gameplay readability. A staged enemy partly overlaps the recorder's lower-right base, but does not hide the principal cover or frame cues.

No blocking visual defect was found for the requested static sealed-enclosure correction. These images do not prove a physically watertight manufactured enclosure, transparency behavior at unshown camera angles or live combat readability.

## Geometry, budget and ownership

`SafetyInterlockBlockout.ts` lines 19 to 39 reuse the existing local dark material as inspection glass rather than allocate another material. The previous backing and winding details use steel. A new plane at local y 1.67 covers the mechanism, with raised frame members, attachment blocks and a seal bridge. The new focused test checks that the pane is above and spans both reel bounds and the tape-span bounds. The existing material assertion remains `materials.size <= 6`; it was not relaxed.

The pane, inscription plane and owned ivory geometry clones now carry `environmentUV`. `DepthRenderer.ts` line 126 disposes those inputs after copying them during production batching. `meshParts.ts` lines 55 to 58 preserve cached shared geometry and deduplicate owned resource disposal. No shared renderer or disposal implementation changed.

I reran the prior independent CPU probe against the current worktree using Vite's SSR loader in middleware mode. It constructs the browser-present inscription path with a mocked canvas context, calls production `appendEnvironment` and `bakeWorld`, checks warmed shared UV arrays and observes disposal events. It does not construct a WebGL renderer or launch a browser.

| Reservation | Meshes before batching | Triangles | Materials before / after batching | Owned input geometry | Input disposals at bake / after world disposal |
| --- | ---: | ---: | ---: | ---: | ---: |
| Recorder | 33 | 3296 | 6 / 6 | 15 | 15 / 15 |
| AI housing | 11 | 1356 | 4 / 4 | 0 | 0 / 0 |
| Contactor and battery | 15 | 1708 | 4 / 4 | 0 | 0 / 0 |

Shared cached UV arrays remained unchanged for every reservation. The recorder emitted six material-disposal events and one inscription-texture disposal event. AI housing and contactor each emitted four material-disposal events. The fresh focused tests additionally verified exactly one disposal per owned recorder geometry in both batched and unbatched paths and no disposal of the sampled shared control geometries.

This resolves the prior explicit input-geometry cleanup limitation without increasing the recorder's material budget. It does not constitute a GPU memory measurement.

## Fresh verification

CPU-only command, run from the reviewed repository:

```sh
./node_modules/.bin/vitest run tests/SafetyInterlockBlockout.test.ts --maxWorkers=1 --reporter=verbose
```

Exit code 0. One file passed, all 13 tests passed. Vitest reported 755 ms total duration. Coverage includes enclosure bounds, batched and unbatched geometry ownership, inscription texture disposal, shared inscription material and UV behavior, local lamp properties, reservation containment, the six-material cap, neighboring-room isolation and canonical routes for both tested actor radii.

The successful additional CPU probe loaded the existing `attempt-977/budget-correction/independent-cpu-probe.ts` without modifying it. Loader configuration used `configFile:false`, `optimizeDeps:{noDiscovery:true,include:[]}`, middleware mode and an exact `/^three$/` alias to this repository's `node_modules/three/build/three.module.js`. The server was closed in `finally`. The probe output is transcribed in the table above.

One initial loader attempt failed with ENOTDIR because a broad `three` alias also rewrote `three/addons/environments/RoomEnvironment.js`. The exact-match alias and disabled dependency discovery corrected that setup failure; the retry exited 0. Vite reported dependency re-optimization on the failed attempt, so an ignored dependency cache may have changed. A batched Python tool was denied by the execution policy before running; normal read tools and terminal commands supplied the required evidence instead. No dependency was installed, source edited or GPU capture run.

I did not rerun the full test suite, build, browser smoke or any live gameplay. The retained screenshots show a static staged simulation without DOM HUD. They are sufficient for this model correction, not for campaign traversal, touch use, complete story delivery or human approval.

Only `independent-review.md` was intentionally created by this review. No source, prior evidence, commit, publication or acceptance receipt was changed.
