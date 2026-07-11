# Alien Shooter: Containment — Pixel Skins and Animation Design

**Date:** 2026-07-11  
**Status:** Approved for planning  
**Branch:** `feat/pixel-skins-animation`

## Objective

Replace the current flat, single-frame procedural player and monster presentation with original, high-detail retro pixel-art skins and more expressive animation while preserving deterministic gameplay, collision geometry, 150-enemy capacity, adaptive-quality behavior, restart safety, accessibility, and GitHub Pages deployment.

The change is presentation-only. Domain combat, movement, wave, boss, scoring, and capacity models remain authoritative.

## Visual Direction

The game will use crisp top-down pixel horror with a limited industrial palette:

- graphite `#111923`
- oxidized blue `#29485b`
- bone `#d8d2bd`
- chitin olive `#6f8745`
- acid chartreuse `#b6e35f`
- warning orange `#f39237`
- containment cyan `#69d8e7`

Pixel edges remain sharp through nearest-neighbor sampling. Internal highlights and shadows may use palette ramps, but gradients, painterly blur, anti-aliased outlines, and photorealistic rendering are excluded.

## Art Production Strategy

Use a hybrid workflow:

1. Generate original master character concepts with the configured image-generation backend.
2. Select and clean one coherent player sheet and one coherent monster-family sheet.
3. Normalize assets into transparent local PNG files with fixed frame geometry.
4. Derive a small number of stable frame variants from those masters.
5. Add deterministic runtime motion through layered offsets, scale, rotation, alpha, and frame selection.
6. Retain procedural fallback textures for load failure and automated non-asset environments.

Generated source material must not imitate or copy Alien Shooter assets, characters, logos, maps, or recognizable proprietary designs. The visual language may evoke retro top-down science-fiction horror only through original silhouettes and palette choices.

## Character Designs

### K-17 Containment Marine

- compact cobalt and graphite powered armor
- bone helmet shell with a narrow cyan visor
- orange hazard stripe on one shoulder
- asymmetrical backpack and weapon silhouette
- readable torso, shoulder, leg, and firearm separation
- firearm points along local positive X so existing aim rotation remains correct

The player must remain legible at a 54px display size and against dark facility flooring.

### Crawler

- low six-limbed hunter
- long wedge skull
- narrow olive body and pale teeth/mandible accent
- alternating fore/hind gait emphasizes speed

### Brute

- broad armored carapace
- oversized forelimbs and heavy shoulders
- short head recessed into the torso
- compressed stride and weighty recovery

### Spitter

- narrow limbs around a swollen luminous acid sac
- visible jaw/nozzle direction
- sac brightens before or during ranged activity

### Stalker

- angular blade limbs
- near-black chitin with sparse cyan edge organs
- restrained intermittent shimmer; never continuous noisy flicker

### Carrier

- elevated brood abdomen
- smaller parasite shapes visible beneath the shell
- slower abdomen bob distinct from leg movement

### Queen

- 128px-class master art
- asymmetric crown and multiple leg segments
- armored outer shell with exposed acid/orange core accents
- phase-dependent emissive treatment
- silhouette remains readable when nests, hazards, projectiles, and effects are active

## Asset Contract

Assets will live under `public/assets/characters/` and load through the boot scene.

Planned files:

- `marine-sheet.png`
- `crawler-sheet.png`
- `brute-sheet.png`
- `spitter-sheet.png`
- `stalker-sheet.png`
- `carrier-sheet.png`
- `queen-sheet.png`

Standard sheets use fixed 96×96 cells. Queen sheets use fixed 160×160 cells. Transparent padding must be symmetrical around the intended rotation pivot. Each sheet uses a horizontal layout with these semantic frames where applicable:

1. idle A
2. idle B
3. move A
4. move B
5. attack/recoil
6. hit
7. death/collapse

If a generated sheet cannot maintain coherent anatomy across seven cells, the accepted master may use fewer authored cells and derive the remaining motion through deterministic runtime transforms. Frame count is an implementation detail; semantic states are required.

Texture registration must be idempotent. Boot failure or missing files must fall back to current procedural textures rather than preventing play.

## Runtime Architecture

### Texture ownership

`BootScene` loads external character assets and calls the existing procedural texture factory after load resolution. The texture module exposes stable keys and frame metadata. Views consume only stable keys and semantic animation state.

### Player presentation

