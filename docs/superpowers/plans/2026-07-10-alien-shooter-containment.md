# Alien Shooter: Containment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, publish, and host a complete 10–15 minute Alien Shooter-inspired survival game with original assets, desktop and mobile controls, dense hordes, upgrades, a boss, and GitHub Pages deployment.

**Architecture:** A Vite/TypeScript shell hosts a Phaser 4 game organized into small scenes and gameplay systems. Deterministic framework-light modules own combat values, wave composition, scoring, persistence, pooling, and spatial queries; Phaser adapters own rendering, input, audio, and scene lifecycle. Original visual and audio assets are generated from source code so the public repository is reproducible and contains no copied proprietary material.

**Tech Stack:** Phaser 4.2.1, TypeScript 7.0.2, Vite, Vitest 4.1.10, Playwright 1.61.1, ESLint 10.6.0, GitHub Actions, GitHub Pages.

---

## File map

```text
.github/workflows/deploy-pages.yml        build/test/deploy workflow
README.md                                 public project and play instructions
LICENSE                                   source-code license
index.html                                accessible canvas host and metadata
package.json                              scripts and dependencies
vite.config.ts                            Pages base path and test config
tsconfig.json                             strict TypeScript configuration
eslint.config.js                          source/test lint rules
playwright.config.ts                      production-preview browser tests
src/main.ts                               browser entrypoint
src/styles.css                            full-viewport shell and orientation UI
src/game/config.ts                        Phaser renderer and scale configuration
src/game/GameApp.ts                       game construction and destruction
src/game/constants.ts                     shared dimensions, colors, tuning limits
src/game/events.ts                        typed cross-system event names
src/game/scenes/BootScene.ts              procedural textures and startup
src/game/scenes/MenuScene.ts              title, settings, controls, disclaimer
src/game/scenes/GameScene.ts              gameplay composition root
src/game/scenes/PauseScene.ts             pause/settings overlay
src/game/scenes/ResultsScene.ts           victory/death statistics and restart
src/game/world/FacilityWorld.ts            persistent room geometry and doors
src/game/world/facilityLayout.ts          original map data and spawn points
src/game/world/createTextures.ts          original procedural texture generation
src/game/input/DesktopInput.ts            keyboard/mouse control adapter
src/game/input/TouchInput.ts              twin-stick control adapter
src/game/input/InputState.ts              renderer-independent input contract
src/game/player/Player.ts                 player rendering and state adapter
src/game/combat/types.ts                  weapon/projectile/damage contracts
src/game/combat/catalog.ts                five weapon definitions
src/game/combat/CombatSystem.ts           firing, reload, hits, explosions
src/game/combat/ProjectilePool.ts         reusable projectile actors
src/game/enemies/types.ts                 enemy definitions and runtime state
src/game/enemies/catalog.ts               five enemy definitions and boss values
src/game/enemies/EnemySystem.ts           spawn, movement, separation, attacks
src/game/enemies/EnemyPool.ts             reusable enemy actors
src/game/enemies/SpatialHash.ts           bounded neighbor queries
src/game/waves/wavePlan.ts                eight-wave composition
src/game/waves/HordeDirector.ts           wave/breach/armory/boss state machine
src/game/upgrades/catalog.ts              upgrade definitions and effects
src/game/upgrades/UpgradeSystem.ts         offers, purchase, application
src/game/pickups/PickupSystem.ts           health/armor/ammo/credit drops
src/game/effects/EffectsSystem.ts          particles, decals, lights, quality
src/game/effects/quality.ts                adaptive effects profiles
src/game/audio/AudioSystem.ts              synthesized effects/reactive music
src/game/hud/Hud.ts                        gameplay instruments and prompts
src/game/persistence/saveData.ts           validated local settings/high scores
src/game/scoring/score.ts                  deterministic run score
src/game/diagnostics/diagnostics.ts         test-only observable state seam
tests/unit/*.test.ts                       deterministic gameplay tests
tests/e2e/game.spec.ts                     desktop production-build flow
tests/e2e/mobile.spec.ts                   touch/orientation layout flow
tests/e2e/stress.spec.ts                   bounded horde/restart smoke
public/favicon.svg                         original hazard/alien-eye mark
public/social-card.svg                     original repository/social preview
```

