# Room20 constructed reactor assembly

Stage4 refines the existing Room20 candidate, not another room's unaccepted assets. Task room20-story-flow-v3, scheduler permit1035, branch art/overload-floor-v3, draft PR85, issue42 and campaign21.

The axial reaction column now has three tiers of segmented bronze coil shoes and ceramic crosspieces. The coolant head gains a capped header and split flanges. Separate ceramic saddles terminate the power conductors above a recessed chest. Guide rods and an elevated ram connect the restraint to the core frame.

Scope is limited to src/render/OverloadDraft.ts and its test. Existing three-lobed boundary, central void, spawn, four breaches, empty obstacles, materials and room registration remain unchanged. No shared engine, HUD, camera, gameplay or global lighting edits. The canonical fatal overload story remains unchanged. This stage makes no claim about sequence emission, compatibility-anchor behavior or the ending.

Before and after originals use the same room-evidence fixture camera and player state. Captures are static controlled simulation with staged actors and no DOM HUD. The contact sheet contains enlarged original-image crops. Source-before.json and source-after.json pin the candidate's dirty precommit source; before/ contains the prior committed renderer's capture and pins. Initial baseline capture records remain local.

Parent reran npm test, npm run build and npm run test:room-evidence successfully. Parent and independent reviewer each passed 21 focused tests; independent typecheck passed. Saved route assertions passed179/179. Full browser verification and dense overload combat were not run. Both art reviews pass model iteration only. Overall review still needs a fresh scheduler permit. Human acceptance, merge and deployment remain pending and unauthorized.
