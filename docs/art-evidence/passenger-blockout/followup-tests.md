# Passenger Vault follow-up CPU tests

## Outcome

Behavioral evidence expanded. Layout remains UNVALIDATED; equipment remains blocked. No runtime defect was established and no pickup mechanic was changed. This does not certify camera pixels, encounter difficulty, or release readiness.

Runtime HEAD before and after testing: `e3226a06328ca3cf442b361a0c60ba98bc63d69b`.
Repository: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout`.
Only repository edit: `tests/unit/passengerBlockout.test.ts`. No source, script, design, snapshot, commit, push, or GPU changes/actions. Final git status showed only that test modified; `git diff HEAD -- src scripts` was empty.

## Added evidence

- Radius-28 swept approach segments from the actual spawn to all 26 existing working, maintenance, spawn and exit probes. These supplement, rather than replace, occupancy and navigation assertions. Existing actual-player route and live-brute loops remain intact.
- Explicit enumeration of all 28 accessible reservation faces. Only the four service backs flush with the hall boundary are excluded by identity; failed occupancy probes are not filtered away in the new tests.
- 112 projectile face cases cover player shotgun, player rifle, hazard and grenade. Assertions pin the last legal centre at 11 pixels from the face after seven 7-pixel steps, then the rejected step. Shotgun effects project to the intended face with its outward normal. Rifle and hazard effects retain their previous-centre semantics. Grenades stop there with zero speed, remain until fuse expiry and explode at that same centre.
- Real player/hazard traces pass along A's north face at an 8-pixel offset and contact its northwest corner at a 6-pixel offset with radius 7. The player shotgun effect is at the corner with a normalized outward diagonal; the hazard effect is at its previous centre. These are representative grazing cases, not every corner or exact-tangent equality coverage.
- A grenade blast damages an exposed crawler while an equally eligible in-range crawler behind A retains its health. This tests production splash occlusion rather than an isolated ray query.
- Every accessible face has a radius-14 crawler-legal point 15 pixels outside it that is illegal for radius-16 pickups. Direct placement returns `invalid`; 5,600 seeded crawler rolls across those points produce only `chance` and `invalid-position`, both observed for each face. No pickup appears or relocates, and sweeping does not award credits for rejected pickups.
- All 28 accessible faces, including island east faces, admit actual crawler drops at legal 28-pixel offsets. A stationary player 60 pixels farther out attracts the pickup along an asserted clear sweep. Tests observe movement before collection and legal remaining pickup positions; they do not teleport the player onto the drop.
- A bounded seed-137 simulation reaches room 2 through room 1's actual director and canonical reward/route calls. Room 2's real director, expedition, enemy system and pending pipeline stay installed. Standing at the first requested breach exercises safety relocation to the farthest breach. The warning is checked at its production offset, no enemy exists through 600 ms of warning, and the first enemy appears after 650 ms. An initial mixed crowd runs before deterministic damage removes enemies through production death handling. Every planned spawn is observed, live positions remain legal, the real director clears, and canonical `clearRoom` sweeps a distant 10-credit pickup into combat and expedition resources. Reward claim and routing then enter depth 2. The objective remains exactly `Clear the occupied pod rows.`

## Verification

Final commands and actual results:

- `npm test`: exit 0. Vitest: 59 files passed, 1 skipped; 493 tests passed, 1 skipped. Duration 8.27 s. The subsequent Node test runner passed both tests, 0 failures.
- `npx vitest run tests/unit/passengerBlockout.test.ts`: exit 0; 1 file, 18 tests passed; duration 2.35 s.
- `npx tsc --noEmit`: exit 0 after final test edit.
- `git diff --check`: exit 0.

One intermediate splash test incorrectly expected a brute's health to decrease despite production armor absorbing the blast. It failed with health 320 unchanged. The fixture now uses unarmored crawlers on both sides so the health assertion measures occlusion, not armor. No production change or assertion removal was needed. An initial combined direct-bin tool command was rejected by a gateway guard before execution; npm/npx CPU commands subsequently ran normally.

## Remaining acceptance limits

1. The inherited rejection policy is now proved, not resolved as a product acceptance decision. Legal crawler deaths at solid edges can yield no pickup even after a successful chance roll. There is no relocation guarantee. Canonical room-clear sweep can collect created pickups only. The parent must reconcile any unqualified reachable-drop requirement without silently adding a mechanic.
2. Integrated progression uses deterministic direct damage, not human weapon play. It proves scheduling, admission, a short mixed crowd, clear and reward transitions for one seed. It does not prove all-seed crowd navigation, difficult combat completion, prolonged stalls, or the failed-spawn retry path after more than 40 attempts.
3. Isolated contact tests invoke the real private projectile updater with controlled bullets. They prove production event coordinates and logical behavior, not screen-space VFX alignment. Splash and grazing coverage are representative, not exhaustive.
4. Existing corner pickup tests remain alongside the new face tests. The new attraction sweep covers face midpoints, not every possible death coordinate or corner approach.
5. Shipping-camera desktop/portrait pixel review, continuous visible deck, living-passenger readability, occlusion, performance, and capture provenance remain the parent's gates. No capture output was reviewed here and no layout PASS follows from this report.
