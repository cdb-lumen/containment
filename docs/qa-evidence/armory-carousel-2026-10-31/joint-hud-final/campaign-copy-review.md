# Joint HUD campaign-copy audit

Independent read-only audit 2026-10-31 of `/workspace/containment-lower-hud` at frozen `a2a3a450b43a0815e5712b30473bd575515b50c1`. No concrete supported-desktop layout defect found in the additional campaign-copy matrix. Tracked source remains unchanged (`git diff --exit-code` passed; HEAD unchanged).

## Additional coverage

Loaded the actual ROOM_STORY_ROUTE module from source and exercised all 20 room names, environments, objectives and nine authored story passages. Template names are generated from the same room names. Applied the playing-state concise status appropriate to each room, checked against DepthGame.storyStatus and main.hud. Rooms with dialogue were checked expanded and collapsed; rooms without dialogue used the production collapsed presentation.

This extends the prior Room12-only fixture with the longer Room19 objective (“Clear threats. PASSENGERS ALIVE. Overload kills everyone aboard. Explicitly choose Destroy ship.”), communications environment heading, other room copy combinations, all four family badges including their production diamond suffix, and the longer production `EMPTY · SWITCH WEAPON` prompt. Production weapon HUD displays the weapon ID, not catalog labels such as Plasma projector: `shotgun` is the longest ID and was used here.

The build text is `Kinetic 4 ◆ · Cryo 3 ◆ · Reactor 4 ◆ · Recovery 3 ◆`, deliberately a full-family layout stress fixture applied across all rooms, not a claim that this build is attainable at early rooms. Catalog family sizes are 6/5/9/4, so family counts are single digits. Boss shown/hidden is likewise a layout stress dimension, not a claim of authored bosses in these rooms. Numeric stock/ammo/credits use the prior representative fixture; this does not exhaust every accumulated resource value.

Five desktop sizes: 640×360, 600×600, 960×540, 1280×900, 1920×1080. Nine marine positions per size (corners, edge centers, center), using the existing 42×80 body-envelope fixture. Each case calls the production coordinator eight times with identical input and checks final pixel positions for stability. Real production markup, CSS and transpiled WeaponHud/StatusHud/HudLayout functions were used. Browser flags explicitly disabled GPU and WebGL; no game renderer launched. External font imports were suppressed as in prior DOM audits/native capture policy.

## Results

2,610 cases total; 522 at each size; 20,880 coordinator calls.

- Zero false returns from positionHudPanels.
- Zero pairwise visible-panel overlaps or marine overlaps.
- Zero offscreen panels or vertically clipped expanded Skip controls.
- Zero repeated-call position oscillation.
- Zero sampled read-only HUD pointer pass-through failures (elementFromPoint returns the canvas).

The measured panel set includes vitals, room heading, Pause, build, stock, story/Skip container, ammo, weapon picker, hint, and boss when shown. The actual input activation/pointer-cancel and live-resize regressions from the previous unified review remain separate evidence; this extension did not rerun activation tests or claim new native gameplay coverage.

Reproduction:

```sh
node /workspace/audit-unified-hud-long-copy.mjs
```

Script: `/workspace/audit-unified-hud-long-copy.mjs`.
Raw per-case results: `/workspace/unified-hud-long-copy-audit.json`.
Summary log: `/workspace/unified-hud-long-copy-audit.log`.

No repair recommended from this matrix. This is bounded DOM-layout evidence, not proof that every enemy/environment detail is unobscured, all resource-number widths are exhausted, every continuous actor trajectory is covered, or that external-font rendering is identical. Existing native full-encounter qualification remains necessary.