## Shared contracts

The implementation keeps these names stable across tasks:

```ts
export type Vec2 = { x: number; y: number };

export type InputState = {
  move: Vec2;
  aimWorld: Vec2;
  firing: boolean;
  grenadePressed: boolean;
  medkitPressed: boolean;
  reloadPressed: boolean;
  interactPressed: boolean;
  weaponDelta: -1 | 0 | 1;
  directWeapon: number | null;
};

export type RunPhase =
  | 'arrival'
  | 'combat'
  | 'armory'
  | 'boss'
  | 'victory'
  | 'defeat';

export type QualityProfile = 'low' | 'medium' | 'high';
```

---

### Task 1: Repository, toolchain, and browser shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Create: `src/game/GameApp.ts`
- Create: `src/game/config.ts`
- Create: `src/game/constants.ts`
- Create: `tests/unit/shell.test.ts`
- Create: `.gitignore`

- [ ] **Step 1: Add the failing shell contract test**

```ts
// tests/unit/shell.test.ts
import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH, MAX_ACTIVE_ENEMIES } from '../../src/game/constants';

describe('game shell constants', () => {
  it('uses a landscape logical viewport and bounded horde', () => {
    expect(GAME_WIDTH).toBe(1280);
    expect(GAME_HEIGHT).toBe(720);
    expect(MAX_ACTIVE_ENEMIES).toBe(150);
  });
});
```

- [ ] **Step 2: Scaffold dependencies and scripts**

Run:

```bash
npm init -y
npm install phaser@4.2.1
npm install -D typescript@7.0.2 vite@latest vitest@4.1.10 @playwright/test@1.61.1 eslint@10.6.0 @eslint/js typescript-eslint
```

Set scripts to:

```json
{
  "dev": "vite",
  "preview": "vite preview",
  "build": "tsc --noEmit && vite build",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "lint": "eslint .",
  "verify": "npm run lint && npm run test && npm run build"
}
```

- [ ] **Step 3: Run the unit test and confirm RED**

Run: `npm test -- tests/unit/shell.test.ts`

Expected: FAIL because `src/game/constants.ts` does not exist.

- [ ] **Step 4: Implement the strict shell**

Use these constants:

```ts
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const WORLD_WIDTH = 2560;
export const WORLD_HEIGHT = 1440;
export const MAX_ACTIVE_ENEMIES = 150;
export const STORAGE_KEY = 'alien-shooter-containment:v1';
```

`GameApp` must expose `mount(parent: HTMLElement)` and `destroy()`. Configure Phaser with `type: Phaser.AUTO`, `scale.mode: Phaser.Scale.FIT`, `scale.autoCenter: Phaser.Scale.CENTER_BOTH`, transparent `false`, pixel art `false`, antialias `true`, and a dark background. `src/main.ts` mounts into `#game-root`, prevents the context menu over the canvas, and destroys the game during `beforeunload`.

- [ ] **Step 5: Add responsive shell CSS**

`body` and `#game-root` fill the viewport, use `overflow: hidden`, a near-black background, safe-area padding, and `touch-action: none`. Add `.portrait-blocker` hidden by default and visible through `(orientation: portrait) and (pointer: coarse)`.

- [ ] **Step 6: Verify and commit**

Run: `npm run verify`

