# Pixel Character Skins and Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace flat procedural character textures with original retro pixel-art skins and deterministic, bounded player/enemy/boss animation.

**Architecture:** External PNG sheets load through BootScene under stable texture keys while procedural textures remain fallback. Pure animation policy functions select semantic frames and presentation offsets; Phaser adapters apply those outputs without changing authoritative physics or allocating per-enemy tweens. Existing pooled views retain ownership and fully reset presentation state on reuse.

**Tech Stack:** Phaser 4.2.1, TypeScript 6.0.3, Vite 8.1.4, Vitest, Playwright, OpenAI image generation, PNG assets.

---

## File Map

**Create:**

- `src/game/art/characterSkins.ts` — stable skin definitions, frame geometry, asset paths, and fallback mapping.
- `src/game/art/characterAnimation.ts` — pure deterministic animation policy for semantic state, frame, scale, rotation, alpha, and offsets.
- `tests/unit/characterAnimation.test.ts` — policy determinism, quality, reduced-motion/flash, and reset contracts.
- `tests/e2e/characterVisuals.spec.ts` — production asset and observable animation behavior.
- `public/assets/characters/*.png` — seven original normalized local sheets.
- `scripts/validate-character-assets.mjs` — PNG signature/dimension validation without runtime dependencies.

**Modify:**

- `src/game/art/createTextures.ts` — stable fallback keys and pixel filtering metadata.
- `src/game/scenes/BootScene.ts` — preload sheets, install sprite-sheet registrations, preserve fallback boot.
- `src/game/player/Player.ts` — player animation state, recoil/hit signals, reset/cleanup.
- `src/game/enemies/EnemyView.ts` — bounded per-slot animation state and frame application.
- `src/game/enemies/QueenBossView.ts` — queen phase motion and frame application.
- `src/game/scenes/GameScene.ts` — route fire/damage/quality/settings signals to presentation adapters.
- `src/game/diagnostics/diagnostics.ts` — development-only observable character animation summary.
- `playwright.config.ts` — route visual behavior spec to desktop project.
- `package.json` — asset validation in canonical verifier.
- `README.md` — original character-art and animation architecture documentation.

### Task 1: Character Skin Manifest and Fallback Contract

**Files:**
- Create: `src/game/art/characterSkins.ts`
- Modify: `src/game/art/createTextures.ts`
- Test: `tests/unit/characterAnimation.test.ts`

- [ ] **Step 1: Write the failing manifest tests**

Add tests asserting seven unique definitions, stable asset paths, standard/queen cell sizes, semantic frames, and fallback keys:

```ts
import { describe, expect, it } from 'vitest';
import {
  CHARACTER_SKINS,
  type CharacterSkinId,
} from '../../src/game/art/characterSkins';

const IDS: readonly CharacterSkinId[] = [
  'marine', 'crawler', 'brute', 'spitter', 'stalker', 'carrier', 'queen',
];

describe('character skin manifest', () => {
  it('defines every original character family exactly once', () => {
    expect(Object.keys(CHARACTER_SKINS)).toEqual(IDS);
    expect(new Set(Object.values(CHARACTER_SKINS).map((skin) => skin.texture)).size)
      .toBe(IDS.length);
  });

  it('uses local PNG sheets and fixed pixel cells', () => {
    for (const id of IDS) {
      const skin = CHARACTER_SKINS[id];
      expect(skin.url).toBe(`assets/characters/${id}-sheet.png`);
      expect(skin.frameWidth).toBe(id === 'queen' ? 160 : 96);
      expect(skin.frameHeight).toBe(id === 'queen' ? 160 : 96);
      expect(skin.frames).toEqual({
        idleA: 0, idleB: 1, moveA: 2, moveB: 3,
        attack: 4, hit: 5, death: 6,
      });
    }
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/unit/characterAnimation.test.ts`  
Expected: FAIL because `characterSkins.ts` does not exist.

- [ ] **Step 3: Implement the frozen manifest**

Create exported `CharacterSkinId`, `CharacterFrameName`, `CharacterSkinDefinition`, `CHARACTER_FRAME_NAMES`, and `CHARACTER_SKINS`. Use texture keys `skin-marine`, `skin-crawler`, etc. Map each definition to the existing procedural fallback texture (`marine`, `alien-runner`, `alien-brute`, `alien-spitter`, `alien-stalker`, `alien-drone`, `alien-queen`). Freeze definitions and frame maps.

