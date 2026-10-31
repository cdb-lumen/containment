# Containment

Containment is a standalone browser action roguelike with its own setting and storyline. Descend through a hostile facility across twelve rooms, choose branching routes, upgrade your weapons and confront the Queen.

## Play

[GitHub Pages](https://cdb-lumen.github.io/containment/) updates when an approved change lands on `main`. An open PR does not replace the live game.

- Desktop: WASD / arrows move; mouse aims and fires. Hold Space for aim-assisted fire. R reloads, G throws a grenade, E uses a medkit, 1–5 select weapons, Escape pauses.
- Desktop-only: keyboard and mouse are required. Phone/touch compatibility is outside the supported scope.
- Progress saves between rooms, including unresolved rewards, when browser storage is available. Death clears the checkpoint. Storage failures are shown in the reward, pause, result and title screens; a failed deletion can leave an old checkpoint available after reloading.

## Development

Use Node.js 22.12+ with npm. CI uses Node.js 24.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:smoke
npm run test:authored-smoke:all
npm run verify
```

The production output is `dist/`. Relative bundle and runtime asset URLs support both root hosting and the repository's GitHub Pages subpath. PR verification and the main-only Pages deployment run the same test, build and browser smoke gate.

The browser smoke serves the production build beneath `/containment/`, checks local asset responses, enters gameplay, fires, switches weapons, pauses and resumes, and checks desktop controls and resized settings. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation. Set `SMOKE_SCREENSHOTS=1` to refresh committed evidence in `docs/pr-screenshots/`.

The required local, PR and Pages gates also run authored-room smoke on the desktop viewport. It seeds validated checkpoints and exercises Continue, route selection, final-room consent, firing and pause/resume in the opening, breached loading bay and overload rooms. This is short interaction coverage, not a full playthrough or desktop performance certification. Captures and manifests go to ignored `artifacts/authored-smoke/`. CI bounds each authored viewport to 12 minutes (14-minute step budget), and retains diagnostic artifacts for seven days.

## Source and credits

Game and reusable domain systems: cdb-lumen / Containment. Code is MIT licensed, see `LICENSE`. The original sealed cryochamber model and authored textures are also MIT licensed within the explicit [benchmark asset scope](public/assets/benchmark/CREDITS.md). Three.js is MIT licensed, see `THIRD_PARTY/Three-LICENSE.txt`. Rapier physics is Apache-2.0 licensed, see `THIRD_PARTY/Rapier-LICENSE.txt`.

Adapted Unvanquished models, animations and embedded textures have separate Creative Commons licenses. Preserve [model credits](public/asset-credits.html) and the asset manifests. Environment materials, sound and music attribution are in [audio and environment credits](public/audio-credits.html) and `public/assets/audio/manifest.json`. Barlow fonts by Jeremy Tribby use the SIL Open Font License and load through Google Fonts. Asset licenses are not replaced by the code's MIT license.

Graphics offers High and Low, with High selected on every new page load. Quality never changes automatically; choose Low manually to reduce rendering cost. Browser emulation does not certify physical-device Safari performance.

## Supported platform

As requested on 2026-10-31, development, CI and release acceptance target desktop browsers with keyboard and mouse. Phone controls, mobile compatibility and phone/touch test requirements are removed. Existing historical mobile evidence is retained as history; it is not a future release gate. Desktop resizing, keyboard accessibility, graphics recovery, checkpoint feedback and authored-room checks remain required.

Freeze onset, ice-shatter and reactor-boon cues are synthesized locally and share the effects volume, mute, pause and bounded voice lifecycle. The reactor cue marks a boon discharge, not a new room alarm or hazard.