Expected: lint, unit test, typecheck, and Vite production build pass.

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts eslint.config.js index.html src tests .gitignore
git commit -m "chore: scaffold Phaser game shell"
```

---

### Task 2: Deterministic combat, enemy, scoring, and persistence models

**Files:**
- Create: `src/game/combat/types.ts`
- Create: `src/game/combat/catalog.ts`
- Create: `src/game/enemies/types.ts`
- Create: `src/game/enemies/catalog.ts`
- Create: `src/game/upgrades/catalog.ts`
- Create: `src/game/scoring/score.ts`
- Create: `src/game/persistence/saveData.ts`
- Create: `tests/unit/catalog.test.ts`
- Create: `tests/unit/score.test.ts`
- Create: `tests/unit/saveData.test.ts`

- [ ] **Step 1: Write failing catalog tests**

Assert exactly five weapons (`pistol`, `rifle`, `shotgun`, `plasma`, `rocket`), exactly five standard enemy types, positive weapon cadence/damage, pistol infinite reserve ammunition, rocket splash radius greater than shotgun pellet radius, and boss health greater than every standard enemy.

```ts
expect(Object.keys(WEAPONS)).toEqual(['pistol', 'rifle', 'shotgun', 'plasma', 'rocket']);
expect(WEAPONS.pistol.reserve).toBe(Number.POSITIVE_INFINITY);
expect(WEAPONS.rocket.splashRadius).toBeGreaterThan(WEAPONS.shotgun.projectileRadius);
expect(ENEMIES.queen.maxHealth).toBeGreaterThan(Math.max(...STANDARD_ENEMY_IDS.map(id => ENEMIES[id].maxHealth)));
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `npm test -- tests/unit/catalog.test.ts tests/unit/score.test.ts tests/unit/saveData.test.ts`

Expected: FAIL on missing catalog and persistence modules.

- [ ] **Step 3: Implement stable model types and catalogs**

`WeaponDefinition` includes `id`, `label`, `damage`, `roundsPerSecond`, `magazine`, `reserve`, `reloadMs`, `pellets`, `spreadRadians`, `projectileSpeed`, `projectileRadius`, `penetration`, `splashRadius`, and `knockback`. `EnemyDefinition` includes `id`, `maxHealth`, `speed`, `radius`, `contactDamage`, `attackCooldownMs`, `creditReward`, `dropChance`, and `behavior`.

Use tuned starting values with rifle DPS above pistol DPS, shotgun eight pellets, plasma penetration three, and rocket splash radius 132 logical pixels. Keep all values in one catalog rather than scattering balance constants through scene code.

- [ ] **Step 4: Implement validated local persistence**

```ts
export type SaveData = {
  version: 1;
  settings: {
    masterVolume: number;
    musicVolume: number;
    effectsVolume: number;
    reducedShake: boolean;
    reducedFlash: boolean;
    quality: 'auto' | 'low' | 'medium' | 'high';
  };
  records: { bestScore: number; bestTimeMs: number | null };
};
```

`parseSaveData(value: string | null)` returns defaults for malformed JSON, wrong versions, non-finite scores, invalid quality strings, or volume values outside `[0, 1]`. `saveData(storage, data)` catches storage quota/security failures without crashing.

- [ ] **Step 5: Implement deterministic score calculation**

`calculateScore({ kills, eliteKills, bossDefeated, wavesCleared, creditsUnspent, elapsedMs })` awards kill, elite, wave, boss, and unspent-credit points plus a bounded completion-time bonus. It returns a non-negative integer and never reads wall-clock time internally.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- tests/unit/catalog.test.ts tests/unit/score.test.ts tests/unit/saveData.test.ts && npm run verify`

```bash
git add src/game/combat src/game/enemies src/game/upgrades src/game/scoring src/game/persistence tests/unit
git commit -m "feat: define deterministic gameplay models"
```

---

### Task 3: Wave plan, spatial hash, and reusable pools

**Files:**
- Create: `src/game/enemies/SpatialHash.ts`
- Create: `src/game/waves/wavePlan.ts`
- Create: `src/game/waves/HordeDirector.ts`
- Create: `src/game/combat/ProjectilePool.ts`
- Create: `src/game/enemies/EnemyPool.ts`
- Create: `tests/unit/spatialHash.test.ts`
- Create: `tests/unit/waves.test.ts`
- Create: `tests/unit/pools.test.ts`

- [ ] **Step 1: Write failing spatial-query and wave-budget tests**

Tests cover insertion, moving between cells, removal, radius queries without duplicate results, eight numbered waves, armory after waves 2/4/6, boss after wave 8, and no configured spawn budget above `MAX_ACTIVE_ENEMIES`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npm test -- tests/unit/spatialHash.test.ts tests/unit/waves.test.ts tests/unit/pools.test.ts`

Expected: FAIL on missing exports.

- [ ] **Step 3: Implement `SpatialHash<T extends { id: string; x: number; y: number }>`**

