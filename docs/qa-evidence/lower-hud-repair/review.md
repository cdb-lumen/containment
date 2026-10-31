# Shared lower HUD independent review

Reviewed uncommitted three-file change in `/workspace/containment-lower-hud` on 2026-10-31. Read AGENTS.md. No runtime edits or GPU renderer launched; browser checks disabled GPU and WebGL.

## P2: moving the interactive picker can cancel a native click

`src/WeaponHud.ts:25` changes the weapon picker's side immediately, including between pointer down and pointer up. Production `src/main.ts:52` switches weapons on `click`; it does not capture or preserve an in-progress pointer gesture. A weapon button that moves away before release no longer receives that click.

Independent real-DOM reproduction `/workspace/check-lower-hud.mjs`, desktop 960×540, body state `playing`: position the marine just outside the picker union's 24px switching margin, press the Rifle button with native `page.mouse.down()`, advance the body only two pixels across the threshold, call production positioning, then native mouse up at the original pointer location. The picker moves right→left and the button's click listener receives **zero clicks**. This requires neither a teleport nor a large single-frame movement. Existing keyboard focus is retained and Enter subsequently activates the same button, so this is specifically a mouse gesture regression.

Preserve the pressed control's activation through relocation, using explicit pointer gesture handling/capture with correct cancel/release behavior, while retaining marine clearance. Add a real down→small body movement→up regression. Do not solve this by removing mouse activation or the visibility assertion.

The new DOM test currently never sets body state `playing`, clicks a weapon, or asserts focus/activation. The existing nonplaying CSS disables HUD button pointer events, so passing those box checks does not establish the interactive behavior.

## Placement and scope observations

The proposed CSS constrains picker/hint width to a half-window corner, wraps buttons, and positions ammo above the measured picker. Mirroring moves existing DOM nodes rather than replacing them: labels, semantic button roles, order and keyboard focus remain. Read-only hint/ammo retain inherited pointer pass-through; existing nonplaying button disabling remains intact. No gameplay, camera or resource values change.

Independent scan of 40×80 synthetic marine bounds in 20px increments at 600×600, 640×360, 960×540 and 1280×900 found no marine intersection with ammo, picker or hint. This exercises corner transitions and narrow/short desktop windows, not a phone requirement. It is a finite geometry scan and does not certify all fonts, window sizes, overlaps with other HUD columns, or actual game framing. Button focus followed by relocation and native Enter retained activation.

Independent focused run:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx vitest run tests/WeaponHud.test.ts
```

Eight tests passed; log `/workspace/lower-hud-independent-tests.log`. Those successes do not resolve the reproduced click loss. The fixed Armory weapon-picker obstruction still requires a fresh source-pinned native witness/full recording after repair; original failed frame746 and remote evidence bb97963 remain failed evidence. Full required desktop verification remains separate.

## Follow-up: lost-click P2 resolved with native pointer capture

Reviewed the added exported `captureWeaponPointer` and startup registration on every weapon button. It captures only primary mouse presses, leaves the production click handler and its readiness checks intact, and does not synthesize activation. Browser pointer release/cancellation owns capture cleanup. Existing DOM nodes, keyboard semantics and focus remain unchanged.

Independent exact two-pixel threshold reproduction with the production handler now produces exactly one native click after right→left relocation. Enter adds one activation, an ordinary stationary click adds one, and normal activation continues after cancellation. Script `/workspace/check-lower-hud-capture.mjs`; results `/workspace/lower-hud-pointer-capture-repro.log`. Original failing script/log remain unchanged.

Cancellation was tested with a genuine browser-generated mouse `pointercancel`: the isolated DOM diagnostic temporarily makes the target draggable, then performs native mouse down/movement/release. This is explicitly a cancellation trigger in the diagnostic, not a change to production buttons or a phone/touch test. Recorded trusted events are `gotpointercapture`, `pointercancel`, `lostpointercapture`; click count remains unchanged during cancellation. A subsequent normal click succeeds exactly once. Thus cancellation does not cause synthetic activation or leave stale capture in the tested Chromium.

The updated repository test sets playing state, installs the production handler, checks native down→relocation→up activation, Enter activation and paused pointer gating. Original layout/resize/hysteresis assertions remain. Independent rerun passed all eight tests; log `/workspace/lower-hud-capture-independent-tests.log`.

P2 is **resolved**. No remaining blocking finding in this code/test delta. This does not replace fresh source-pinned Armory native qualification or required full desktop verification, and does not relabel the preserved frame746 failure.
