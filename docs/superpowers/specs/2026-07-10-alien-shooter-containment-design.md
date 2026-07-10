# Alien Shooter: Containment — Design Specification

**Date:** 2026-07-10

**Status:** Approved

**Repository:** `cdb-review/alien-shooter-containment`

**Delivery:** Public web game hosted on GitHub Pages

## Product statement

Alien Shooter: Containment is an unofficial, fan-made browser tribute to Sigma Team's Alien Shooter. It recreates the original game's dense top-down horde combat, industrial military-horror atmosphere, weapon progression, persistent battlefield damage, and survival pacing in a focused 10–15 minute run.

All source code, visuals, audio, maps, writing, and game data are original. The project will not include extracted, traced, or copied proprietary assets. The title screen and README will state: “Unofficial fan-made tribute. Not affiliated with or endorsed by Sigma Team. All game assets are original.”

## Goals

- Deliver a complete 10–15 minute survival run playable without installation or login.
- Recreate the recognizable feel of Alien Shooter: large crowds, forceful weapons, accumulating battlefield debris, industrial interiors, upgrades, and a final boss.
- Support keyboard/mouse and responsive landscape mobile twin-stick controls.
- Sustain approximately 100–150 visible enemies with adaptive effects quality.
- Publish the source publicly and deploy a production build through GitHub Pages.

## Non-goals

- Reproducing the original ten-mission campaign.
- Multiplayer, accounts, cloud saves, server-side leaderboards, monetization, or backend services.
- Real 3D rendering or imported models.
- Copied art, sounds, level layouts, writing, logos, or reverse-engineered game data.
- A large branching skill tree or procedural roguelike campaign.

## Technology decision

Use Phaser 4.2.1 with TypeScript and Vite. Phaser provides a complete browser-focused 2D game stack: WebGL/Canvas rendering, scenes, cameras, input, sound, physics, tilemaps, particles, tweens, and asset loading. Phaser 4's renderer adds improved mobile batching, lighting, filters, and high-volume sprite rendering. Vite produces a static artifact suitable for GitHub Pages.

The app will use Phaser directly without React or another DOM component framework. HTML/CSS is limited to the canvas host, loading shell, metadata, and accessibility-friendly fallback messaging.

## Architecture

```text
Vite application
└── Phaser game
    ├── BootScene          generated textures, asset loading, save data
    ├── MenuScene          title, controls, settings, disclaimer
    ├── GameScene
    │   ├── FacilityWorld  rooms, walls, doors, hazards, pickups
    │   ├── InputSystem    keyboard/mouse and mobile twin sticks
    │   ├── CombatSystem   weapons, projectiles, damage, explosions
    │   ├── HordeDirector  wave timing, spawn budgets, pacing, boss
    │   ├── EnemySystem    navigation, separation, attacks, pooling
    │   ├── UpgradeSystem  armory purchases and player modifiers
    │   ├── EffectsSystem  lights, particles, decals, camera response
    │   └── HUD            health, armor, ammo, wave, radar, prompts
    ├── PauseScene
    └── ResultsScene       score, run statistics, restart
```

Gameplay rules remain in framework-light TypeScript modules where practical. Phaser scenes adapt those modules to rendering, audio, and input. This keeps wave budgets, damage, weapon progression, upgrades, and scoring independently testable.

## Run structure

1. **Arrival (approximately 60 seconds):** the player enters through the loading bay, obtains the rifle, and learns controls through environmental prompts.
2. **Escalation (waves 1–3):** swarmers establish the core horde loop. Side rooms open with ammunition, credits, and weapon options.
3. **Containment failure (waves 4–6):** several breach points activate. Ranged, armored, and flanking enemies appear alongside darkness and hazards.
4. **Last stand (waves 7–8):** the facility locks down and the population reaches its highest density with elite variants.
5. **Boss:** a teleporter queen uses armor, spawned nests, and an exposed-core damage phase. Defeating it ends the run.