Use a fixed 128-pixel cell size and maintain an `id -> occupied cell key` index. Expose `insert`, `update`, `remove`, `queryRadius`, `clear`, and `size`. Filter candidates by squared Euclidean distance before returning them.

- [ ] **Step 4: Implement the eight-wave plan and director state machine**

Each wave specifies duration, total spawn budget, concurrent cap, spawn interval, allowed enemy weights, elite chance, and active breach IDs. `HordeDirector.update(deltaMs, aliveCount)` emits typed events for spawn requests, wave completion, armory start, armory end, boss start, victory, and defeat. It must never request a spawn when `aliveCount` reaches the current concurrent cap or global maximum.

- [ ] **Step 5: Implement generic reusable pools**

Pools preallocate a small baseline, activate inactive members, reset all mutable state through one reset callback, and cap total members. Releasing an item twice is idempotent. Clearing a pool deactivates every member and resets active count to zero.

- [ ] **Step 6: Verify and commit**

Run: `npm run verify`

```bash
git add src/game/enemies src/game/waves src/game/combat tests/unit
git commit -m "feat: add bounded horde simulation primitives"
```

---

### Task 4: Original procedural art, facility world, and boot/menu scenes

**Files:**
- Create: `src/game/world/createTextures.ts`
- Create: `src/game/world/facilityLayout.ts`
- Create: `src/game/world/FacilityWorld.ts`
- Create: `src/game/scenes/BootScene.ts`
- Create: `src/game/scenes/MenuScene.ts`
- Create: `src/game/events.ts`
- Create: `public/favicon.svg`
- Create: `public/social-card.svg`
- Modify: `src/game/config.ts`
- Create: `tests/unit/facilityLayout.test.ts`

- [ ] **Step 1: Write a failing facility-layout test**

Assert unique room/breach IDs, all bounds inside the 2560×1440 world, a loading-bay player spawn, at least five breach points, an armory zone, a turret position, and a queen arena with enough clearance for the boss radius.

- [ ] **Step 2: Run the test and confirm RED**

Run: `npm test -- tests/unit/facilityLayout.test.ts`

Expected: FAIL on missing layout.

- [ ] **Step 3: Define original map data**

Create a continuous asymmetric facility with loading bay, central hall, armory, east laboratory, west storage, generator room, and north teleporter chamber. Use rectangles/polygons and explicit door transitions rather than copied tile layouts. Keep the central hall wide enough for 100-enemy circulation.

- [ ] **Step 4: Generate all initial textures in Phaser**

`createTextures(scene)` uses `Graphics` and `DynamicTexture` to create gunmetal floor tiles, hazard stripes, concrete walls, crates, barrels, pickups, muzzle flashes, projectile shapes, five distinct alien silhouettes, queen layers, player rotations, touch controls, splatter stamps, scorch marks, and HUD icons. Apply three-quarter shading, cold-steel highlights, toxic-green alien tissue, and emergency-amber lights. No external copyrighted asset enters the build.

- [ ] **Step 5: Build `FacilityWorld`**

Draw floors and props once, create static collision boundaries, expose named spawn points and door states, depth-sort objects by `y`, and provide `openForWave(waveNumber)`, `getActiveBreaches()`, `getArmoryZone()`, and `reset()`.

- [ ] **Step 6: Build boot and menu scenes**

Boot generates textures, loads save data, and transitions to Menu. Menu presents the title, “Unofficial fan-made tribute” disclaimer, start button, controls, volume/accessibility settings, and responsive pointer/keyboard interactions. The hero background previews the facility with a restrained emergency-light sweep.

- [ ] **Step 7: Verify, screenshot the menu locally, and commit**

Run: `npm run verify`

Start `npm run dev -- --host 127.0.0.1`, capture the rendered menu with Playwright, inspect that it is the game menu rather than an error overlay, then stop the exact server process.

```bash
git add src/game/world src/game/scenes src/game/events.ts src/game/config.ts public tests/unit
git commit -m "feat: create original facility and title experience"
```

---

### Task 5: Player, desktop input, combat, and HUD vertical slice

