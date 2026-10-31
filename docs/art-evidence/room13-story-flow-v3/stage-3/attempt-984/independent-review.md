# Room13 independent review

Verdict: passed stage3, room visuals only.

Candidate: attempt984, branch `art/coolant-plant-v3`, HEAD `71b95d1dca3424828b7913a3d716fa2dc6f57358` plus the pinned dirty patch. This is an independent machine review, not human approval, final equipment acceptance, live combat acceptance or release authorization.

## Pixel review

I loaded and examined both original 1280 by 900 PNGs through the vision tool:

- `13-coolant-plant-overview.png`, SHA256 `6399e6accbe8be9ad847051785c02b4ded794e359dde526287ee59902ab22bf3`.
- `13-coolant-plant-gameplay.png`, SHA256 `6c4457432c74994706ea150e24dd02cd80fb77c36280ec4cf9ee00ff0c407682`.

The paired upper exchangers and lower pumps read as one restrained turquoise installation. Steel flanges and motor ribs are dull rather than mirror-bright. Small amber valve wheels give readable accents without becoming the room's main color. Dark service covers connect the machinery but stay subordinate to its silhouettes. Their slots are visible in both views, without a continuous glowing floor stripe.

The central saddle visibly has two separate headers, corner drops, supports and an open center around the small control plate. It no longer reads as a solid cabinet. The overview retains clear perimeter space and a balanced paired layout. The gameplay frame retains the same hierarchy at closer scale. No blocking stage3 visual defect found.

The machinery still has simple broad shells and repeated paired forms. That is a model-iteration limitation, not a failure of this room-visual stage. Small mineral deposits do not establish a strong visible wear narrative at these scales. I do not claim finished equipment detail.

These are controlled staged captures. The manifest describes an inactive encounter director, no campaign progression, no DOM HUD and no real touch input. Actors in the PNGs do not prove ordinary live encounter quality. HUD and mobile visibility were not art gates.

## Exact independent checks

- Read `async-rollout-worker-prompt.md` and the visual-evidence-auditing, receiving-code-review and unslop skills.
- Reviewed the complete `git diff`, status and HEAD. The only changed files are `src/render/CoolantPlantBlockout.ts`, `src/render/ShipEnvironments.ts`, `tests/CoolantPlantBlockout.test.ts` and `tests/ShipEnvironments.test.ts`.
- Compared all four retained source snapshots with the worktree. All match. Compared current `git diff` bytes with `dirty.patch`. They match. Recomputed the patch hash and all 337 source-pin file hashes, with zero mismatches.
- Checked manifest coverage programmatically. It has two results, one overview and one gameplay image for Room13. Both PNG dimensions and SHA256 values match the manifest. Both result error arrays are empty, `webglError` is zero and `contextLost` is false. These are capture-reported runtime metrics, not a GPU rerun by this reviewer.
- Ran `./node_modules/.bin/vitest run tests/CoolantPlantBlockout.test.ts tests/ShipEnvironments.test.ts --no-cache`. Exit 0, two files passed, 34 tests passed. This was CPU-only.
- Ran `git diff --check`. Exit 0. Final status still lists only the same four candidate files.

## Scope, collision and ownership

Other rooms are unchanged by this diff. The shared architecture changes are guarded by the exact maintenance plus `coolant-plant` predicate. Other branch expressions are preserved, shared MAT values are not mutated, and room templates, routes, gameplay, HUD, cameras and lighting files are untouched. The focused tests also verify service-shaft and generic maintenance exclusion, all twenty room registrations, and footprint containment across all ten environments. I did not capture fresh pixels for other rooms.

The five authoritative solid footprints remain exact before and after batching. The tests exercise both service circuits, upper and lower saddle bypasses, exit routes at radii 16 and 28, clear bypass shots and the blocked central shot. Flush covers stay below height 0.01. These checks retain the existing 2D collision contract, not full projectile-to-mesh equivalence or live traversal acceptance.

Material lifetime agrees with production ownership. `COOLANT_MAT` contains seven module-level reused materials, not per-room allocations or actor-owned materials. `disposeModel` only disposes materials tagged `actorMaterial`; the coolant finishes are intentionally retained just like shared MAT. Cylinders, bends, boxes and planes use the production geometry cache. The production batching path clones or deindexes source geometry, merges by material and disposes temporary geometry. Disposal tests verify baked geometry is disposed once while cached geometry and coolant materials survive. The revised test's cached-material classification therefore matches production semantics rather than hiding a required room-owned disposal.

The complete coolant assembly plus services passes the fewer-than-ten batched-draw assertion. Services pass their at-most-three assertion. These are assembly bounds, not total scene draw counts. The manifest reports 66 overview and 69 gameplay scene draws.

## Preserved failures and limits

- `logs/red.log` retains three initial failures for emissive covers, absent local finishes and absent header structure.
- `logs/focused.log` retains the later ownership-classification failure, seven materials where the old test expected zero. I inspected that failure and the production disposal path. The current singleton-aware assertion and independent 34-test rerun pass.
- Existing build logs retain the large-chunk warning. I did not rerun the build or full test suite, and do not present their retained logs as my own execution.
- No failure artifact was deleted or rewritten. No runtime source was edited, no GPU job was launched and nothing was published. The only reviewer-created file is this report.
