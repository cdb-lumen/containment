# Independent status HUD code review

Reviewed the frozen uncommitted diff in `/workspace/containment-status-hud`, based on `80f080ac137cbcdb16d230a550ed3bdf6afa8c07`. No source changes or renderer/browser launch performed.

## Blocking finding

**P2 — read-only story copy now intercepts native mouse aiming and firing** — `src/style.css:71`, interacting with `src/InputController.ts:10`.

The new `#status-hud #story-hud` rule changes the entire story panel from `pointer-events:none` to `pointer-events:auto`. InputController registers mouse pointer movement and fire initiation only on the world canvas. Consequently, moving or clicking over the status, objective or dialogue copy now targets the aside/text rather than the canvas: aiming stops updating there and a new mouse press cannot start firing. This remains true after Skip, when the status/objective panel remains. Moving the panel to the opposite side of the marine does not prevent the player from aiming at an enemy behind it. Previously only the Skip button intercepted these events.

Preserve mouse pass-through over read-only copy, and scope any necessary scroll interaction deliberately. Add a regression that mounts the canvas and production HUD CSS, dispatches actual mouse movement/clicks over a non-button portion of the relocated panel, and confirms the canvas receives them; also retain the Skip checks. Current tests prove button activation but cannot detect this regression.

## Otherwise sound aspects and scope

- `StatusHud.ts` mirrors measured bounds using symmetric CSS insets, checks actual player bounds, and keeps the wider 64-pixel return margin versus the 24-pixel departure margin. It writes `data-side` only on a side change. The wrapper is moved without replacement or DOM reordering, so focus on Skip can remain intact.
- The width cap leaves a central gap; grouping build, stock and story in normal flex flow avoids the former independent fixed-row collisions. Wrapping stock and hiding an empty build strip are appropriate. The asymmetric left default/right avoidance policy matches the intended status position.
- `main.ts` computes the player bounds once per positioning call and applies positioning after renderer updates and after HUD text/visibility changes. The function declaration preceding renderer initialization is harmless because it is called later. Combat, movement, resources, camera and room geometry are unchanged.
- The extracted SafeRoomLoading harness changes only its UI adapter stub to `positionHud`; gameplay freeze/recovery assertions remain unchanged.
- Replacing exact old story coordinates with a recorded-obstruction regression is legitimate for an intentional layout repair. The tests retain visible story content and exercise widths 1280/640/960, stock wrapping, Skip mouse/Enter activation, retained focus, hysteresis and collapsed dialogue. Their Skip handler is a test listener, not the actual game skip handler, and they do not mount InputController; they must not be presented as full native input verification.

## Qualification limits

The parent reports 1098 tests plus one skip and asset/evidence/build success; I inspected source and tests rather than rerunning browser suites during the active native capture. These results do not resolve the pointer-routing finding. Two DOM rectangle reads per playing frame, and reads after HUD writes, introduce layout work; no measured performance regression is established by this review.

The change addresses the movable build/stock/story column covering the marine, including the Room6 frame199 witness. Health/armor, room label, boss HUD, weapon picker, enemy visibility and all other overlays are outside this repair. A native before/after witness and actual input checks remain necessary; this report does not qualify general HUD visibility, full encounter acceptance or human art approval.

## Follow-up: original P2 resolved in corrected source

Re-inspected the correction: `#status-hud #story-hud` now retains `pointer-events:none`, while the existing Skip button rule retains `pointer-events:auto`. This resolves the identified native hit-target regression. The new DOM regression mounts the world canvas and uses real Playwright mouse clicks over story status, objective and dialogue text; canvas mousemove/mousedown listeners must fire for each target, with observations reset between targets. Together with the existing Skip/focus tests, this meaningfully covers pass-through and the interactive exception. It tests browser hit targeting rather than production InputController dispatch, which is a reasonable boundary for this CSS fix. Parent reports five focused checks passing; no additional browser launched here.

No remaining blocking code finding in this reviewed correction. The initial native candidate ran across a source change and is excluded from qualification; a fresh source-stable corrected capture is still required. Original finding above remains recorded rather than being erased.