- [ ] **Step 4: Preserve procedural fallbacks**

Do not remove existing definitions from `createTextures.ts`. Add `pixelArt: true` metadata only if needed by registration code; no gameplay consumer may depend on external assets being present.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- --run tests/unit/characterAnimation.test.ts`  
Expected: manifest tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/art/characterSkins.ts src/game/art/createTextures.ts tests/unit/characterAnimation.test.ts
git commit -m "feat: define character skin manifest"
```

### Task 2: Original Pixel-Art Asset Production and Validation

**Files:**
- Create: `public/assets/characters/marine-sheet.png`
- Create: `public/assets/characters/crawler-sheet.png`
- Create: `public/assets/characters/brute-sheet.png`
- Create: `public/assets/characters/spitter-sheet.png`
- Create: `public/assets/characters/stalker-sheet.png`
- Create: `public/assets/characters/carrier-sheet.png`
- Create: `public/assets/characters/queen-sheet.png`
- Create: `scripts/validate-character-assets.mjs`
- Modify: `package.json`

- [ ] **Step 1: Generate original master sheets**

Use image generation with a single coherent prompt family. Every prompt must require:

```text
Original top-down retro science-fiction horror pixel art sprite sheet, transparent background,
limited palette graphite/oxidized-blue/bone/olive/acid-chartreuse/orange/cyan, hard pixel edges,
no anti-aliasing, no text, no logo, no UI, no floor, no shadow outside the sprite, weapon/head faces right,
seven evenly spaced horizontal animation cells: idle A, idle B, move A, move B, attack, hit, death.
Do not imitate or reproduce any existing game character or asset.
```

Add the character-specific silhouette from the approved design. Generate standard units in a 7:1 composition and queen at 7:1 with larger detail.

- [ ] **Step 2: Normalize each generated asset**

Use a local image script or ImageMagick to:

1. remove any nontransparent background;
2. crop source cells consistently;
3. place standard frames in 96×96 cells on a 672×96 transparent canvas;
4. place queen frames in 160×160 cells on a 1120×160 canvas;
5. preserve nearest-neighbor pixels;
6. ensure the intended pivot is cell center;
7. save as 8-bit RGBA PNG.

- [ ] **Step 3: Add a dependency-free PNG validator**

`scripts/validate-character-assets.mjs` must read each file, verify the eight-byte PNG signature, parse IHDR width/height, and compare against manifest-equivalent expected dimensions:

```js
const expected = new Map([
  ['marine-sheet.png', [672, 96]],
  ['crawler-sheet.png', [672, 96]],
  ['brute-sheet.png', [672, 96]],
  ['spitter-sheet.png', [672, 96]],
  ['stalker-sheet.png', [672, 96]],
  ['carrier-sheet.png', [672, 96]],
  ['queen-sheet.png', [1120, 160]],
]);
```

It must exit nonzero for missing, non-PNG, or wrong-sized assets and print one concise line per valid file.

- [ ] **Step 4: Verify validator failure before final normalization**

Run: `node scripts/validate-character-assets.mjs`  
Expected: FAIL until every expected asset exists at the exact size.

- [ ] **Step 5: Verify all assets**

Run: `node scripts/validate-character-assets.mjs`  
Expected: seven `valid character sheet:` lines and exit 0.

- [ ] **Step 6: Add validation to scripts**

Update `package.json`:

```json
"validate:assets": "node scripts/validate-character-assets.mjs",
"verify": "npm run validate:assets && npm run lint && npm run test && npm run test:e2e"
```

- [ ] **Step 7: Commit**

```bash
git add public/assets/characters scripts/validate-character-assets.mjs package.json
git commit -m "feat: add original pixel character sheets"
```

### Task 3: Pure Deterministic Animation Policy

**Files:**
- Create: `src/game/art/characterAnimation.ts`
- Modify: `tests/unit/characterAnimation.test.ts`

- [ ] **Step 1: Write failing policy tests**

Cover:

- stable `animationPhaseForId(id)` in `[0, 1)`;
- idle alternation at 2.5 Hz;
- movement alternation at family-specific cadence;
- attack and hit override idle/move for bounded windows;
- death always selects death frame;
- reduced motion zeroes bob/scale/secondary rotation while preserving frame communication;
- low quality disables shimmer and secondary pulse only;
- reduced flash makes hit brightness `0` without changing hit frame;
- nonfinite time/velocity inputs produce finite defaults.