**Files:**
- Create: `src/game/input/InputState.ts`
- Create: `src/game/input/DesktopInput.ts`
- Create: `src/game/player/Player.ts`
- Create: `src/game/combat/CombatSystem.ts`
- Create: `src/game/hud/Hud.ts`
- Create: `src/game/scenes/GameScene.ts`
- Create: `src/game/diagnostics/diagnostics.ts`
- Modify: `src/game/config.ts`
- Create: `tests/unit/combat.test.ts`

- [ ] **Step 1: Write failing combat-state tests**

Test fire cadence, magazine decrement, pistol reserve behavior, reload duration, shotgun pellet count, plasma penetration decrement, rocket splash falloff, grenade cooldown, armor-before-health damage, death at zero health, and full reset between runs.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npm test -- tests/unit/combat.test.ts`

Expected: FAIL because combat state does not exist.

- [ ] **Step 3: Implement desktop input and player adapter**

Normalize diagonal movement, aim toward camera-transformed world pointer, detect edge-triggered grenade/reload/interact/weapon inputs, and prevent browser context menus. Player speed is frame-rate independent, constrained by facility collisions, and rendered with weapon-facing rotation while preserving three-quarter body depth.

- [ ] **Step 4: Implement combat**

Use pooled projectiles and deterministic weapon state. Hits apply damage and knockback once per eligible target. Shotgun creates eight projectiles with deterministic spread around the aim angle. Plasma tracks remaining penetration. Rockets and grenades query the spatial hash for splash targets. Reload cancels only on weapon swap or death.

- [ ] **Step 5: Implement the gameplay HUD**

Show health, armor, current weapon, magazine/reserve, grenade/medkit count, credits, wave, objective, and a compact proximity radar. HUD values update from explicit events rather than polling display text. Critical health pulses without relying solely on red color.

- [ ] **Step 6: Add test diagnostics seam**

In development/test builds expose `window.__ALIEN_GAME__` with read-only `phase`, `playerHealth`, `activeEnemies`, `activeProjectiles`, `wave`, `touchControlsVisible`, and actions `startRun`, `damagePlayer`, `completeWave`, `spawnStressWave`, and `restart`. Production builds expose no mutating diagnostics.

- [ ] **Step 7: Verify and commit**

Run: `npm run verify`

```bash
git add src/game/input src/game/player src/game/combat src/game/hud src/game/scenes/GameScene.ts src/game/diagnostics tests/unit/combat.test.ts
git commit -m "feat: add playable desktop combat slice"
```

---

### Task 6: Enemy behaviors, pickups, upgrades, and complete waves

**Files:**
- Create: `src/game/enemies/EnemySystem.ts`
- Create: `src/game/pickups/PickupSystem.ts`
- Create: `src/game/upgrades/UpgradeSystem.ts`
- Modify: `src/game/upgrades/catalog.ts`
- Modify: `src/game/scenes/GameScene.ts`
- Create: `tests/unit/enemyBehavior.test.ts`
- Create: `tests/unit/upgrades.test.ts`
- Create: `tests/unit/pickups.test.ts`

- [ ] **Step 1: Write failing behavior tests**

Verify crawler pursuit, brute armor/knockback, spitter preferred range and hazard cooldown, stalker flank/camouflage timing, brood-carrier spawn-on-death cap, pickup drop bounds, credit accounting, three distinct upgrade offers, purchase rejection when credits are insufficient, and upgrade effects on observable weapon/player values.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npm test -- tests/unit/enemyBehavior.test.ts tests/unit/upgrades.test.ts tests/unit/pickups.test.ts`

Expected: FAIL on missing systems.

- [ ] **Step 3: Implement enemy steering and attacks**

Use direct pursuit with spatial-hash separation and facility collision steering. Ranged enemies keep distance; stalkers select an offset flank target; carriers reserve child capacity before death. Update distant enemies at a lower decision frequency while integrating movement every frame. Despawn only through explicit death/reset paths.

- [ ] **Step 4: Implement pickups and the armory**

Drops use a seeded per-run random source for testability. Pickups expire visually, magnetize only after the pickup-efficiency upgrade, and cap active count. The armory freezes spawning, keeps the world visible, offers three affordable/relevant upgrades, supports keyboard/pointer/touch selection, and resumes automatically after selection or a bounded timeout.

