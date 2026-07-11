# Alien Shooter: Containment

An original, mobile-ready browser survival shooter built with **Phaser 4**, **TypeScript**, and **Vite**. Hold a failing containment facility against escalating alien waves, assemble upgrades between assaults, and survive the queen encounter.

[Play the latest GitHub Pages build](https://cdb-lumen.github.io/alien-shooter-containment/)

> This is an unofficial fan-made survival-shooter tribute. Its source code, procedural artwork, interface, effects, and synthesized audio are original and do not use assets from the *Alien Shooter* series.

## Features

- Deterministic combat, scoring, upgrades, wave planning, and restart behavior
- Multiple enemy roles, hazards, pickups, facility breaches, and a queen boss encounter
- Pistol, rifle, shotgun, rocket/grenade, reload, armor, and medkit systems
- Procedurally drawn environment, characters, effects, and UI—no downloaded art assets
- Gesture-unlocked Web Audio music and sound synthesis—no downloaded audio assets
- Desktop mouse/keyboard and landscape touch controls
- Pause menu with live volume, quality, shake, and flash settings
- Adaptive one-way quality degradation with explicit High/Medium/Low overrides
- Hard runtime caps and pooled effects for bounded long-session performance
- Local best-score and settings persistence

## Controls

### Desktop

| Action | Control |
| --- | --- |
| Move | `WASD` or arrow keys |
| Aim | Mouse |
| Fire | Hold primary mouse button |
| Reload | `R` |
| Grenade | `G` |
| Medkit | `Q` |
| Interact | `E` |
| Switch weapon | `1`–`5` |
| Pause | `Esc` |

### Touch

Play in landscape orientation. The left stick moves; the right stick aims and fires. Dedicated 48px-or-larger buttons pause, throw a grenade, use a medkit, and switch weapons.

## Accessibility and performance

- Keyboard-operable pause controls with focus trapping and focus restoration
- Portrait deployment blocking and automatic simulation suspension on rotation
- Independent reduced-camera-shake and reduced-bright-flash settings
- Live master, music, and effects volume controls
- Adaptive High/Medium/Low presentation profiles
- Capped enemies, projectiles, lights, particles, decals, remains, and shell casings

## Local development

Requirements: a current Node.js release supported by Vite 8 and npm.

```bash
npm ci
npx playwright install chromium
npm run dev
```

Open the URL printed by Vite. To force the deterministic Canvas renderer used by browser automation, append `?renderer=canvas`.

## Verification

```bash
npm run verify
```

The canonical gate runs:

1. ESLint
2. 226 deterministic Vitest unit tests
3. TypeScript checking and a production Vite build
4. Playwright behavior and bounded-stress tests in desktop and iPhone-sized Chromium

Useful focused commands:

```bash
npm test
npm run test:e2e
npm run build
```

Browser tests verify observable behavior: deployment, pause/settings, quality transitions, restart isolation, touch actions, portrait suspension, browser errors, sustained input, and the 150-enemy runtime cap. Unit tests deterministically cover projectile/effect pools and retirement limits that normal weapon cooldowns cannot saturate in real time.

## Architecture

Selected systems:

```text
src/game/
├── audio/         synthesized Web Audio lifecycle
├── combat/        weapons, damage, armor, ammo, projectiles
├── diagnostics/   development-only automation facade
├── effects/       capped effects and adaptive quality
├── enemies/       enemy and boss simulation/view layers
├── hud/           status, radar, and objective presentation
├── input/         desktop and touch adapters
├── persistence/   versioned local settings and scores
├── pickups/       drop simulation and presentation
├── player/        player movement and view
├── pools/         bounded reusable runtime objects
├── run/           run lifecycle and results
├── scenes/        Phaser boot, menu, game, pause, results
├── scoring/       score and combo rules
├── upgrades/      armory offers and modifiers
├── waves/         horde runtime and encounter direction
└── world/         procedural facility generation
```

Simulation-heavy systems are separated from Phaser views and tested in Node. Browser-only lifecycle and interaction behavior is covered with Playwright.

## Deployment

Pull requests run the full verification workflow. Merges to `main` build `dist/` and deploy it through the official GitHub Pages artifact workflow. Vite uses relative asset paths so the build works under the repository subpath.

## License

Original code and assets in this repository are available under the [MIT License](LICENSE). Third-party dependencies retain their respective licenses. *Alien Shooter* is a trademark of its respective owner; this project is not affiliated with or endorsed by that owner.
