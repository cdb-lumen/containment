# Room15 stage5 independent review

## Verdict

Bounded visual pass for the four retained images. Overall validation remains incomplete. I found no new blocking composition or model-support defect in those pixels, but the requested south view is missing and the evidence does not satisfy the issue36 request to record attackers approaching along each legal lane. Static staged brutes and a separate player traversal do not establish that behavior or small-enemy visibility.

The attempt1009 resin treatment accepted by the human in topic536713 remains accepted. This review does not reopen its cosmetic treatment. It does not grant human room acceptance, release approval or a technical waiver.

## Scope and evidence inspected

Worktree: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/infested-workshop-v3`.

Verified HEAD: `88704f1d61e82b8634a25eb9a582c0df60c0fb95`. Git status was clean. Independently hashed all 337 entries in `source-pins.json` against the worktree, with no mismatches.

Attempt directory: `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/infested-workshop/story-flow-v3/stage-5/attempt-1037`.

I loaded every available original PNG, not a contact sheet:

| Original in capture/ | Native dimensions | Review |
| --- | --- | --- |
| 15-infested-workshop-overview.png | 1280 by 900 | Complete fitted overview, valid static room evidence |
| 15-infested-workshop-desktop-center.png | 1280 by 900 | Valid production-camera static view |
| 15-infested-workshop-desktop-west.png | 1280 by 900 | Valid production-camera static view |
| 15-infested-workshop-desktop-east.png | 1280 by 900 | Valid production-camera static view |
| 15-infested-workshop-desktop-south.png | Not captured at review cutoff | Cannot review absent pixels |

Programmatic inventory found four PNGs and four manifest rows. Every retained PNG decoded at the declared dimensions and matched its manifest SHA256. Each row reported empty errors, webglError 0, no combat result and three staged enemies. These are browser-rendered static originals with no DOM HUD, not live gameplay or native-device evidence. The fitted overview is not a shipping gameplay view.

The first capture ended unsuccessfully. `command-results.json` records capture exit 1. `capture.log` ends with `page.screenshot: Target page, context or browser has been closed`. A south-only retry was present as `capture-south.mjs` and `capture-south.log`. The latter remained empty through two bounded waits totaling five minutes. I did not stop or restart it. A later south PNG or changed manifest needs a supplemental review before anyone describes this as a completed five-view inspection.

## Visual assessment

The room reads as a workshop rather than a generic infested arena. The overview separates the northwest lathe, northeast gantry, southern fixture bench and stock cabinet. The dark open central aisle stays quieter than the machinery. Yellow paint links the equipment without turning the floor into a hazard graphic. The lathe earns focal priority through its denser construction and damaged upper silhouette, even though the gantry is taller in the image.

The center, west and east originals expose the lathe's horizontal bed, paired ways, metallic chuck, copper-colored axial stock, carriage and tailstock. Those relationships make its original function identifiable. The rear articulated arm bends toward the same stock. Its changed brace and broken guard distinguish this assembly from the ordinary bench and gantry. The shared workpiece does not read as an unrelated floating pickup.

The bed and bench have visible dark supports. The gantry reads as a structure on a base. I found no obvious floor penetration, unsupported floating major component or growth crossing an aisle in the inspected pixels. Contact details on the rear arm are partly hidden by the projection. Their absence from view is not proof of detachment, and source bounds cannot prove every visible contact either.

Two minor visual limitations remain, neither a reason to reject the accepted resin:

- The rear cassette strip stops short of the right end while the thin service runs continue. This abrupt termination is visible in the overview. It is a shell finish issue, not an aisle obstruction.
- The cut copper ends and peeled insulation are small, dark details behind the arm. They are present but do not independently communicate deliberate rewiring as strongly as the chuck, broken guard and arm communicate altered machinery. I would not claim every narrative detail is immediately legible in these desktop views.

The three large staged brutes remain distinct from the machinery and the red player. That establishes only this static arrangement. It does not establish small-enemy readability, pursuit through all approaches or simultaneous combat clarity.

## Technical assessment

I read `map-model-production.md`, including the stage5 overall-validation requirements, and the issue36 brief in `rollout-sources/room15-brief.json`. I also read the stage0 story brief and retained stage1 independent review. I did not fetch the live GitHub issue anew.

Reviewed runtime and test sources:

- `src/render/InfestedWorkshop.ts`
- `src/render/InfestedWorkshopArchitecture.ts`
- `src/render/InfestedWorkshopMaterials.ts`
- `tests/InfestedWorkshop.test.ts`
- Relevant staging and traversal code in `scripts/room-evidence-scene.mjs`
- Attempt-local `adaptations.json`, `source-pins.json`, capture manifest, command results and test/build logs

The model keeps the original four solid footprints. The focused tests check actual model bounds before and after production batching, floor minimum height, material/mesh budgets, asset ownership and disposal, and selected contact bounds. Workpiece bounds intersect the chuck, tailstock center and both gripper pads. Arm-brace anchors lie within their named owners. Insulation ends attach to the column and foot with a retained cut gap. These are useful CPU checks, not exact triangle-contact or projectile/render-equivalence proofs.

I independently ran `./node_modules/.bin/vitest run tests/InfestedWorkshop.test.ts --reporter=verbose` in the specified worktree. It exited 0 with all 12 tests passing. No browser or GPU job was launched by this reviewer.

Recorded parent results agree with their logs:

- `npm test` exited 0. Its Vitest portion reports 771 passed and one skipped, not a completely unskipped suite.
- `npm run build` exited 0, including TypeScript checking. The existing large-chunk warning remains.
- `npm run test:room-evidence` exited 0 with 22 tests and 33 additional CPU checks.
- The focused four-file Vitest command exited 0 with 81 passing tests.
- The initial capture exited 1, despite retaining four valid PNGs.

The manifest retains a separate production player traversal with 291 legal checks, distance 1000 and exit distance 0. The helper really calls `DepthGame.update` along the route. This supports a controlled spawn-to-exit movement check, not live campaign play. Capture adaptation removes the combat call and stages legal player positions before renderer settling. The fixture's inactive director and three brutes do not exercise the canonical encounter.

## Preserved failures and acceptance limits

The earlier stage1 results remain unresolved and are not replaced by the passing unit suite:

- Radius28 sampled connectivity reached 1860 of 1868 legal nodes. Eight corner samples passed occupancy but failed even zero-length sweeps.
- Radius38 reached 1804 of 1806 sampled nodes despite passing the anchor and route probes.
- Radius48 failed activity A occupancy and four route segments, covering the main aisle, both east convergence segments and activity A access.

Source: `infested-workshop/story-flow-v3/stage-1/attempt-1005/independent-review.md`, backed there by the retained validator and results. I did not rerun those stress probes or waive their failures.

The current evidence supports recognizable machinery, bounded composition, retained collision reservations and one controlled player route. It does not prove all legal space connected, exact projectile clearance, live converging attackers, small-enemy visibility or campaign progression. HUD and mobile visibility are not art acceptance gates under the current contract, so their absence is not a new art defect.

To finish this requested review matrix, inspect and verify the south retry if it succeeds. To claim the full issue36 behavioral acceptance, supply source-specific lane-approach and small-enemy evidence or explicitly retain that acceptance criterion as unverified. Neither requires cosmetically revising the human-accepted resin.

## Writes

Only this review file was authored. No runtime, receipt, guard, publication, vault or acceptance record was changed.