- [ ] **Step 5: Integrate all eight waves**

Connect director spawn requests, breach effects, door progression, elite visual markers, objectives, rewards, and armory transitions. Arrival starts only after the player moves or fires. Combat intensity reaches the global cap only during the final waves.

- [ ] **Step 6: Verify and commit**

Run: `npm run verify`

```bash
git add src/game/enemies src/game/pickups src/game/upgrades src/game/scenes/GameScene.ts tests/unit
git commit -m "feat: complete horde enemies and progression"
```

---

### Task 7: Boss, run completion, results, and restart integrity

**Files:**
- Modify: `src/game/enemies/EnemySystem.ts`
- Modify: `src/game/waves/HordeDirector.ts`
- Create: `src/game/scenes/ResultsScene.ts`
- Create: `tests/unit/boss.test.ts`
- Create: `tests/unit/restart.test.ts`

- [ ] **Step 1: Write failing boss and restart tests**

Test queen armor phase, nest-spawn phase, vulnerable-core phase, phase thresholds, global spawn cap, victory only after core health reaches zero, result scoring, record updates, and reset of enemies/projectiles/pickups/hazards/decals/timers/input/audio between runs.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npm test -- tests/unit/boss.test.ts tests/unit/restart.test.ts`

Expected: FAIL on missing boss state and results scene.

- [ ] **Step 3: Implement teleporter queen**

The queen remains in the north chamber, rotates toward the player, alternates armored spawning with exposed-core windows, creates destructible nests, and telegraphs area attacks before damage. Boss attacks use existing combat/pool/query systems and remain readable under reduced-flash settings.

- [ ] **Step 4: Implement results and persistence**

Victory and defeat show score, kills, elite kills, waves, elapsed time, selected upgrades, and previous/best records. Restart constructs a clean run without reloading the page; menu returns to the title without leaked input or audio listeners.

- [ ] **Step 5: Verify and commit**

Run: `npm run verify`

```bash
git add src/game/enemies src/game/waves src/game/scenes/ResultsScene.ts tests/unit
git commit -m "feat: add final boss and complete run lifecycle"
```

---

### Task 8: Mobile twin-stick controls, pause, settings, and accessibility

**Files:**
- Create: `src/game/input/TouchInput.ts`
- Create: `src/game/scenes/PauseScene.ts`
- Modify: `src/game/scenes/MenuScene.ts`
- Modify: `src/game/scenes/GameScene.ts`
- Modify: `src/styles.css`
- Create: `tests/unit/inputState.test.ts`

- [ ] **Step 1: Write failing input-state tests**

Verify normalized stick vectors, dead zones, right-stick auto-fire, pointer-ID ownership, simultaneous sticks, canceled touches, coarse-pointer detection override, pause clearing held inputs, and no movement/fire while portrait-blocked.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm test -- tests/unit/inputState.test.ts`

Expected: FAIL on missing touch adapter.

- [ ] **Step 3: Implement floating twin sticks**

Left/right touches claim their half of the viewport, establish a floating origin, clamp displacement, and release independently. Right-stick magnitude above the dead zone sets firing. Add safe-area-aware grenade, medkit, and weapon buttons with at least 48 CSS-pixel targets. Hide touch UI on fine pointers unless touch input is observed.

- [ ] **Step 4: Implement pause and focus recovery**

Escape, pause button, `visibilitychange`, and window blur suspend gameplay timers, physics, input, and reactive music. Resuming requires explicit user action after visibility loss. Pause exposes controls, volume, quality, reduced shake, reduced flash, restart, and menu.

- [ ] **Step 5: Apply accessibility behavior**

Reduced shake scales camera displacement to zero. Reduced flash replaces white full-screen flashes with short amber edge pulses. Critical prompts include text/icons. DOM shell controls have visible focus and labels. Portrait mode displays rotate guidance and prevents wave progression.

- [ ] **Step 6: Verify and commit**

Run: `npm run verify`