Use explicit expected values, for example:

```ts
const result = characterAnimation({
  skin: 'crawler', entityId: 7, nowMs: 400,
  velocityX: 120, velocityY: 0,
  attackUntilMs: 0, hitUntilMs: 0, dead: false,
  quality: 'high', reducedMotion: false, reducedFlash: false,
});
expect(result.frame).toBe('moveB');
expect(Number.isFinite(result.offsetY)).toBe(true);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/unit/characterAnimation.test.ts`  
Expected: FAIL because policy exports do not exist.

- [ ] **Step 3: Implement immutable inputs and outputs**

Define:

```ts
export type CharacterAnimationInput = Readonly<{
  skin: CharacterSkinId;
  entityId: number;
  nowMs: number;
  velocityX: number;
  velocityY: number;
  attackUntilMs: number;
  hitUntilMs: number;
  dead: boolean;
  quality: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  reducedFlash: boolean;
}>;

export type CharacterAnimationOutput = Readonly<{
  frame: CharacterFrameName;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  rotationOffset: number;
  emissiveAlpha: number;
  hitBrightness: number;
}>;
```

Use arithmetic and `Math.sin`; allocate no arrays/objects inside view loops beyond the returned output. If profiling shows output allocation material, provide `writeCharacterAnimation(output, input)` with a reusable mutable output.

- [ ] **Step 4: Implement family motion profiles**

Use frozen profiles for idle/move cadence and amplitudes. Brute cadence is slowest; crawler fastest; stalker shimmer depends on stable phase; carrier separates bob and step phase; queen uses lower-frequency breathing.

- [ ] **Step 5: Verify GREEN and full unit baseline**

Run: `npm test -- --run tests/unit/characterAnimation.test.ts`  
Expected: PASS.  
Run: `npm test`  
Expected: all existing 226 tests plus new policy tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/art/characterAnimation.ts tests/unit/characterAnimation.test.ts
git commit -m "feat: add deterministic character animation policy"
```

### Task 4: Boot Loading With Procedural Fallback

**Files:**
- Modify: `src/game/scenes/BootScene.ts`
- Modify: `src/game/art/characterSkins.ts`
- Modify: `tests/unit/shell.test.ts`

- [ ] **Step 1: Add failing boot contract tests**

Extract a pure `resolveLoadedCharacterTexture(textures, skin)` helper or test a texture-registration function with a narrow fake. Assert:

- loaded sheet wins;
- missing sheet returns fallback key;
- registering twice does not throw or duplicate animation definitions;
- nearest-neighbor filtering is requested for loaded character textures.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/unit/shell.test.ts`  
Expected: new tests FAIL.

- [ ] **Step 3: Preload sheets in BootScene**

For each `CHARACTER_SKINS` definition call:

```ts
this.load.spritesheet(skin.texture, skin.url, {
  frameWidth: skin.frameWidth,
  frameHeight: skin.frameHeight,
});
```

Attach a load error listener that records failed character keys without throwing. After preload, set `Phaser.Textures.FilterMode.NEAREST` for available sheets. Do not block the MenuScene transition when an asset fails.

- [ ] **Step 4: Add texture resolver**

Export a pure resolver returning `{ texture, framed }`; consumers use frame indices only when `framed` is true. Fallback textures remain frame-less.

- [ ] **Step 5: Verify GREEN and production build**

Run: `npm test -- --run tests/unit/shell.test.ts`  
Expected: PASS.  
Run: `npm run build`  
Expected: build succeeds and `dist/assets/characters/` contains all seven PNGs.

- [ ] **Step 6: Commit**

```bash
git add src/game/scenes/BootScene.ts src/game/art/characterSkins.ts tests/unit/shell.test.ts
git commit -m "feat: load pixel skins with fallback textures"
```

### Task 5: Player Skin and Animation Integration

**Files:**
- Modify: `src/game/player/Player.ts`
- Modify: `src/game/scenes/GameScene.ts`
- Modify: `src/game/diagnostics/diagnostics.ts`
- Modify: `tests/unit/restart.test.ts`

- [ ] **Step 1: Add failing player presentation-state tests**

Extract `PlayerAnimationState` if necessary. Prove:

- `triggerRecoil(now)` sets a bounded attack window;
- `triggerHit(now)` sets a bounded hit window;
- `reset()` clears recoil/hit windows and restores default frame/transforms;
- `stop()` changes locomotion to idle without destroying aim;
- reduced motion suppresses bob but keeps move frame selection.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/unit/restart.test.ts`  
Expected: FAIL for missing animation API.

- [ ] **Step 3: Resolve player skin on construction**

Use the loaded marine sheet when available, otherwise `TEXTURE_KEYS.marine`. Preserve 54px display size, body circle, collision offset, depth, and local-positive-X aim convention.

- [ ] **Step 4: Apply animation without changing physics**

Store authoritative aim rotation separately. In `applyInput`, select animation output from movement velocity and current presentation impulses. Apply sheet frame and bounded visual scale/offset while body position and collision remain unchanged. If using one physics image, never offset the physics object; place visual animation on a child image/container only if offsets would otherwise alter body coordinates.

Preferred safe structure:

- physics image remains invisible or minimally rendered at authoritative coordinates;
- child visual image follows body position each update;
- existing `player.sprite` overlap contract remains unchanged;
- muzzle flash follows authoritative aim plus visual weapon muzzle offset.

- [ ] **Step 5: Route fire and damage events**

Call `player.triggerRecoil(this.time.now)` only when a real shot is accepted. Call `player.triggerHit(this.time.now)` only when player damage is applied. Do not trigger from held input when cooldown rejects fire.

- [ ] **Step 6: Extend development diagnostics**

Expose a frozen animation summary: `playerFrame`, `playerAnimating`, and current skin key. Keep it under existing development-only diagnostics.

- [ ] **Step 7: Verify GREEN and restart browser behavior**

Run: `npm test -- --run tests/unit/restart.test.ts`  
Expected: PASS.  
Run: `npx playwright test tests/e2e/desktop.spec.ts --project=desktop-chromium --grep "restart isolation"`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/game/player/Player.ts src/game/scenes/GameScene.ts src/game/diagnostics/diagnostics.ts tests/unit/restart.test.ts
git commit -m "feat: animate the containment marine"
```

### Task 6: Standard Enemy Pooled Animation

**Files:**
- Modify: `src/game/enemies/EnemyView.ts`
- Modify: `src/game/enemies/EnemySystem.ts` only if snapshots need an existing attack/death presentation signal
- Modify: `tests/unit/enemyBehavior.test.ts`
- Modify: `tests/unit/pools.test.ts`

- [ ] **Step 1: Write failing pool-reset and state tests**

Test a pure slot state or exported reset helper. On release/reacquire assert:

- previous health becomes current health;
- hit/attack windows are cleared;
- frame resets to idle/move for new enemy;
- scale, alpha, tint, rotation offset, and flip reset;
- deterministic phase derives from new enemy ID;
- active slot count never exceeds 150.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/unit/enemyBehavior.test.ts tests/unit/pools.test.ts`  
Expected: new tests FAIL.

- [ ] **Step 3: Add bounded slot presentation state**

Maintain one state record per active pooled sprite in a `Map<EnemyImage, EnemyPresentationState>` or parallel fixed pool metadata. No state survives `deactivate`. Do not allocate tweens/timers.

- [ ] **Step 4: Detect hit and movement from snapshots**

When health decreases, set `hitUntilMs = now + 90`. Select movement from finite velocity. Use existing attack/projectile events if available; otherwise limit this task to locomotion/hit and add attack recoil only through an explicit existing runtime callback—never infer attacks from arbitrary timers.

- [ ] **Step 5: Apply framed or fallback presentation**

Resolve skin by type:

- crawler → crawler
- brute → brute
- spitter → spitter
- stalker → stalker
- carrier → carrier

Set frames only for loaded sheets. Preserve display sizes, elite scaling/tint semantics, body radius, overlap IDs, active positions, and overlay bars.

- [ ] **Step 6: Ensure transforms do not mutate collision**

If bob/scale offsets would affect the Arcade body, split each slot into an authoritative body image plus a following visual image. Keep the group and `enemyIdFor()` bound to body objects. Pool both visual and body ownership together with no extra unbounded displays.

- [ ] **Step 7: Verify GREEN and stress**

Run: `npm test -- --run tests/unit/enemyBehavior.test.ts tests/unit/pools.test.ts`  
Expected: PASS.  
Run: `npx playwright test tests/e2e/desktop.spec.ts --project=desktop-chromium --grep "horde cap" --repeat-each=5`  
Expected: five PASS results, capacity ≤150, no browser errors.

- [ ] **Step 8: Commit**

```bash
git add src/game/enemies/EnemyView.ts src/game/enemies/EnemySystem.ts tests/unit/enemyBehavior.test.ts tests/unit/pools.test.ts
git commit -m "feat: animate pooled alien families"
```

### Task 7: Queen Skin and Phase Animation

**Files:**
- Modify: `src/game/enemies/QueenBossView.ts`
- Modify: `src/game/enemies/QueenBossSystem.ts` only for existing phase/attack signal plumbing
- Modify: `tests/unit/boss.test.ts`

- [ ] **Step 1: Write failing queen presentation tests**

Cover frame/secondary motion by phase, armor/core hit independence, reduced motion, reduced flash, death state, reset, and shutdown cleanup. Assert no presentation operation changes queen/nest knockback or collision state.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/unit/boss.test.ts`  
Expected: new tests FAIL.

