# Room16 stage3 independent review

## Verdict

FAIL for the bounded room-visuals stage. The new plate tops and framed rear wall improve the stage2 rough, but the plate skirts have reversed winding. The major organ also still reads more like a manufactured three-way conveyor than growth seizing a human distributor. This is not a judgment on later fine-detail work, mobile, HUD, live combat, release or human acceptance.

## Evidence reviewed

I viewed the original current `capture/16-swarm-junction-gameplay.png` and `capture/16-swarm-junction-overview.png`, plus both original stage2 `rough-gameplay.png` and `rough-overview.png` under `docs/art-evidence/room16-story-flow-v3/stage-2/attempt-1012/` in the worktree. Both current images are 1280 by 900. Neither is blank or transitional. They show the intended room and staged actors.

I independently verified exactly two unique current manifest image rows, matching PNG SHA256 hashes, and all 92 capture source pins against the checkout. The effective source is HEAD `8185b11b0a11e1d7916c5ea4e371edc5fec6bea3` plus the two dirty SwarmJunction files, not that commit alone. The worktree diff and final status contain only `src/render/SwarmJunction.ts` and `src/render/SwarmJunction.test.ts`.

The manifest labels this controlled simulation, with legal staged actors, an inactive encounter director and no DOM HUD. The gameplay image uses production camera/composition. The overview fits the room. This review does not turn that evidence into live encounter or HUD coverage.

## Pixel findings

The three directions remain easy to separate in both views. The central dark recess is framed by blue-grey metal. The organ stops above the staged player, and the open southern floor and side escape space remain visible. The overview retains the north bypass and the broken directional gantry. There is no new pulse or boss-like luminous focal point.

The new plate crowns produce visible curved highlights that were absent from the flat stage2 slabs. The overview rear bulkhead now has dark framed bays rather than a nearly continuous blue strip. These are real changes in the pixels, not conclusions drawn from object names or material settings.

The remaining visual problem is at major-form scale. Both long branches have very straight pink-brown sidewalls, identical pale cross-bands and regularly spaced dark tops. The short southern branch resembles a small stair or belt. The metal distributor sits cleanly inside a broad, flat triangular bed, with little visible transition between encroaching growth and retained machinery. Charcoal, pale rib and metal colors separate, but organic and manufactured construction are not yet distinct enough. The added small conduit ends are visible inside the cavity at gameplay scale, but they do not resolve that larger reading. This can be addressed with broad plate overlap, tapered organic mass and clearer capture of the existing hub within the sealed footprint. Tiny damage details are not the missing gate.

## Independent CPU checks

- `npx vitest run src/render/SwarmJunction.test.ts` exited 0. All 11 tests passed. A second run is retained in `independent-focused.log`.
- The focused suite checks the sealed footprint and anchors, other-room template hash, planned routes and connected usable space at radii 16 and 28, service-path height, collision containment, pre/post-bake top-surface occupancy, fallback-height shot silhouette, gantry gap/support, disposal ownership and room-ID isolation.
- The existing batching test passes its limits of fewer than 100 source meshes and at most 7 baked meshes. My direct builder inspection counted 81 source meshes and 6 materials. I did not measure new GPU timing or claim a new performance budget.
- `independent-geometry-check.mjs` constructs the actual current builder on CPU, using TypeScript transpilation and Three. It inspects indexed face normals, interior vertex normals and directed edge incidence. Its final execution exits 1 because of the defect below. Results are retained in `independent-geometry-results.json` and `independent-geometry.log`.

## Blocking construction defect

`src/render/SwarmJunction.ts:52` emits side-wall triangles opposite to the top/bottom shell orientation. The later global winding flip does not correct their orientation relative to those caps.

Across all 12 crowned plates, every top face points upward and every bottom face points downward. No triangle is degenerate, and every undirected edge has two incident faces. However, all 48 side triangles per plate point inward, giving 576 inward side faces overall. Each plate also has 48 cap-to-side edges traversed in the same direction by both incident triangles instead of opposite directions. Interior top vertex normals remain upward, so a top-only normal check would miss this.

The material uses the default front-side rendering. The reversed skirts therefore do not present proper outward-facing closures and contaminate smoothed rim normals. The retained overhead images show the crown highlights, but they do not prove the skirts render correctly. I am not claiming every highlight artifact is caused by winding. The independent geometry result is enough to reject the claim of a correctly closed outward-facing shell.

Reverse the side-wall face order relative to its current order, then add an outward-side or directed-edge regression. Recheck the retained camera views afterward. Do not reverse the already-correct top surfaces or use double-sided material to conceal the error. The new test currently checks height diversity on one plate and material/object presence, which does not catch this defect.

## Scope and limits

No runtime files were edited, no GPU or capture was launched, and no commit was made. No additional art generation or model iteration was consumed by this review, preserving the delegated four/two production budgets. Existing clearance and batching contracts passed; their success is not pixel approval. The parent's full test/build/room-evidence results were not rerun or represented as independent results here.

The first standalone geometry check could not import an unavailable esbuild package. I replaced that review-only dependency with the installed TypeScript transpiler. The completed CPU check then exposed the winding defect above. No installation or runtime workaround was made.

This verdict requires a corrected candidate and another scoped review. It grants no approval, merge or deployment authority.