```bash
git add src/game/input src/game/scenes src/styles.css tests/unit/inputState.test.ts
git commit -m "feat: add mobile controls and accessible pause settings"
```

---

### Task 9: Original audio, battlefield persistence, and adaptive quality

**Files:**
- Create: `src/game/audio/AudioSystem.ts`
- Create: `src/game/effects/EffectsSystem.ts`
- Create: `src/game/effects/quality.ts`
- Modify: `src/game/scenes/GameScene.ts`
- Create: `tests/unit/quality.test.ts`
- Create: `tests/unit/effectsLimits.test.ts`

- [ ] **Step 1: Write failing quality and cap tests**

Assert low/medium/high limits for dynamic lights, particles, decals, remains, and shell casings; automatic downgrade after sustained slow frames; no automatic upgrade during active combat; caps never exceeded; oldest nonessential effect is retired first; and reduced-flash/shake settings override profile defaults.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npm test -- tests/unit/quality.test.ts tests/unit/effectsLimits.test.ts`

Expected: FAIL on missing quality/effects modules.

- [ ] **Step 3: Implement original synthesized audio**

Use Web Audio oscillators, filtered noise buffers, envelopes, distortion, and convolution-free short delays to synthesize distinct pistol, rifle, shotgun, plasma, rocket, explosion, alien, pickup, alarm, and UI sounds. Build a reactive procedural music bed from low industrial drones, pulse sequences, and percussion layers. Start/resume the audio context only after user gesture and honor master/music/effects volumes.

- [ ] **Step 4: Implement persistent battlefield effects**

Pool splatter stamps, remains, scorch marks, shell casings, muzzle flashes, impact particles, emergency lights, and hazard pools. Add effects on gameplay events, not by scanning entities. Preserve major remains longer than transient particles. Disable expensive lighting/filter combinations on low quality.

- [ ] **Step 5: Implement adaptive quality**

Measure a rolling frame-time window after startup. Downgrade one level only after sustained threshold violation and never oscillate within a run. User-selected explicit profiles disable automatic selection. Expose the active profile in diagnostics.

- [ ] **Step 6: Verify and commit**

Run: `npm run verify`

```bash
git add src/game/audio src/game/effects src/game/scenes/GameScene.ts tests/unit
git commit -m "feat: add reactive audio and persistent battle effects"
```

---

### Task 10: Browser behavior tests and bounded stress verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/game.spec.ts`
- Create: `tests/e2e/mobile.spec.ts`
- Create: `tests/e2e/stress.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Configure production-preview Playwright**

Use `npm run build && npm run preview -- --host 127.0.0.1` as the web server, reuse only outside CI, and test Chromium desktop plus an iPhone landscape context. Capture screenshots/video only on failure and fail on `pageerror` or unexpected console errors.

- [ ] **Step 2: Write failing desktop flow tests**

Exercise menu → run, visible HUD, keyboard movement through diagnostics position change, pointer firing through projectile/shot count change, pause/resume, damage/death/results, and restart returning health and entity counts to initial values.

- [ ] **Step 3: Write failing mobile/orientation tests**

Assert portrait blocker visibility and frozen phase; landscape touch controls inside viewport/safe areas; independent two-pointer movement/aim; grenade button activation; pause button; and desktop touch chrome absence.

- [ ] **Step 4: Write failing stress test**

Use diagnostics to spawn the designed maximum horde, run bounded simulation time, assert `activeEnemies <= 150`, no uncaught errors, no continually increasing inactive pool allocation, and all active entity counts reset after restart.

- [ ] **Step 5: Make only observable-behavior fixes required by tests**

Do not add source-text, import-shape, class-name, or regex-presence assertions. Expand the diagnostics seam only with read-only user-observable state or test actions that correspond to real game transitions.

- [ ] **Step 6: Run the full browser suite and commit**

Run:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
npm run verify
```

```bash
git add playwright.config.ts tests/e2e package.json package-lock.json src
git commit -m "test: cover desktop mobile and stress gameplay"
```

---

### Task 11: Documentation, GitHub Pages workflow, and public metadata

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `vite.config.ts`
- Modify: `index.html`

- [ ] **Step 1: Configure repository-aware Vite base**