- [ ] **Step 3: Resolve queen sheet and semantic frames**

Use the 160px sheet with existing world display dimensions. Preserve all boss pool targets, nests, overlap resolution, armor/core routing, and depth.

- [ ] **Step 4: Apply phase motion**

Use pure policy outputs for breathing and emissive cadence. Phase escalation may increase cadence and emissive alpha but must respect reduced motion/flash and quality. Track any boss-only tween explicitly; prefer time math to avoid lifecycle risk.

- [ ] **Step 5: Reset and terminal cleanup**

On reset/death/shutdown restore frame, alpha, tint, scale, rotation offset, and tracked signal windows. Death animation must not survive terminal transition or restart.

- [ ] **Step 6: Verify GREEN**

Run: `npm test -- --run tests/unit/boss.test.ts`  
Expected: PASS.  
Run: `npm test -- --run tests/unit/restart.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/game/enemies/QueenBossView.ts src/game/enemies/QueenBossSystem.ts tests/unit/boss.test.ts
git commit -m "feat: animate the teleporter queen"
```

### Task 8: Accessibility, Quality, and Pause/Portrait Animation Lifecycle

**Files:**
- Modify: `src/game/scenes/GameScene.ts`
- Modify: `src/game/art/characterAnimation.ts`
- Modify: `tests/unit/characterAnimation.test.ts`
- Modify: `tests/e2e/mobile.spec.ts`

- [ ] **Step 1: Add failing lifecycle tests**

Unit tests prove reduced motion and reduced flash remain independent. Browser tests sample diagnostics before/during/after pause and portrait rotation:

- animation clock/frame does not advance while paused;
- portrait suspension freezes animation;
- resume continues without a large phase jump;
- changing reduced-motion setting applies immediately;
- restart resets animation phase signals.

- [ ] **Step 2: Verify RED**

Run focused unit and mobile Playwright commands.  
Expected: new assertions FAIL before lifecycle wiring.

- [ ] **Step 3: Use gameplay elapsed time, not wall time**

Drive animation from a scene-owned elapsed presentation clock that advances only during active gameplay. Pause, focus loss, and portrait suspension must stop it. Reset sets it to zero. This avoids resume jumps.

- [ ] **Step 4: Route quality/settings changes**

Read canonical registry settings and active quality. Apply reduced motion, reduced flash, and quality on the next sync without rebuilding pools or sheets.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- --run tests/unit/characterAnimation.test.ts`  
Expected: PASS.  
Run: `npx playwright test tests/e2e/mobile.spec.ts --project=mobile-chromium`  
Expected: all mobile tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/scenes/GameScene.ts src/game/art/characterAnimation.ts tests/unit/characterAnimation.test.ts tests/e2e/mobile.spec.ts
git commit -m "fix: respect animation accessibility lifecycle"
```

### Task 9: Production Character Visual Behavior Coverage

