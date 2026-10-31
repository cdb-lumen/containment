# Unified desktop HUD independent audit

Reviewed PR125 source `06893a11887d33266b306e44c711a1b396b90d46` in `/workspace/containment-lower-hud`. **Shared HUD qualification has unresolved findings below**, despite the separately valid lower-control static witness. No shipping edits or game renderer; actual Chromium DOM with GPU/WebGL disabled.

Reproduction: `/workspace/audit-unified-hud.mjs`; raw rectangles/states `/workspace/unified-hud-audit.json`; summary `/workspace/unified-hud-audit.log`. Uses production main HUD markup, production CSS (external font import suppressed), compiled production placement functions in main's order, actual long Room12 status/objective/dialogue, full stock/build copy, all five weapons. Tests 180 layouts: five sizes (640×360,600×600,960×540,1280×900,1920×1080), nine representative 42×80 actor envelopes, expanded/collapsed dialogue and boss shown/hidden, eight positioning calls per pose. Boss+Room12-dialogue combination is explicitly a stress layout, not a claim such a game state occurs; boss findings below also occur with dialogue collapsed and do not depend on its text. Actor boxes are representative screen-space probes, not reconstructed historical/native projections.

## P2 — independent panel placement makes other HUD content unreadable

At **640×360, expanded dialogue, SE actor** (left579,right621,top260,bottom340), status stays left and picker mirrors left. The picker covers the objective/dialogue area: `#story-hud` versus `#weapon-picker` intersection 17,280 px². Actual DOM screenshot `/workspace/unified-hud-640x360-SE.png` visibly shows weapon buttons over text. At NW/W/SW, stock and story also overlap ammo. At **960×540 expanded dialogue, NW/W/E**, story and ammo intersect by 5,121.09375 px².

Affected policies are `src/WeaponHud.ts:19–27`, `src/StatusHud.ts:4–13`, and separate fixed heights/top limits in `src/style.css:65–91`. They avoid the actor independently, with no shared reservation for each other. Repair with coordinated panel-space allocation or an explicit compact layout that preserves readable status/objective/Skip and weapon input. A scrollable story region must be bounded by the actually occupied lower HUD, not only a fixed viewport subtraction. Retain all actor-clearance and click-safety assertions.

## P2 — status column oscillates on identical repeated calls

At **600×600 north-center actor** (279..321,20..100), status alternates right/left on every call; similarly at600 center and640 north/center/south. Eight calls with unchanged inputs reproduce the movement. Root cause: `positionStatusHud` leaves `left` as native DOMRect in its left state, then spreads it to construct `right`. DOMRect coordinates are nonenumerable, so top/bottom vanish in that branch; the right-side overlap test falsely reports clear. The next call from the right state explicitly reconstructs top/bottom and returns left.

Independent diagnostic-only control converts the measured rect to a plain object before mirroring; oscillating cases fall from12→0 at640 and8→0 at600 without changing layout. Script/results `/workspace/audit-unified-hud-domrect-control.mjs`, `/workspace/unified-hud-domrect-control.json`, `/workspace/unified-hud-domrect-control.log`. No shipping source was edited. Audit the similar spread in `weaponHudSide` as well: it can receive a native panel DOMRect through `positionWeaponHud`, although the new picker union is already a plain object.

## P2 — boss HUD is outside shared clearance and overlaps both actor and controls

The fixed `#boss-hud` intersects representative north-center marine bounds at640×360,960×540,1280×900,1920×1080, including collapsed-dialogue cases. At1280 its box is x500..780,y27..51 while the actor is x619..661,y20..100. At600×600 its y116..140 box overlaps Pause by304 px² and build strip by354 px², with dialogue collapsed. These are layout defects independent of the long dialogue. Add the actual boss HUD to the coordinated placement/visibility policy and validate with a legal production boss-room native pose before claiming the gameplay manifestation is resolved.

## Other results and limits

All recorded top-level HUD boxes stay within the viewport for the tested probes; no Skip clipping was found in these cases. Read-only text-center hit tests for vitals, room label, build, stock, ammo, hint, status and objective returned the canvas throughout. This checks pointer pass-through at sampled centers, not every pixel or all overlapping controls. Actual native button click/Enter/cancel preservation is separately established in `/workspace/lower-hud-independent-review.md`.

No actor intersections occurred with lower controls in this audit. Wide-window non-boss layouts had no pairwise panel intersections. Neither observation waives the narrow/short-window and boss failures. Keep the valid static before/after lower-control evidence, failed historical Armory frame746, and these new diagnostic failures separately. No full encounter, wall-time performance, all-enemy readability or human art acceptance is inferred.
