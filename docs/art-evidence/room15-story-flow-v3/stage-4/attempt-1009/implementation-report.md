# Room15 stage4 attempt1009 implementation

Implemented only in the authorized infested-workshop-v3 worktree. Source remains uncommitted on art/infested-workshop-v3, based on 7e24f3f386bd8dafb1e862f1b915f5a74bde8f1f.

## Model changes

Inspected the original attempt1008 gameplay and overview PNGs. The housing resin appeared as a small striped fringe below the yellow casting. The rear brace merged into the machinery, and the cut insulation was not distinguishable.

- Extended the two connected resin lobes up the housing face and across its roof. Cross sections now turn with the path so the roof portion retains thickness. Reduced texture repetition and replaced the three parallel raised fibers with one seam per web.
- Moved the thick tendon span outside the column silhouette. Its foot endpoint now sits inside the foot instead of above it. Added substantial cuffs at the foot and upper arm.
- Rebuilt the supply damage as a column-connected upper sheath, exposed copper ends, a separated foot-connected return and an attached peeled flap. Raised and widened the cut components.
- Preserved the chuck, supported copper stock, gripper pads, carriage, handwheel, tailstock and broken guard. No other equipment branch, collision, camera, HUD, shared engine or gameplay edits.

Changed files:

- src/render/InfestedWorkshop.ts
- tests/InfestedWorkshop.test.ts

## Actual CPU verification

Three new regression tests failed before implementation. The failures were missing roof coverage, the tendon foot endpoint outside its owner, and a missing connected insulation return. Original output is in focused-red.log.

Final commands and results:

- npx vitest run tests/InfestedWorkshop.test.ts tests/ShipEnvironments.test.ts: exit 0, 37 tests passed across 2 files. focused-green.log.
- npm test: exit 0. Vitest reported 771 passed and 1 skipped across 81 passing files and 1 skipped file. The following Node tests and all Python asset checks also passed. npm-test.log contains the complete output.
- npm run build: exit 0. TypeScript and Vite completed. Vite reported the large-chunk warning. npm-build.log.
- git diff --check: exit 0. Final status contains only the two scoped modified files.

The focused tests check roof geometry extent, tendon endpoint containment and width, supply attachment bounding boxes, cut separation, stock support, geometry ownership, disposal and unchanged reserved envelopes through renderer batching. Bounding boxes do not establish exact mesh contact or native-view readability.

## Limits

No GPU job, new capture, independent visual verdict, stage acceptance, publication, commit, merge or deployment was performed. Final visual readability remains unverified. Parent capture and independent review are still required. Existing route corner and radius48 findings were not rerun, repaired or waived. No guard, permit, budget, registry or human acceptance state was changed.