**Files:**
- Create: `tests/e2e/characterVisuals.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `src/game/diagnostics/diagnostics.ts`

- [ ] **Step 1: Add failing production asset test**

Against the Pages-subpath server, request all seven manifest URLs and assert:

- HTTP 200;
- `content-type: image/png`;
- nonzero body;
- production diagnostics absent.

- [ ] **Step 2: Add observable animation test**

In the development project:

1. deploy;
2. record player frame/transform summary;
3. hold movement;
4. assert frame/animation state changes;
5. fire and assert accepted recoil state;
6. fast-forward to mixed enemies through existing diagnostics;
7. assert at least three distinct loaded skin keys are active;
8. restart and assert default state.

Assertions target observable diagnostics/state, never source text, import names, or regex implementation shape.

- [ ] **Step 3: Route the spec**

Add a `character-visuals-chromium` project or include the spec in the existing desktop project without causing duplicate execution. Use one worker and existing deterministic server setup.

- [ ] **Step 4: Verify tests**

Run: `npm run test:e2e`  
Expected: all prior tests plus character visual tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/characterVisuals.spec.ts playwright.config.ts src/game/diagnostics/diagnostics.ts
git commit -m "test: cover character skins and animation behavior"
```

### Task 10: Documentation, Full Verification, and Visual QA

**Files:**
- Modify: `README.md`
- Temporary only: `/tmp/alien-character-visual-qa.cjs`, `/tmp/alien-character-*.png`

- [ ] **Step 1: Document original art and animation architecture**

Add concise README sections explaining:

- all character art is original and generated/finished for this project;
- no original Alien Shooter assets are included;
- local sprite sheets use procedural fallbacks;
- deterministic presentation remains separate from gameplay;
- asset validator and visual tests are part of `npm run verify`.

- [ ] **Step 2: Run canonical verification**

Run:

```bash
npm run verify
git diff --check
git status --short --branch
```

Expected: asset validation PASS; all unit/E2E tests PASS; build PASS; clean diff check; only intended files modified.

- [ ] **Step 3: Run raw browser screenshot matrix**

Start the production preview under tracked process control. Capture:

- player idle close-up;
- player moving/firing;
- dense mixed horde near capacity;
- queen fight;
- mobile landscape;
- reduced-motion mode.

Keep scripts/screenshots under `/tmp` only.

- [ ] **Step 4: Inspect pixels and correct defects**

Check transparent edges, nearest-neighbor filtering, frame alignment, pivot wobble, silhouettes, floor contrast, hit flashes, mobile scale, control/HUD overlap, queen readability, and horde noise. Correct all concrete defects and recapture affected states.

- [ ] **Step 5: Independent review**

Dispatch specification and code-quality reviewers focused on:

- originality/local asset policy;
- pool/reset/shutdown safety;
- no animation-to-gameplay coupling;
- 150-enemy bounded cost;
- reduced-motion/flash independence;
- production asset paths;
- tests proving behavior rather than source shape.

Apply valid findings and rerun canonical verification.

- [ ] **Step 6: Commit final polish**

```bash
git add README.md <review-fix-files>
git commit -m "docs: document original pixel character art"
```

### Task 11: PR, CI, Pages Deployment, and Hosted Verification

**Files:** none expected beyond review fixes.

- [ ] **Step 1: Rebase/freshness check**

Run:

```bash
git fetch origin --prune
git rev-list --left-right --count origin/main...HEAD
git status --short --branch
```

Resolve base drift without rewriting unrelated history.

- [ ] **Step 2: Push and open PR**

Push `feat/pixel-skins-animation`; create a PR documenting art direction, asset sizes, animation architecture, test totals, stress evidence, and screenshot matrix.

- [ ] **Step 3: Wait for CI and review GitHub-side state**

Require `verify` success and a mergeable clean PR. Fix any GitHub-only failure and rerun locally before pushing.

- [ ] **Step 4: Merge and watch Pages**

Merge through GitHub after checks pass. Watch the Pages workflow for the exact merge SHA until build and deploy succeed.

- [ ] **Step 5: Hosted QA**

At `https://cdb-lumen.github.io/alien-shooter-containment/` verify:

- HTML, JS, CSS, and all seven PNGs return 200;
- PNG content types are correct;
- player/mixed horde/queen render;
- desktop pause and restart work;
- mobile landscape controls remain ≥48×48;
- portrait blocker remains inert/hidden correctly;
- persistence survives reload;
- zero page/console errors.

- [ ] **Step 6: Clean handoff**

Fast-forward primary `main`, remove merged feature worktree/branches, stop servers, delete `/tmp` QA artifacts, and report repository, PR, deployment, merge SHA, CI, test totals, visual QA, and any advisory-only warnings.
