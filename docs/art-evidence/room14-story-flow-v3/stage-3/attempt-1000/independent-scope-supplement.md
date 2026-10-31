# Room14 stage3 independent scope supplement

## Final bounded verdict

PASS for this candidate's stage3 scope and visible room identity and composition under the actual production policy. The machinery, sign and fiber corrections do not require a scope exception. This is a bounded room-visuals review, not final model acceptance, overall stage5 validation, human acceptance, release approval or a technical waiver. It does not itself complete publication or advance the guard.

The original `independent-review.md` remains unchanged, including its strict shell/floor-only rejection. That rejection correctly describes the patch's incompatibility with the narrower premise supplied to that review. It is not a valid scope blocker under the actual stage3 policy. This supplement corrects the governing premise without deleting the earlier finding or its evidence limits.

## Governing policy

I read `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/map-model-production.md`, including the surrounding ownership and evidence rules. Line 20 authorizes:

> Develop shell, floor/walls, major forms and materials. Review room identity and composition. Publish overview and normal desktop-view PNGs.

Lines 9 to 11 also permit room-local models and materials while preserving identity, required routes and actor clearance. They forbid new gameplay mechanics and production HUD/camera or unrelated shared-system changes. Line 21 reserves further important-object refinement for stage4, but does not prohibit stage3 corrections to the readability of existing major forms. Line 24 still requires reviewed images and focused behavioral checks appropriate to the changes.

## Assessment of the actual patch

I reread the complete retained `candidate.patch` and verified that its bytes equal the current worktree's `git diff`. The diff changes only `src/render/ServiceShaftLanding.ts` and `tests/unit/ServiceShaftLanding.test.ts`.

- The deck grain, grating panels, shaft-edge paint, wall panels and ribs develop shell and materials directly within stage3.
- The room-local steel and zinc adjustments, counterweight trim, thicker cross-braces and mounting blocks develop the existing lift assembly's material separation and major-form readability. They do not introduce a new assembly, room function or mechanic.
- Moving the existing sign and its backing together from z350 to z300 addresses composition and visibility of the existing room-identity cue. It does not alter its text, move the shipping camera or change the HUD.
- Enlarging the existing disconnected fiber plug and cable, adding its metal end and adjusting its material clarify an existing local-junction cue. These are bounded changes to an existing form, not a new interaction or narrative decision. More convincing final object treatment can still belong to stage4.
- The added tests cover local texture ownership and placement of the new finish geometry. No existing assertion is removed. No collision template, route, camera, HUD, shared lighting or shared renderer file changes in this diff.

The relevant distinction is between developing existing room forms for composition and accepting fully refined models. This patch does the former. Calling the entire patch floor-material-only remains inaccurate, but the policy does not require that description.

## Pixel review and retained reservations

I reopened both unchanged originals in `evidence`, the gameplay-named desktop view and the whole-room overview. The deck remains distinct from the shaft. The overview retains the connected balcony and separated right-side extension without a panel bridge across the void. The pale lift structure is legible against the dark shaft, and the cross-bracing remains subordinate to that opening. `LOCAL ACCESS ONLY` is readable in full. The local junction has a visible dark socket and separate pale hanging cable.

I found no additional visible defect that blocks this bounded room-composition verdict. The original reservations remain:

- The repeated panel slots and edge dashes are very regular. The machinery and panels still look relatively clean; convincing localized worn-zinc treatment has not passed final review.
- A disconnected cable is visible, but these stills do not establish its specific AI-fiber meaning or grant final narrative/model acceptance.
- The texture test checks type, width and disposal, not deterministic bytes or grain content. Its name overstates its coverage. This remains a nonblocking coverage gap, not a passing determinism assertion.
- Legal finish vertices are useful coverage, not proof against every triangle spanning a concave void or proof of live traversal.

The capture limitation also stands. These are controlled, canvas-only simulation stills without the DOM HUD, not an ordinary integrated gameplay session. The gameplay-named frame uses the production renderer's desktop camera/composition; the overview uses a fitted camera. They support this bounded visual judgment, not full live-room traversal, sustained combat, campaign progression, touch behavior or performance. The policy makes normal desktop composition and overview the art-review basis and expressly does not make HUD overlap or mobile visibility art gates. That does not turn this fixture into integrated gameplay evidence.

No technical failure is excused by the scope correction. The original report's author-supplied focused-test result remains attributed execution evidence, not a new independent test run. Later overall validation must still address the required collision, movement, route and asset-safety checks.

## Verification and preservation

Read-only checks in `/home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3` confirmed the retained patch matches the current diff. `git diff --check` returned no output. Renderer and test SHA-256 values still match the original review:

- Renderer: `432f15b545e32fa56e550da28eba3807245e5801e17eea00538dc4474a80fa94`.
- Test: `403dd4f516d5c1678b7ac4de4261871d41664927111f252ac6c8b8d41678029c`.

Both reopened PNG hashes also match the original review:

- Gameplay: `72f6988b992db3a8722f039c62efb65dc3883c84e426f6722f5fad366298a771`.
- Overview: `11bdb91970be013be2efa1c072e4af82db67d90679cd2d6c991851f38caa5196`.

The original review's SHA-256 before this supplement was `f563d4695b21eea6b4c6d3ee49ff77794990de0f18045a1f057464a5e49e252c`. I did not rewrite it. This supplement is the only file I created or modified. I ran no browser, GPU job, tests or build and made no runtime, image, manifest, source-pin or guard edits.
