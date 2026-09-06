# Authored room quality slice

Three **existing** rooms upgraded; campaign remains **20 rooms / 10 environments**. The other 17 story templates and all 16 legacy templates match the previous release exactly. Existing IDs and story/save semantics are retained.

## Rooms

- **Passenger vault** (`passenger-vault`, room 2): curved outer circulation, two occupied cryogenic wells and a shorter exposed cross-aisle. Human-sized pods, pressure frames, vitals indicators and service consoles replace the arbitrary pod blocks.
- **Boarding scar** (`breached-loading-bay`, room 8): asymmetric wedge around a diagonal, raised boarding body. Ribbed shell, hydraulic seal clamps and torn hull plates; unequal upper/lower routes.
- **Overload crucible** (`overload-floor`, room 20): lobed arena around an actual reactor void. Suspended cage, containment rings, coil housings and connected outer fighting sectors.

Boundary and void polygons are shared by collision/navigation/LOS and the renderer. This is not floor paint over rectangular collision. Picking up loot and rewarding drops also respect playable topology. Architecture is original code-built geometry, batched by material; existing asset credits remain in `public/assets/environment/CREDITS.md`.

## Images and provenance

- `*-comparison.jpg`: labeled before/after overviews, same 1280×900 framing and high-quality production renderer. Before: base game geometry at `76dd34c`, captured with the new evidence tool at `02fba11`. After: gameplay/render source `cacf6ed`, synchronized with main through the status-VFX changes in #15/#16.
- `*-overview.png`: complete room, controlled live encounter fixture.
- `*-gameplay.png`: production gameplay camera/composer and a running combat fixture with movement, shots and live enemies. **No HTML HUD**; these are not full-app interaction screenshots.
- `hud/*-desktop-hud.png` and `hud-phone/*-phone-hud.png`: built production application at 1280×900 and 390×844. Validated prior-room checkpoint → real Continue → route or explicit fatal authorization → fire → pause/resume. Phone uses real touch fire. Desktop uses keyboard movement/fire.
- `manifest.json`, `before/manifest.json`, `hud/manifest.json`, `hud-phone/manifest.json`: inventory, viewport, capture source and SHA-256 hashes.

Parent visual review inspected all three overviews, all three combat views, all three comparisons and both HUD sheets. Revised the first art pass after rejecting an empty upper cryo well, flat boarding object and unfinished floors. Final views keep clear walking silhouettes and readable actors; all six HUD captures show readable controls and narrative overlays.

## Reproduce

```sh
npm ci
npm run verify
node scripts/room-evidence.mjs --rooms=passenger-vault,breached-loading-bay,overload-floor --gameplay-all --verify-all --out=docs/pr-screenshots/authored-rooms
node scripts/authored-room-smoke.mjs --viewport=desktop --out=docs/pr-screenshots/authored-rooms/hud
node scripts/authored-room-smoke.mjs --viewport=phone --out=docs/pr-screenshots/authored-rooms/hud-phone
```

Verified: **263 unit tests passed / 1 skipped**, 2 evidence-tool tests passed, production build, standard desktop/touch smoke and the six target-room HUD interactions. The evidence test drives the production update from spawn to exit and fires at live enemies in each of the three rooms. Additional domain tests cover walls/voids, navigation, enemy attack clearance, raycasts, drops and legacy fallback. The final-room HUD test asserts Skip cannot authorize destruction.

## Limits

This is the three-room benchmark, **not a 20-room art overhaul**. Room difficulty and full holdout balance still need playtesting. No new staged reactor-sector hazard system or cryopod-breakout animation is included. Browser captures use software WebGL on this runner; frame timings are not evidence of target-device FPS. The existing large JavaScript-chunk warning remains. Draw-call observations for these high-quality combat views are 69–71; these are not a device performance guarantee.
