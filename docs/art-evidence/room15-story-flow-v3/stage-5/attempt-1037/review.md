# Room15 overall review, attempt1037

Passed the bounded static overall art gate. The final room candidate still needs explicit human acceptance. This does not complete issue36's gameplay or release checklist.

Parent reviewer: Hermes worker9b8013f7b737, run room15-story-flow-v3-stage5-attempt1037, 2026-10-02. Independent reviews are retained in independent-review.md and independent-review-supplement.md. The latter resolves the former's missing south coverage without rewriting its initial incomplete verdict.

## Pixels and story

I inspected all five original 1280 by900 PNGs: overview and center, west, east, south desktop views. The overview fits the room; desktop views use the unchanged production follow camera and composer. These are static controlled simulations with staged actors, no DOM HUD and no live-combat claim.

The lathe's chuck, axial stock, ways and carriage explain the former machine shop. Its bent articulated arm and broken guard show the altered working assembly. The taller gantry, separate bench and stock cabinet remain subordinate through simpler construction. Visible supports ground the equipment. I found no blocking floating major component, floor penetration or growth bridging the visible aisles. The east view covers the exit and the south view exposes the bench supports and southern route. Dark floor keeps the equipment and staged actors separate.

Viktor accepted attempt1009's resin treatment in topic536713. That decision is preserved, not re-reviewed as a failed aesthetic. Small cut-insulation details remain subtle and the rear cassette terminates abruptly at the right edge. Neither blocks this bounded static handoff; neither is claimed improved.

## Fresh verification

Runtime source remains exactly 88704f1d61e82b8634a25eb9a582c0df60c0fb95. All337 source pins match. Fresh origin/main7a3f262 remains an ancestor. No runtime files changed during this attempt.

- npm test exited0. Vitest reports771 passed and one skipped, with the other repository test commands also completing.
- npm run build exited0, including TypeScript. Existing bundle-size warning remains.
- npm run test:room-evidence exited0, with22 tests and33 additional CPU checks.
- Four-file focused suite passed81 tests. Parent separately reran37 machinery/environment tests; independent reviewer reran12 machinery tests.
- Parent reran the retained exact route manifest against current runtime imports. Eleven acceptance checks passed. All24 named route segments passed at radii16,28 and38. The original four collision reservations and actual pre/post-batch mesh bounds remain protected by tests.
- Each capture manifest records291 production player movement checks, distance1000 and exit distance0. This is controlled spawn-to-exit traversal, not every-lane enemy behavior.
- Initial five-view capture timed out at its existing six-minute context watchdog after four valid PNGs. Its exit1, logs and incomplete manifest remain. A child south retry was interrupted without a PNG. Parent recovered only south in a new directory using the same source, camera and quality. Background process proc_ba3614abc2ec exited0. Both manifests reconcile to five unique modes with exact decoded hashes.
- No capture Chromium or task-owned Node process remained at parent readback. The unrelated containment-boons Vite server was untouched.

## Unresolved criteria

Radius28 retains eight sampled corner connectivity failures; radius38 retains two. Radius48 still fails four route segments and activity-A occupancy. These historical diagnostic failures reproduce unchanged and are not waived or relabeled passes. No shared geometry, AI or navigation correction is authorized here.

Every-lane attackers, small-enemy visibility, dense combat, actual HUD interactions, phone/touch checks, exact projectile/render equivalence and full browser verification remain unverified. No merge or deployment. Old CI at the runtime head was CANCELLED; publication-head CI is reported separately, never inherited as passed.

The receipt passes only the six-stage bounded art review under the current production policy. It submits this exact candidate for final human room acceptance through the installed receipt workflow. It does not assert review-topic delivery before guard consumption.
