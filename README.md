# Alien Shooter: Containment 2.0

Containment / Depth is version 2.0 of [Alien Shooter: Containment](https://github.com/cdb-lumen/alien-shooter-containment), replacing the 2D game with the supplied Three.js action roguelike. Descend through twelve rooms with branching routes, weapon upgrades and a Queen encounter. Version 1 remains in Git history.

## Play

[GitHub Pages](https://cdb-lumen.github.io/alien-shooter-containment/) updates when an approved change lands on `main`. An open PR does not replace the live game.

- Desktop: WASD / arrows move; mouse aims and fires. Hold Space for aim-assisted fire. R reloads, G throws a grenade, E uses a medkit, 1–5 select weapons, Escape pauses.
- Touch: left movement stick and right fire control. Hold fire for aim assist; drag to aim manually. Reload, grenade and healing are right-thumb actions.
- Progress saves between rooms, including unresolved rewards. Death deletes the checkpoint. Version 1 saves are not migrated.

## Development

Use Node.js 22.12+ with npm. CI uses Node.js 24.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:smoke
npm run verify
```

The production output is `dist/`. Relative bundle and runtime asset URLs support both root hosting and the repository's GitHub Pages subpath. PR verification and the main-only Pages deployment run the same test, build and browser smoke gate.

The browser smoke serves the production build beneath `/alien-shooter-containment/`, checks local asset responses, enters gameplay, fires, switches weapons, pauses and resumes, and checks a touch viewport. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation. Set `SMOKE_SCREENSHOTS=1` to refresh committed evidence in `docs/pr-screenshots/`.

## Source and credits

Imported from `Containment-Depth-2/source/` in the uploaded source archive. The prebuilt game and Mac launcher are not used. No standalone hosting identity is retained.

Original game and reusable domain systems: cdb-lumen / Alien Shooter: Containment. Code remains MIT licensed, see `LICENSE`. Three.js is MIT licensed, see `THIRD_PARTY/Three-LICENSE.txt`.

Adapted Unvanquished models, animations and embedded textures have separate Creative Commons licenses. Preserve [model credits](public/asset-credits.html) and the asset manifests. Environment materials, sound and music attribution are in [audio and environment credits](public/audio-credits.html) and `public/assets/audio/manifest.json`. Barlow fonts by Jeremy Tribby use the SIL Open Font License and load through Google Fonts. Asset licenses are not replaced by the code's MIT license.

Automatic quality reduces effects and resolution on coarse-pointer devices and adapts under rendering load. Browser emulation does not certify physical-device Safari performance.
