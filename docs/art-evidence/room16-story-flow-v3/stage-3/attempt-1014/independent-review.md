# Room16 stage3 independent review, attempt1014

Verdict: FAIL for major-form room identity. Technical geometry and bounded clearance checks pass. This is not a final-detail rejection.

## Evidence and scope

I loaded both attempt1014 PNGs and both attempt1013 repaired PNGs through vision_analyze. I read the current renderer, its focused tests and the previous parent review. The parent concern was supplied before review, so this is independent judgment, not a blind review.

These are controlled simulation captures with staged actors and the production camera/composer, without DOM HUD. The overview has fitted framing. They do not establish ordinary gameplay or live encounter behavior. HUD and mobile are not gates here. No GPU capture, runtime edit, approval, merge or deployment was performed.

## Visual findings

The candidate improves substantially on attempt1013. The pale repeated cross-bars and pink-grey platform are gone. Unequal rounded shells now produce broad highlights instead of conveyor stripes. The hub has a visible dark oval recess with a rounded raised lip, rather than the previous small rectangular cabinet opening. These changes are visible in both views.

The remaining major-form defects are:

1. The straight-sided Y bed still determines the complete silhouette. Long uninterrupted planar sidewalls run beneath both diagonal branches and meet a square-ended southern stem. The curved shells sit inside that outline. At overview scale especially, I read a fabricated Y-shaped platform carrying curved covers, rather than three organic roots forming the body. Making the platform charcoal reduced its color dominance but did not remove its structural dominance.
2. The human/alien relationship is not yet legible. At the hub, a blue-grey upright edge and folded lid border the oval opening. They read as a small mechanical fitting on the same platform, not a severed distributor overtaken by an alien routing organ. The smooth blue-grey shell highlights and nearby metal pieces share too much of the visible material character. The small exposed remnants do not establish the underlying human apparatus or a clear takeover junction.

Three directional branches pass as a spatial arrangement. Their organic-root identity fails with the first defect. The recessed cavity passes as a major shape: its black interior, raised curved rim and depth are readable. Its specifically sensory function remains ambiguous, but I would not fail this stage solely for missing sensory detail. The room's distinctive Y arrangement is clear; the required alien-over-human story is not.

Preserve the larger recess, unequal shell rhythm and removal of bright repeated ribs. The next major-form change needs to change the visible relationship between shell, straight bed and broken apparatus. Adding small surface details would not resolve the present reading. This review does not authorize changing the sealed collision contract.

## Technical review and actual execution

Worktree: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/swarm-junction-v3`.

I ran `npx vitest run src/render/SwarmJunction.test.ts`. Result: one test file passed, 13 tests passed, exit code 0.

The actual new crown construction bows the plan edges and builds nine closed shells. Its skirt index order preserves the previous winding repair. The lip uses four connected rings. The executed test checks opposite directed edge incidence, an inverted-triangle negative control, nondegenerate triangles, positive signed volume, upward crown tops and downward bottoms. It separately checks lip upper slopes, inward-facing cavity wall and downward underside. No winding defect was found. Crown skirts are covered by closed directed-edge consistency and cap orientation, not a separate per-skirt radial-normal assertion.

Clearance coverage includes all raised solid vertices inside the sealed polygon, sampled downward rays against occupancy before and after production bake, planned route traversal and connected usable space at actor radii 16 and 28, unchanged room anchors, flush service-path height, and fallback-height shot rays before and after bake. These checks passed. They support bounded geometry/clearance acceptance, not exhaustive continuous collision proof or live combat acceptance.

The cavity test confirms a broad recess, a lip more than seven game units above its floor, and a center ray hitting the recess first. The material tests confirm parameter differences, but cannot establish the visual human/alien distinction. Mesh names and successful shell-count assertions do not prove room identity.

Current renderer SHA-256 matches the capture source pin:
`cb73e3baa6a971cdd43b273ea81702efe1e8e8be691f99eb72a6b0ea2cff4230`.

Reviewed test SHA-256:
`f6ce0f88bcd975cd210ea57f2a7dd901ad077fd0b5e75b7cc5a1ff01acded411`.

## Reviewed PNG hashes

All paths below are relative to `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/swarm-junction/story-flow-v3/stage-3/`. SHA-256 values were computed from the exact original files.

| File | SHA-256 |
| --- | --- |
| `attempt-1014/capture/16-swarm-junction-gameplay.png` | `d0e39cfb7d91f6118de3107dca8c6bec56bfea61b8dd2457b678c67ce515d49e` |
| `attempt-1014/capture/16-swarm-junction-overview.png` | `be34ddd6ffde386ca0744d12f533b3bd9f0dc5b84d195e9bc338445024230cc6` |
| `attempt-1013/repaired/capture/16-swarm-junction-gameplay.png` | `093b005c2b012862caca13ec1f169a18eee87047ef9736a11d8b176c96b75015` |
| `attempt-1013/repaired/capture/16-swarm-junction-overview.png` | `0e75c7fa3247680b2c4c03d3b84ec1c45da74f096c834f85652a5fbb97ac3ad0` |

No review blocker was encountered. Only this review document was intentionally written. No reusable new workflow was developed during this bounded review.
