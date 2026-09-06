# Twenty-room ship route

Twenty new playable rooms in ten environment pairs. New runs visit all twenty in plot order. The sixteen older templates remain available for version 1/2 checkpoint compatibility; the former default run was twelve rooms.

## Evidence

- `01` through `20`, `overview.png`: actual `DepthGame` and `DepthRenderer` scenes, with a fitted overview camera and deliberately placed legal actors. These are room views, not proof of organic combat traversal.
- `01`, `11`, `20`, `gameplay.png`: the production camera at spawn, without the HUD.
- `manifest.json`: exact capture source commit, inventory, viewport, quality, readiness, WebGL results, image hashes and pixel-review verdicts.
- Room overviews use the same renderer/geometry as the final UI. Later HUD-only changes do not change these images.
- The full-app desktop and touch smoke captures live one directory above. Those use the production UI and exercise firing, weapon switching and pause/resume.

All twenty overviews and the three production-camera images were visually inspected. Geometry is painted and room boundaries fit the overview; each environment pair has distinct obstacle layouts. Ten prop families, floor treatments and wall treatments distinguish the ship spaces.

## Reproduce

```sh
node scripts/room-evidence.mjs --expect=20 --expect-environments=10 --limit=10
node scripts/room-evidence.mjs --expect=20 --expect-environments=10 --start=10 --limit=10 --append --verify-all
SMOKE_SCREENSHOTS=1 npm run verify
```

Overview captures use high quality by default. `--quality=low` exercises the performance setting. The head SHA and quality must agree when appending batches. Inspect newly captured pixels before marking their review passed.

## Scope

Custom Three.js geometry reuses the existing credited environment materials. No new third-party asset download or license requirement was added.

This is the first playable room-art pass. The full cryopod breakout, physical console interactions, per-room cinematic effects and human-tested run balance remain later work. Story milestones currently use short persistent status/objective text with immediately skippable AI lines. Final destruction requires a separate deliberate confirmation, followed by a timed holdout and fatal overload.

Software-rendered Chromium smoke timings are not a real-device frame-rate benchmark.