The facility is one persistent interconnected map. Doors and breach points open over time; there are no level-loading transitions during a run.

## Combat and progression

### Weapons

| Weapon | Role |
|---|---|
| Service pistol | Unlimited reserve ammunition and emergency fallback |
| Assault rifle | Dependable sustained fire |
| Combat shotgun | Short-range crowd control and knockback |
| Plasma projector | Penetration and lingering energy damage |
| Rocket launcher | Scarce ammunition and large-area damage |

### Utilities

- Fragmentation grenades
- Medkits
- Temporary sentry drone
- Explosive barrels
- Facility defense turret

Enemies may drop credits, ammunition, armor, and health. After selected waves, the armory opens for one rapid purchase or upgrade. Upgrades alter observable mechanics such as damage, penetration, spread, reload time, magazine size, movement speed, armor, or pickup efficiency. The upgrade interface must not interrupt play for more than a short selection period.

### Enemies

| Enemy | Behavior |
|---|---|
| Swarm crawler | Fast disposable melee attacker |
| Brute | Slow armored attacker with heavy knockback |
| Spitter | Ranged attacker that creates temporary hazard pools |
| Stalker | Flanking attacker with short camouflage periods |
| Brood carrier | Releases smaller creatures when killed |
| Teleporter queen | Multi-stage boss that alternates spawning and vulnerable phases |

## Controls

### Desktop

- `WASD` or arrow keys: move
- Mouse: aim
- Left mouse: fire
- Right mouse or `G`: grenade
- `R`: reload
- `1–5` or mouse wheel: switch weapon
- `E`: interact or purchase
- `Esc`: pause

### Mobile

The game requires landscape orientation for active play. It provides a floating left movement stick, floating right aim/fire stick, and large grenade, medkit, and weapon-swap buttons. Touch aiming includes mild assistance; mouse aiming does not. Touch chrome remains hidden on pointer/keyboard devices. Portrait orientation presents a rotate-device screen without progressing combat.

The game pauses when browser focus or visibility is lost.

## Visual direction

The game uses newly created three-quarter-view actors and a faux-isometric industrial facility. Materials include stained diamond plate, concrete, pipes, cables, crates, laboratory glass, hazard striping, and intermittent emergency lighting.

### Palette

| Role | Hex |
|---|---|
| Gunmetal floor | `#242B2B` |
| Cold steel | `#526264` |
| Emergency amber | `#E58A28` |
| Toxic alien green | `#7EBF43` |
| Blood red | `#7C1519` |
| Display phosphor | `#BBD5C2` |

The signature element is a facility that visibly records the battle. Alien remains, splatter, shell casings, scorch marks, destroyed props, and failed lights accumulate throughout the run. Decals and debris are capped, pooled, and retired by age to preserve performance. Camera movement remains readable but responds to powerful weapons, explosions, and boss impacts.

The HUD uses compact military-instrument styling rather than generic website cards. Information hierarchy prioritizes health/armor, ammunition, current wave/objective, and nearby threats.

## Audio direction

Sound effects and reactive music are newly synthesized or created from original recordings/sources with compatible licenses. Weapon audio emphasizes distinct mechanical identity. Music transitions between low-tension exploration, active horde combat, last-stand intensity, and boss phases. Settings provide master, music, and effects volume controls.

## Performance design

- Target 60 FPS on desktop and a stable 30–60 FPS on modern mobile browsers.
- Pool enemies, projectiles, shells, decals, particles, pickups, and transient effects.
- Use a spatial hash for nearby-enemy queries, separation, explosion damage, and pickup checks.
- Use simplified circle collisions for high-volume enemies and projectiles.
- Reserve Phaser physics bodies for the player, static world boundaries, and interactions where engine collision is useful.
- Keep one persistent facility map and avoid repeated tilemap creation/destruction.
- Avoid expensive dynamic geometry-mask patterns.
- Adapt particle density, dynamic light count, shadow/filter quality, and decal limits using a quality profile.
- Cap simulation delta after tab suspension and pause on visibility loss.
- Remove inactive entities deterministically and expose debug counters during development.