Use `/alien-shooter-containment/` in production and `/` in development. Set title, description, theme color, favicon, social-card metadata, viewport cover, and mobile-web-app capability metadata.

- [ ] **Step 2: Add Pages workflow**

Trigger on pushes to `main` and `feat/game`, plus manual dispatch. Grant `contents: read`, `pages: write`, and `id-token: write`. Use `actions/checkout`, `actions/setup-node`, `npm ci`, `npm run verify`, `npx playwright install --with-deps chromium`, `npm run test:e2e`, `actions/configure-pages`, `actions/upload-pages-artifact` for `dist`, and `actions/deploy-pages` in a `github-pages` environment with concurrency cancellation.

- [ ] **Step 3: Write public documentation**

README leads with the playable URL, concise game description, screenshot, controls table, features, local commands, architecture, original-asset policy, MIT source license, and the exact unofficial fan tribute disclaimer. It must not imply Sigma Team endorsement or claim ownership of the Alien Shooter trademark.

- [ ] **Step 4: Verify static build paths and commit**

Run:

```bash
npm run verify
npm run build
```

Inspect `dist/index.html` and confirm script/style asset URLs begin with `/alien-shooter-containment/`.

```bash
git add README.md LICENSE .github/workflows/deploy-pages.yml vite.config.ts index.html public
git commit -m "docs: prepare public GitHub Pages release"
```

---

### Task 12: Final visual QA, public repository, PR, and hosted deployment

**Files:**
- Create: `docs/screenshots/gameplay-desktop.png`
- Create: `docs/screenshots/gameplay-mobile.png`
- Modify: `README.md`

- [ ] **Step 1: Rebase/check ancestry against the live base**

Fetch `origin/main`, verify `git merge-base --is-ancestor origin/main HEAD`, inspect `git diff --stat origin/main...HEAD`, and keep the implementation diff focused.

- [ ] **Step 2: Run final clean verification**

Run:

```bash
npm ci
npm run verify
npm run test:e2e
```

Expected: every command exits zero from the feature branch.

- [ ] **Step 3: Capture canonical visual evidence**

Run the production preview, capture one 1440×900 desktop combat screenshot and one iPhone landscape combat screenshot during a representative mid-run horde, then stop the exact preview process. Inspect pixels for loading/error overlays, clipping, overlap, unreadable HUD, hidden controls, horizontal overflow, weak contrast, off-canvas touch buttons, and visual clutter. Fix and recapture until both are presentation-ready.

- [ ] **Step 4: Commit final evidence and README references**

```bash
git add docs/screenshots README.md
git commit -m "docs: add verified gameplay preview"
```

- [ ] **Step 5: Push and create the implementation PR**

Push `feat/game`, open a Conventional Commit-titled PR against `main`, include the design summary, verification commands, desktop/mobile images pinned to the current head SHA, fan-asset statement, and Pages URL. Read the PR body and head SHA back from GitHub.

- [ ] **Step 6: Configure and verify GitHub Pages**

Configure Pages for GitHub Actions if not already enabled. Let the feature-branch workflow deploy the tested artifact. Read back the Pages deployment and fetch the public URL. Exercise the hosted title screen and a started run, not only the HTTP status.

- [ ] **Step 7: Read remote checks and synchronize the PR**

Use `gh pr checks --fail-fast=false`. If a provider/account check is externally blocked while local verification passes, quote the exact blocker in the PR body. Otherwise wait boundedly for the deploy/test jobs and record their final status.

- [ ] **Step 8: Clean handoff state**

Confirm no temporary server is running, remove temporary capture scripts/files, verify `git status --short` is empty, and retain only the intentional feature worktree until the PR lifecycle is complete.

---

## Final definition of done

- The complete approved game loop is implemented and observable.
- All original-asset, accessibility, persistence, horde-cap, mobile, and boss requirements map to passing tests or inspected runtime evidence.
- `npm run verify` and Playwright pass from a clean checkout.
- Desktop and mobile screenshots show the real production build without visual defects.
- The public GitHub repository and implementation PR are readable.
- GitHub Pages serves a playable production artifact.
- Temporary servers and artifacts are removed and the worktree is clean.
