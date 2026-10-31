# Unified HUD coordinator and regression review

No remaining blocking finding in the current coordinator/code delta for the tested desktop domain. The original three P2s in `/workspace/unified-hud-independent-review.md` are resolved by current production `positionHudPanels` plus the DOMRect corrections; their original RED artifacts remain intact. Native gameplay qualification remains separate.

## Delivered regression

Created **only** `tests/UnifiedHudLayout.test.ts` in `/workspace/containment-lower-hud`; no runtime/other test edits or commits by reviewer. Uses real production markup, CSS and Vite-loaded modules in Chromium with GPU/WebGL disabled. It retains the original 180 combinations: five desktop sizes, nine corners/edges/center poses, actual long status/objective/dialogue, expanded/collapsed story, boss hidden/shown. Boss plus Room12 story is explicitly a stress combination rather than a claimed authored state.

Every repeated call must report success and retain visible in-viewport panels, no marine or pairwise panel overlap, and identical rectangles across eight calls. Tests also require sampled canvas pass-through, accessible Skip, unchanged text, resize/content changes on the same DOM, and actual main.ts capture/listener registration (game actions instrumented as counters). Native weapon/Pause/Skip click-down→relocation→up and Enter activate exactly once; paused pointer gating remains. A native mouse-drag cancellation diagnostic requires trusted pointercancel/lostpointercapture, no activation and successful subsequent click. Production nodes remain nondraggable.

Independent combined run:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx vitest run tests/UnifiedHudLayout.test.ts tests/WeaponHud.test.ts tests/StoryHudLayout.test.ts
```

**35 tests passed in 3 files**, exit0. Log `/workspace/unified-hud-combined-independent.log`. Unified-only final run22passed: `/workspace/unified-hud-repo-final-run.log`. Final `npx tsc --noEmit` also passed: `/workspace/unified-hud-test-typecheck-final.log`.

## Code and failure-path assessment

The coordinator resets its own CSS translations before measuring default positions, avoiding accumulation across frames/resizes. Each group moves its existing elements together, preserving DOM identity/focus and internal layout. Explicit plain rectangles fix the nonenumerable DOMRect spread bug in StatusHud; WeaponHud now copies mirrored top/bottom explicitly. Visible boss HUD joins status, picker/hint, ammo and vitals in the same reservation problem. Candidate placement checks actor and panel margins, then applies one complete solution. Previous placement preference and deterministic candidate order remained stable under repeated calls and resize tests.

Search is finite: five groups, a 3000 recursive-node cap, deduplicated candidates from default/edge/previous/placed-panel coordinates. This is not a complete rectangle-packing algorithm. On no solution it returns false after resetting translations and leaves default placement; main currently ignores that return. That path could expose an overlap for an untested/impossible layout, but I found no concrete supported-size failure warranting a speculative fallback redesign. In addition to the 180 regression cases, independent dense 640×360 probing covered 420 configurations (105 actor positions×expanded/collapsed×boss hidden/shown), eight calls each: **zero false returns**. Results `/workspace/unified-hud-coordinator-dense.json`. Keep any future failed native/layout case as a failure; do not treat the bounded search as a universal guarantee.

## DOM work and visual placement

There is real per-call work: clearing translations, legacy default placement, forced DOM measurement and candidate sorting/search. It is not cached away on unchanged frames. CPU-only timing over 1440 calls in the 180-case audit had initial medians about0.4ms, p95 about 0.7–0.8ms, with isolated higher outliers. A subsequent run under host load had medians 0.4–0.5ms, p95 1.9–3.7ms and a 52.3ms maximum. These measurements include synchronous DOM work and scheduling noise; they are **not** game-frame performance or evidence of a guaranteed 60fps budget. Current main can call positioning from HUD updates and rendering, so full native/browser verification remains necessary. `/workspace/audit-unified-hud-coordinator.mjs` and `/workspace/unified-hud-coordinator-timing.json` preserve the latest timing sample.

Inspected final actual DOM PNGs:

- `/workspace/unified-hud-coordinator-640x360-SE.png`: story occupies left edge, ammo right edge, picker/hint the lower-middle strip. Picker x300..540,y250..322 is a horizontal departure from a corner, but remains in the bottom region, not floating across the central gameplay view. It no longer covers story or actor. All long text/Skip remain readable.
- `/workspace/unified-hud-coordinator-1280x900-SE.png`: status stays upper left and ammo/picker/hint lower left, leaving the right-side actor clear; the center remains open.

This is a coordinated placement repair using existing DOM rather than a content/UI redesign. At short windows the HUD necessarily consumes more screen area. These static DOM images contain no enemies/environment, so they cannot certify that relocated panels never obscure gameplay elsewhere. Existing source-pinned lower-HUD native pair qualifies only its recorded poses; fresh combined-HUD native evidence is still required. No GPU renderer was launched.
