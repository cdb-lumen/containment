# Room14 model iteration

Verdict: passed, bounded stage4. Overall review requires a new scheduler permit. No human room acceptance, merge or deployment.

Parent Hermes inspected the before and final native desktop images, both overviews, rejected sign-overlap image and labelled contact sheet. The raised rear X now reads independently of the weight. Sheaves have visible hubs, spokes and bearing supports; the retaining cage connects the counterweight plates to the guide shoes. The local-only sign remains legible after moving it clear of the truss. The disconnected lead and C balcony remain intact.

Independent reviewers recorded the same bounded pass in independent-review.md and independent-supplement.md. The supplement resolves the original report's missing contact-sheet and source-pin evidence. These images cannot establish hidden mechanical connections or operating lift motion, neither of which is claimed.

## Verification

Parent ran:
- `npx vitest run tests/unit/ServiceShaftLanding.test.ts`: 11 passed, exit0.
- `npm test`: exit0, 770 Vitest tests passed and one skipped, plus Node/Python asset checks.
- `npm run build`: typecheck and build passed, exit0. Existing large-chunk warning remains.
- `npm run test:room-evidence`: exit0, 22 Node checks plus the ragdoll checks.
- External Room14 capture with `--rooms=service-shaft-landing --gameplay-all --verify-all`: exit0, one overview and one production-camera image. Source and test hashes were identical before and after the parent capture.

The focused suite covers physical/query agreement, post-batch bounds and draw budget, C-route radius16/28, actual brute contact damage, pickup collection, material disposal and the new model assemblies. Only ServiceShaftLanding.ts and its test changed this attempt. Canonical topology, other rooms, camera, HUD and shared gameplay did not change.

## Preserved failures and evidence limits

The implementation delegate timed out after 600 seconds. Its terminal result was interrupted, not a completed capture-command pass. The parent recovered its complete PNGs and manifest, then ran a fresh successful capture. The fresh overview is byte-identical; gameplay differs only inside x597..685, y130..212 around combat particles. Complete-frame equality is explicitly not claimed. The final published pair uses the parent capture.

The first raised-truss placement obscured the sign. Its rejected PNG remains published, and all initial captures and intentional RED test logs remain local. The first recovery packaging assertion expecting complete-frame equality also failed and was replaced with measured difference bounds, not a claim of equality.

Controlled simulation uses staged actors and no DOM HUD, not ordinary gameplay, mobile acceptance or a full local browser verifier. The before/after camera and fixture are unchanged, but transient particles are not pixel-identical. Full overall validation, human acceptance, release checks and live combat remain separate. Operational logs remain outside the repository.
