# Room15 stage4 implementation, attempt1008

Runtime files are frozen for parent capture. No GPU job, commit, push, guard change or acceptance action was performed.

## Changes

Only InfestedWorkshop.ts and its tests changed. The lathe now has two asymmetric flattened resin webs fused into the headstock and bed, plus a broad fibrous arm brace. A jagged extruded guard, folded lip and hinge replace the plain guard slab. Stock spans the chuck and tailstock on their shared axis, with opposed contacting gripper pads. A clamped cut sheath, separate peeled flap and exposed copper ends replace the thin rear strands. The other three machinery roles remain unchanged.

I inspected both stage3 original PNGs with vision. The three repeated hanging strips read as cables, and the small guard and short stock did not establish the damage/support story. New pixel quality remains unreviewed until the parent captures.

## Verification

- Tests first: four new model/ownership assertions failed on the original implementation. A further batching ownership test failed before the owned-geometry retirement flag was added. Logs retain these failures.
- Focused: 34 tests passed across InfestedWorkshop.test.ts and ShipEnvironments.test.ts, exit0.
- npm test: exit0. Vitest reports 768 passed and one skipped. The following Node and Python checks also completed successfully.
- npm run build: exit0. Existing large-chunk warning remains.
- git diff --check: exit0.
- CPU mesh inspection: lathe 78 meshes, 4776 triangles, eight materials. Actual reservation bounds and unchanged bounds after real renderer batching pass.
- Explicit protected-path diff is empty for src/game, shared dispatcher/renderer/helpers, workshop architecture/materials, main, styles and scripts. Four collision solids and equipment identities remain exact. This does not clear inherited route stress limits.
- Room-owned guard/web geometry is retired once by the existing batcher. Shared materials and cached geometry remain alive. No shared runtime change was needed.

## Modified files and final SHA-256

- src/render/InfestedWorkshop.ts: c11c28a2dffd62af4fd629c2f74bb64f110a36a9f936fdfdf89bc83d5dc5bac0
- tests/InfestedWorkshop.test.ts: 70d48b7808c7c2c7a8b6b46772e43dab31ddfa36ebb7bd31b1b705231bf78e5c
- tests/ShipEnvironments.test.ts: 96b720f932f3a787840128cc5e5f674c4dba68aae93da8b21d58556d2a62b43b

HEAD remains 55da824a49bca3f2b3a9503637c7ee946845019b. Runtime diff, command logs, mesh-results.json and the CPU metrics script are beside this report. Source edits remain uncommitted in the assigned worktree.

Parent owns new before/after captures, contact sheet, independent visual review and publication. Stage completion and human acceptance are not claimed.