Phaser uses WebGL when available. A reduced-effects Canvas fallback may run when supported; if required capabilities are unavailable, the shell presents a clear compatibility message rather than a broken canvas.

## Persistence and privacy

Local storage contains only settings, selected quality/accessibility options, best score, and best completion time. There are no accounts, analytics, tracking cookies, or network gameplay services.

Invalid or incompatible local data is discarded safely and replaced with defaults.

## Failure and recovery behavior

- Asset-loading failures show a retry action and identify that game files could not load.
- Audio initialization waits for a user gesture and never blocks gameplay startup.
- Losing focus pauses the simulation and displays a resume overlay.
- Death and victory both lead to a results screen with restart and menu actions.
- Unsupported portrait play shows orientation guidance without starting waves.
- A complete restart resets all pooled entities, timers, input state, and scene-owned audio.

## Accessibility

- Master volume plus separate music/effects controls.
- Reduced screen shake and reduced flash options.
- High-contrast HUD text and visible keyboard focus for DOM-level controls.
- Gameplay-critical information is not conveyed solely by color.
- Desktop controls are listed before play and available from pause.
- Touch targets meet a minimum comfortable size and respect safe-area insets.

## Testing strategy

### Unit tests

Use Vitest for framework-light gameplay modules:

- weapon damage, cadence, ammunition, reload, and upgrades
- wave composition and spawn-budget limits
- enemy health, armor, resistances, rewards, and boss phases
- score calculation and local-save validation
- spatial hash insertion, movement, query, and removal
- deterministic cleanup and object-pool reuse

### Browser tests

Use Playwright against the production build for observable behavior:

- boot to menu and start a run
- keyboard/mouse control registration
- pause/resume on explicit input and visibility handling
- representative combat, damage, death, results, and restart flow
- mobile landscape layout and touch-control visibility
- portrait orientation blocker
- settings persistence
- no uncaught browser errors during a bounded horde smoke run

Tests assert user-visible behavior and game state exposed through a small test-only diagnostics seam, not source-text patterns or component names.

### Visual and performance verification

- Capture and inspect real desktop and mobile gameplay screenshots.
- Check for clipping, overlap, unreadable HUD text, off-canvas touch controls, and orientation defects.
- Run a bounded stress scenario at the designed maximum population and verify entity counts remain capped and clean up after restart.
- Treat headless timing data as regression evidence, not a universal device benchmark.

## Repository and deployment

The public GitHub repository contains source code, original/generated asset sources, tests, documentation, license information, and a GitHub Actions workflow. Vite is configured with the repository base path. The workflow builds, uploads, and deploys the static artifact to GitHub Pages.

The README includes:

- playable URL
- controls
- screenshots
- local development and verification commands
- technology summary
- asset/license notes
- unofficial fan-game disclaimer

No secret is required for normal development or Pages deployment.

## Acceptance criteria

The release is complete when all of the following are true:

- A player can complete a coherent 10–15 minute run.
- Five weapons, five standard enemy types, utilities, the armory, and the final boss work.
- Approximately 100–150 visible enemies can be sustained under the adaptive quality strategy without unbounded entity growth.
- Keyboard/mouse and landscape mobile twin-stick controls work.
- Pause, restart, sound settings, accessibility settings, and local best scores work.
- Unit and browser tests pass from a clean checkout.
- The production build succeeds and is exercised locally.
- Final desktop and mobile screenshots are visually inspected.
- GitHub Pages serves the production artifact from the public repository.
- The repository contains no copied proprietary Alien Shooter assets or data.
- The title screen and README clearly identify the project as an unofficial fan-made tribute.
