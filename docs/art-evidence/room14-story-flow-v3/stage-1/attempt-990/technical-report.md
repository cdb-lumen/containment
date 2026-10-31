# Room14 stage1 artifact and CPU report

## Result

Produced `layout-draft.png`, `layout.json`, `make_layout.py`, `validate-layout.ts`, `validation.json`, `validation.log` and `brief.md`. The final CPU run passed 123 assertions with zero failures. The PNG is 1900 by 1360. No runtime file, shared helper, guard, receipt or publication record changed. No GPU or browser job ran.

The author inspected both rendered versions with the image tool. The final image separates the exit label from the shaft label, preserves the visible C route, shows every breach, and states the exact below-landing AI boundary. The inset distinguishes baseline solids from the proposed shaft. This is an author self-review, not independent or parent acceptance.

## Evidence and commands

Worktree: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3`.

Source HEAD: `798753f86523611501493ff2a1a2ad4f2d8a1a7e`.

Fresh base supplied by the parent and verified as local origin/main: `7a3f262886104fb024de9684958b3f85a8859f34`.

The branch was clean before authoring and is `art/service-shaft-landing-v3`. Live issue35 and issue21 were read. PR79 was OPEN and draft on that branch. Current local routing selects Room14, stage1. The human review projection has no Room14 item. Current policies, canonical brief, stage0 original PNG, stage0 brief and independent review were read.

Executed:

```sh
tsx /home/chernodubv/.hermes/workspaces/containment-art-roadmap/service-shaft-landing/story-flow-v3/stage-1/attempt-990/validate-layout.ts
python /home/chernodubv/.hermes/workspaces/containment-art-roadmap/service-shaft-landing/story-flow-v3/stage-1/attempt-990/make_layout.py
git diff --check
```

The final validation and render command exited zero. `git diff --check` exited zero before staging the artifact copies. No test-suite, build, browser smoke or live-combat result is claimed. The worktree has no local esbuild binary, so the check uses the installed `tsx` to import current TypeScript helpers directly. No dependency installation was needed.

## Focused validation

The checker uses `createExpeditionGeometry`, `canOccupyExpedition`, `canTraverseExpedition` and `FacilityNavigation` from the current worktree. It does not reimplement production collision or navigation. The proposed geometry is an in-memory overlay with the unchanged boundary walls and the JSON shaft polygon. This is not runtime registration.

- The production envelope, player spawn, exit and four breach anchors match exactly.
- Both original breach positions and their 56-unit inward spawn offsets remain reachable.
- All proposed activity centers connect to the same component.
- Radii 16, 28 and 30 cover the player, largest standard enemy and the navigation clearance margin.
- Every amber, cyan and local-control segment passes the production swept check at all three radii.
- The shaft interior, straight entry-to-exit crossing and east-mouth shortcut correctly reject occupancy or traversal.
- Fixture reservations remain inside the void. Fixture samples use a 2-unit interior lattice, not an authored mesh or overhang audit.
- All 45 production-navigation CPU trips finish, with a maximum of 724 three-unit steps. Every step passes swept traversal at radius28. These are isolated pursuer paths without crowd steering, attack behavior or pickups.

| Geometry | Radius | Sweep-legal sampled centers | Reached | Occupancy-only diagnostic centers |
|---|---:|---:|---:|---:|
| Baseline | 16 | 1955 | 1955 | 0 |
| Baseline | 28 | 1851 | 1851 | 7 |
| Baseline | 30 | 1809 | 1809 | 42 |
| Proposal | 16 | 1650 | 1650 | 0 |
| Proposal | 28 | 1531 | 1531 | 0 |
| Proposal | 30 | 1528 | 1528 | 0 |

Sampling uses a 20-unit four-neighbor lattice. Exact anchors attach through separately checked swept edges within 40 units. This is finite sampled connectivity, not a mathematical proof for every continuous floor coordinate.

## Initial failures and corrected oracle

Raw initial script, JSON and log are retained as `initial-validate-layout.ts`, `initial-validation.json` and `initial-validation.log`. That run had 116 passes and seven failures. They were all in baseline comparison checks. The proposal checks and navigation trips did not fail. No draft coordinates or production helpers changed to obtain the final result.

Two mistakes in the local comparison checker explain the change:

1. It tested the proposed control approach at 280/405 against the unchanged baseline obstacles. That approach is a new proposal anchor, not an existing production anchor. Its baseline radius28 circle overlaps the old rectangle at 290/180 through 540/390. Baseline checks now cover only canonical entry, exit, breaches and inward offsets. Proposal checks still cover every activity center, including this approach. No proposal anchor was removed.
2. It classified lattice nodes using circle occupancy alone, then classified graph edges using the production sweep helper. For baseline rectangles these helpers intentionally differ: circle occupancy uses distance to the nearest rectangle point, while traversal tests an axis-aligned rectangle expanded by radius. A point can fit around a corner, or touch a boundary, yet fail even the zero-length sweep. This created seven baseline occupancy-only nodes at radius28 and 42 at radius30. The corrected graph contains centers that pass both occupancy and the production zero-length sweep, so node and edge legality use a consistent movement contract. Every excluded coordinate is retained in `validation.json` under `connectivity[].occupancyOnly`.

This does not fix or waive the baseline helper mismatch. It limits the baseline claim to sweep-legal sampled space and preserved anchors. The proposed polygon has zero excluded occupancy-only centers at every tested radius, so its final graph contains exactly the same nodes as in the initial run. Proposal connectivity and the route tests were not weakened. No shared algorithm or broad acceptance threshold changed.

## Remaining scope

The diagram proposes a single east-open shaft in place of the baseline's three disconnected rectangular solids. This topology change is explicit in the PNG and brief and needs independent and parent review before implementation. It retains all required progression anchors, not the old solid footprints.

Runtime placement, rail collision, shipping-camera shaft-depth visibility, crowded combat, dropped pickups and final art remain unverified. Generic boss-center metadata is inside the proposed void and needs room-consumer review during integration; this diagram does not claim boss placement support. No boss or gameplay source was changed.

Publication, independent review, parent review and receipt are intentionally left to the parent. No commit or push occurred.
