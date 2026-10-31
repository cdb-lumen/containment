# Room heading clearance — independent review

Reviewed commit 753303ad597fd467676056d99a81a2077e935826 in `containment-camera-headroom`, the unchanged status-placement helper, main wiring, CSS and DOM regression. Inspected the actual preserved `room12-shared-headroom-final/frames/00366.png`. No renderer was launched and no source was changed. Parent-reported focused/full test outcomes are not an independently rerun suite here.

## Finding

**P3 — preserve the existing non-playing pointer contract (`src/style.css:85`).** The new `#status-hud #pause { pointer-events:auto }` selector has two IDs, so it overrides `body:not([data-state=playing]) #hud button { pointer-events:none }`. Pause now computes as pointer-interactive while paused/reward/route states display the dimmed HUD. The modal overlay ordinarily intercepts input, and the existing handler checks game status, so this is not evidence of a gameplay bypass. Still, scope the explicit override to playing state, or rely on the existing `#hud button` rule, and add a computed-style regression for a non-playing state. This is a narrow regression rather than a reason to discard the heading repair.

## Repair semantics

The preserved failure is legitimate: the north-east marine's conservative body rectangle intersects the fixed room heading, despite clearing the viewport and other tested panels. The image places the actor immediately beneath the heading/backplate. Retain this attempt as failed visibility qualification; neither the camera repair nor a DOM test retroactively qualifies it.

Moving the same room-label and Pause nodes into the measured status column lets the existing mirrored-column clearance and hysteresis account for their actual dimensions. It does not hide the title, alter camera/gameplay, replace the Pause handler, recreate focused DOM nodes per frame, or remove story/objective text. The wrapper remains read-only pointer-pass-through; the button remains a native button with its accessible name and existing click binding. The updated pass-through test clears event flags between probes, and now probes the room label as well as story copy. Keyboard Enter and mouse activation of Pause are tested. Existing Skip mouse/keyboard and focus-preservation tests remain.

The new regression uses the exact failed body rectangle and actual room/depth text, checks both heading and Pause clearance, and verifies wrapping/vertical order at 640x900 and 960x480. It preserves the underlying collision assertions rather than weakening their margins. It establishes DOM interaction and layout, not production pause/resume lifecycle or native actor pixels.

The taller column is measured dynamically, so its extra height participates in repositioning without changes to the placement algorithm. `min-width:0`, flexible label width and `overflow-wrap:anywhere` prevent a long title from forcing the Pause button outside its allocated row. The button keeps its fixed minimum visual width through flex-shrink:0. Repositioning remains horizontal and retains the existing wider return margin.

## Remaining qualification

Fresh native evidence must pin the complete camera-plus-heading candidate, not old 0b22. Confirm readable title/Pause and story content, transitions between sides, and no newly obscured actor along the complete encounter. The helper only avoids the marine against two candidate column positions; it does not guarantee all HUD widgets avoid one another or bosses/enemies, arbitrary localization/zoom combinations, or tiny desktop windows. Existing 24-pixel clearance padding exceeds the label's six-pixel backplate extension, but the supplied regression primarily measures element rectangles.

No additional blocking code finding identified in this bounded review. Resolve the pointer specificity regression above and retain the failed capture and full native retry requirement. No full-release, human art, or historical approval claim follows from this review.

## Follow-up: P3 resolved at 9c9e8ea99f02e3edbf7163b0d6655a3f21b125f5

Independently inspected the narrow correction: the two-ID Pause rule now sets only `flex-shrink:0`, allowing the existing playing/non-playing button pointer rules to govern again. Added computed-style assertions require `pointer-events:none` in paused, route, dead and menu states; the same test still exercises playing-state mouse and Enter activation before those assertions. No clearance or accessibility assertion was removed.

Independently ran `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx vitest run tests/StoryHudLayout.test.ts`: **5/5 tests passed**, exit 0. Log: `/workspace/room-heading-independent-dom.log`. This is the CPU DOM harness with GPU/WebGL disabled, not a game renderer or native acceptance capture.

The original P3 above is retained for history and is resolved. No remaining blocking code finding in this bounded review. Fresh exact-source native/full-encounter qualification and the previously stated scope limits still apply.
