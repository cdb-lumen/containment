# Room14 stage4 independent review

Verdict: passed for the inspected model iteration. This is a bounded independent review, not stage publication, stage5 overall validation, human acceptance or release approval.

Reviewer: independent read-only subagent. Read the current production contract, map-model-production.md, production-guard.md and Room14 routing. No runtime edits, GPU jobs, commit or publication were performed.

## Native image findings

I inspected all four original 1280 by 900 PNGs with native vision:

- before/14-service-shaft-landing-gameplay.png
- before/14-service-shaft-landing-overview.png
- final/14-service-shaft-landing-gameplay.png
- final/14-service-shaft-landing-overview.png

The final images supersede after/. Rejected after/ and initial-after/ files remain present. I did not use them as acceptance evidence.

The rear X truss now clears the weight assembly and is visible in both final views. Its ends meet substantial upright joints, rather than disappearing behind the upper machinery as in before/. The foreground truss remains separate and readable. The new weight frame and crosspieces connect the plate stack to the guide-shoe region. The machinery reads as one supported assembly rather than a plate stack between unrelated rails.

Both sheaves now show rims, spokes and bearing supports. Their hanging cable runs are easier to distinguish from the guides. Source inspection confirms paired rims, a groove, hub, through axle, bearing blocks and bases, plus side ties from the guide-head region to the rear posts. This supports a functional mechanical reading of the static model. It does not prove a working animated hoist, complete rope reeving or structural engineering validity.

LOCAL ACCESS ONLY is fully readable on the right-hand north curb in both final images. Neither rear brace crosses the text. The west local junction, amber hardware and pale disconnected cable remain visible. The relocation preserves the access restriction signal without restoring the rejected overlap.

No blocking visual defect was found in these views. The lower weight and some connections remain partly hidden by the front truss and shaft edge. That is an inspection limit, not evidence that every hidden connection is correct.

## Source and topology checks

Reviewed the actual diff against HEAD ec958c9221a300cac796145e06c66dc7aa5ae7f1. Only src/render/ServiceShaftLanding.ts and tests/unit/ServiceShaftLanding.test.ts were modified. Changes add the weight frame, articulated sheaves, exposed rear truss and ties, and relocate the sign. No shared camera, HUD, lighting, gameplay or topology source changed.

SHA256 values measured directly from the reviewed worktree:

- src/render/ServiceShaftLanding.ts: 2d3aa87030202ef8e7257f4f54cb184b74168a27b04a476ea352574e2493bd0e
- tests/unit/ServiceShaftLanding.test.ts: d8da9174b8e2ad396271f099b7f26ed4f7a16ddc39260ce92abc0180c18fab2e
- src/game/roguelike/roomTemplates.ts: 0e3fc4e407a5072ae3370c12311e4f1357cb98712a154af9f7f1c00fdde25629
- src/game/world/expeditionGeometry.ts: 61592cc4e947e8d6873488407235e1ab117585e59d10141916de3efe00ef316b
- src/game/roguelike/storyRooms.ts: f9f1248316c721c4f5c683eb9661f8ed2f95e34685b931f45b63b508e473c715

The last three files are byte-identical to HEAD. Before and final manifests retain identical room inventories, camera settings, player positions, enemy counts, combat metrics and readiness records. All four inspected PNG hashes match their manifests. Final gameplay SHA256 is 70dfc71b96e75770de787ec9f7d26dcf4126abee33e81c143daab60bd2094037. Final overview SHA256 is b8c59a84bafee82603d6ed528f86312cb7874567367d18ad093566c9f435c0b9.

The manifests identify the base commit but do not contain dirty renderer hashes. These independently measured hashes pin the source reviewed now, not a retrospective proof of capture-time source bytes. The implementation source-pin report was not yet available at review time and must close that provenance limit before claiming fully sealed evidence.

## Tests and evidence limits

I ran npx vitest run tests/unit/ServiceShaftLanding.test.ts against this source. Exit 0, one file passed, 11 tests passed. I read the assertions, including canonical shaft/spawn/exit/breach preservation, C-route clearance at radii 16, 28 and 30, actual update traversal with a pursuing brute and pickup, machinery confinement to solid space, batching bounds, material disposal, rear-truss ray visibility and new assembly checks.

The new frame test checks overall bounds, not every joint. The sheave test checks named parts, spoke count and axle extent, not full mechanical operation. Native image inspection and source review supplement these limited assertions.

I inspected parent-tests.log, parent-build.log and parent-evidence.log as supporting records. The build completed with a large-chunk warning. The evidence test log reports 22 passed, zero failed and a successful 33-check CPU self-test. The parent reports npm test/build and test:room-evidence exit 0. I did not independently rerun the full suite or build.

The capture script labels these as controlled live simulation. Gameplay retains production camera and composition; overview fits the room. The fixture has controlled legal actors, fixed-step combat, an inactive director, no boss, no campaign progression and no DOM HUD. Both final manifest rows report no browser errors, WebGL error 0 and no context loss. This is not an ordinary playthrough or HUD/mobile acceptance gate.

No model contact sheet existed in the evidence root at the time of review. The original before/final pairs support the verdict above, but the required contact sheet still needs production and native review before claiming complete stage4 deliverables. Publication and remote-byte verification remain the parent's responsibility. Any later source change invalidates this source-specific verdict until reviewed.