`Player` remains the physics and movement owner. A small presentation controller may be introduced to track:

- moving vs idle
- aim direction
- recoil impulse
- damage reaction
- reset/destroy lifecycle

Animation never changes the Arcade body, position model, speed, or aim calculation. Recoil and gait are visual transforms applied around the authoritative body position.

### Enemy presentation

`EnemyView` remains pooled and snapshot-driven. It stores bounded per-slot presentation state alongside the existing sprite-to-ID maps:

- deterministic phase seed derived from enemy ID
- previous health for hit detection
- previous position/velocity for movement state
- current semantic frame state
- death presentation only if it can remain bounded within existing effect policy

No per-enemy Phaser tween or timer may be allocated during normal horde synchronization. Frame selection and secondary transforms use scene time plus deterministic phase seeds.

Pooling must completely reset texture, frame, tint, alpha, rotation, scale, flip, and presentation state on release/reacquisition.

### Queen presentation

The queen view may use richer phase motion because the boss pool is bounded to seven objects. Even there, all tweens/timers must be tracked and stopped during reset and scene shutdown.

## Animation Behaviors

### Player

- idle: two-frame breathing, subtle armor-light pulse
- movement: alternating gait and 1–2px body bob
- firing: short shoulder/weapon recoil impulse
- damage: brief palette flash and directional lean
- reset: frame, scale, rotation offset, alpha, and recoil state return to defaults

### Standard enemies

- crawler: rapid alternating gait and low body oscillation
- brute: slow compression, heavy forward lean, small recovery overshoot
- spitter: acid sac pulse and attack recoil
- stalker: blade stride with deterministic cyan shimmer
- carrier: leg cycle separated from abdomen bob
- hit: short readable flash without changing simulation knockback
- death: visual collapse routed through the bounded effects/death presentation path

### Queen

- idle breathing and alternating leg phase
- attack anticipation and recovery
- armor/core hit responses
- stronger emissive pulse by boss phase
- death collapse that cannot outlive terminal transition cleanup

## Quality and Performance

At 150 active enemies:

- no unbounded arrays, timers, tweens, emitters, or display objects
- no new object allocation per enemy per frame where avoidable
- no gameplay state changes caused by presentation quality
- high quality uses authored frames plus secondary motion
- medium may reduce secondary pulse/shimmer cadence
- low keeps frame animation and silhouette readability but disables nonessential secondary transforms

The existing adaptive-quality controller remains one-way within a run and presentation-only.

## Reduced Motion and Flash

- reduced motion disables nonessential bob, breathing scale, shimmer displacement, and death overshoot
- locomotion frame changes remain because they communicate movement, but cadence may be reduced
- reduced flash suppresses bright hit/emissive flashes independently
- reduced shake remains zero camera shake and is unaffected by character animation

## Testing

### Unit and source-level contracts

- character asset definitions are complete and unique
- semantic frame selection is deterministic
- animation phase seeds are stable by entity ID
- reduced-motion and reduced-flash policies are independent
- pooled enemy presentation state resets fully
- player reset clears recoil/hit/animation state
- missing asset fallback preserves boot

### Browser behavior

- generated assets return HTTP 200 with PNG content type under the Pages subpath
- player and at least five enemy family textures render in a real run
- movement and firing produce observable animation changes
- portrait suspension freezes presentation progression
- pause freezes presentation and resumes without a jump
- restart does not inherit old frames, transforms, hit flashes, or death effects
- sustained horde run remains within capacity and without browser errors

### Visual QA

Capture and inspect:

- desktop player idle/movement/firing
- dense mixed horde
- queen fight
- mobile landscape with touch controls
- reduced-motion mode
- production build and hosted Pages deployment

Evaluate silhouette separation, contrast, animation readability, clipping, pivot wobble, texture filtering, HUD/control overlap, and visual noise at horde density.

## Release Requirements

- all artwork original and local
- no remote fonts, images, audio, or runtime asset dependencies
- canonical verification passes
- independent specification and code-quality review completed
- PR checks pass before merge
- Pages deployment succeeds
- hosted browser QA has zero page/console errors

## Non-Goals

- changing combat balance, hitboxes, speeds, wave counts, or enemy capacity
- skeletal animation middleware
- WebGL shaders required for correctness
- cosmetic selection UI or monetized skins
- copied tribute-game art or branding
- replacing facility, HUD, projectile, pickup, or audio assets in this scope
